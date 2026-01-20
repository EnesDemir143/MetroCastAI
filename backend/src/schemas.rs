use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Deserialize, ToSchema)]
pub struct PredictionRequest {
    /// Exactly 24 hourly records of recent history
    pub recent_history: Vec<WeatherInputRecord>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct WeatherInputRecord {
    pub timestamp: DateTime<Utc>,
    pub temperature_2m: f32,
    pub relative_humidity_2m: f32,
    pub dew_point_2m: f32,
    pub surface_pressure: f32,
    pub precipitation: f32,
    pub cloud_cover: f32,
    pub shortwave_radiation: f32,
    pub wind_speed_10m: f32,
    pub wind_direction_10m: f32,
    pub soil_temperature_0_to_7cm: f32,
    /// Raw WMO weather code (0-99)
    pub weather_code: f32,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct PredictionResponse {
    /// 24 predicted hourly temperatures in Celsius
    pub predictions: Vec<f32>,
}
