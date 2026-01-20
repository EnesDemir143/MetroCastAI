use axum::{extract::State, http::StatusCode, Json};
use ort::session::Session;
use std::sync::{Arc, Mutex};

use crate::preprocess::{preprocess_sequence, Statistics, WeatherRecord};
use crate::schemas::{PredictionRequest, PredictionResponse};

/// Shared application state
/// Session is wrapped in Mutex because run() requires mutable access in this version/usage
pub struct AppState {
    pub session: Mutex<Session>,
    pub stats: Statistics,
}

/// Handler for prediction endpoint
///
/// Steps:
/// 1. Validate input length (must be 168 hours / 7 days)
/// 2. Preprocess input (normalize + time encoding) -> Tensor
/// 3. Run ONNX model inference
/// 4. Denormalize output (predicted temperature)
/// 5. Return JSON response
/// 5. Return JSON response
#[utoipa::path(
    post,
    path = "/predict",
    tag = "prediction",
    request_body = PredictionRequest,
    responses(
        (status = 200, description = "Prediction successful", body = PredictionResponse),
        (status = 400, description = "Invalid input data"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn predict(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PredictionRequest>,
) -> Result<Json<PredictionResponse>, (StatusCode, String)> {
    // 1. Validation and mapping
    if payload.recent_history.len() != 168 {
        return Err((
            StatusCode::BAD_REQUEST,
            format!("Expected 168 hourly records, got {}", payload.recent_history.len()),
        ));
    }

    let records: Vec<WeatherRecord> = payload
        .recent_history
        .into_iter()
        .map(|r| WeatherRecord {
            timestamp: r.timestamp,
            temperature_2m: r.temperature_2m,
            relative_humidity_2m: r.relative_humidity_2m,
            dew_point_2m: r.dew_point_2m,
            surface_pressure: r.surface_pressure,
            precipitation: r.precipitation,
            cloud_cover: r.cloud_cover,
            shortwave_radiation: r.shortwave_radiation,
            wind_speed_10m: r.wind_speed_10m,
            wind_direction_10m: r.wind_direction_10m,
            soil_temperature_0_to_7cm: r.soil_temperature_0_to_7cm,
            weather_code: r.weather_code,
        })
        .collect();

    // 2. Preprocessing
    // Returns tensor of shape (1, 168, 17)
    let input_tensor = preprocess_sequence(&records, &state.stats).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Preprocessing error: {}", e),
        )
    })?;

    // 3. Inference
    // Create input value from tensor (pass by value to satisfy OwnedTensorArrayData)
    // We convert Array3 to (shape, vec) tuple which is reliably supported by ort
    let shape = input_tensor.shape().to_vec();
    let data = input_tensor.into_raw_vec();
    let input_value = ort::value::Value::from_array((shape, data)).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to create input value: {}", e),
        )
    })?;

    let inputs = ort::inputs!["input" => input_value].map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to create inputs: {}", e),
        )
    })?;

    // Lock the session
    let session = state.session.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to acquire model lock".to_string(),
        )
    })?;

    let outputs = session
        .run(inputs)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Inference failed: {}", e),
            )
        })?;

    // 4. Extract and Denormalize
    // Try to get "output" directly, otherwise take the first output
    // We must copy the data out because ValueRef lives only as long as outputs/session lock
    let output_raw: Vec<f32> = if let Some(val) = outputs.get("output") {
        let tensor = val.try_extract_tensor::<f32>().map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to extract output tensor: {}", e),
            )
        })?;
        tensor.iter().copied().collect()
    } else if let Some(val) = outputs.values().next() {
        let tensor = val.try_extract_tensor::<f32>().map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to extract output tensor: {}", e),
            )
        })?;
        tensor.iter().copied().collect()
    } else {
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            "Model returned no outputs".to_string(),
        ));
    };

    // Get denormalization stats for target (temperature_2m is at index 0)
    let target_mean = state.stats.mean.get(0).ok_or((
        StatusCode::INTERNAL_SERVER_ERROR,
        "Statistics corrupted: missing mean for index 0".to_string(),
    ))?;
    let target_std = state.stats.std.get(0).ok_or((
        StatusCode::INTERNAL_SERVER_ERROR,
        "Statistics corrupted: missing std for index 0".to_string(),
    ))?;

    // Denormalize: value * std + mean
    // We expect 168 prediction steps
    // Explicit type for loop variable to help type inference
    let predictions: Vec<f32> = output_raw
        .iter()
        .map(|val: &f32| val * target_std + target_mean)
        .collect();

    Ok(Json(PredictionResponse { predictions }))
}
