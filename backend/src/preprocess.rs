//! Preprocessing module for MetroCast-AI inference pipeline.
//!
//! Replicates Python's preprocessing logic from `dataset.py`:
//! 1. Time Encoding - sin/cos for hour, day, month
//! 2. Normalization - z-score using precomputed mean/std
//! 3. Tensor Construction - (1, 24, 16) ndarray for model input

use chrono::{DateTime, Datelike, Timelike, Utc};
use ndarray::Array3;
use serde::Deserialize;
use std::f32::consts::PI;
use std::fs;
use std::path::Path;

/// Statistics loaded from statistics.json
#[derive(Debug, Deserialize)]
pub struct Statistics {
    pub mean: Vec<f32>,
    pub std: Vec<f32>,
    pub input_cols: Vec<String>,
}

impl Statistics {
    /// Load statistics from JSON file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let stats: Statistics = serde_json::from_str(&content)?;
        Ok(stats)
    }

    /// Get the number of features
    pub fn num_features(&self) -> usize {
        self.mean.len()
    }
}

/// Time encoding components (sin/cos for hour, day, month)
#[derive(Debug, Clone, Copy)]
pub struct TimeEncoding {
    pub hour_sin: f32,
    pub hour_cos: f32,
    pub day_sin: f32,
    pub day_cos: f32,
    pub month_sin: f32,
    pub month_cos: f32,
}

impl TimeEncoding {
    /// Compute time encodings from a DateTime (matching Python's dataset.py)
    ///
    /// Formulas:
    /// - hour: sin/cos(2π × hour / 24)
    /// - day: sin/cos(2π × day / 365)  -- uses day of month, not day of year
    /// - month: sin/cos(2π × (month - 1) / 12)
    pub fn from_datetime<Tz: chrono::TimeZone>(dt: &DateTime<Tz>) -> Self {
        let hour = dt.hour() as f32;
        let day = dt.day() as f32;
        let month = dt.month() as f32;

        let two_pi = 2.0 * PI;

        TimeEncoding {
            hour_sin: (two_pi * hour / 24.0).sin(),
            hour_cos: (two_pi * hour / 24.0).cos(),
            day_sin: (two_pi * day / 365.0).sin(),
            day_cos: (two_pi * day / 365.0).cos(),
            month_sin: (two_pi * (month - 1.0) / 12.0).sin(),
            month_cos: (two_pi * (month - 1.0) / 12.0).cos(),
        }
    }

    /// Convert to array in the expected order
    pub fn to_array(&self) -> [f32; 6] {
        [
            self.hour_sin,
            self.hour_cos,
            self.day_sin,
            self.day_cos,
            self.month_sin,
            self.month_cos,
        ]
    }
}

/// Single hourly weather observation (raw values before normalization)
#[derive(Debug, Clone)]
pub struct WeatherRecord {
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
    /// WMO weather code (0-99) - NOT normalized, passed through embedding layer
    pub weather_code: f32,
}

impl WeatherRecord {
    /// Extract weather features as array (10 features, matching statistics.json order)
    pub fn weather_features(&self) -> [f32; 10] {
        [
            self.temperature_2m,
            self.relative_humidity_2m,
            self.dew_point_2m,
            self.surface_pressure,
            self.precipitation,
            self.cloud_cover,
            self.shortwave_radiation,
            self.wind_speed_10m,
            self.wind_direction_10m,
            self.soil_temperature_0_to_7cm,
        ]
    }

    /// Get all 17 features (10 weather + 6 time encodings + 1 weather_code) in order
    /// Note: weather_code is last and NOT normalized (handled by embedding layer)
    pub fn all_features(&self) -> [f32; 17] {
        let weather = self.weather_features();
        let time = TimeEncoding::from_datetime(&self.timestamp).to_array();

        [
            weather[0],  // temperature_2m
            weather[1],  // relative_humidity_2m
            weather[2],  // dew_point_2m
            weather[3],  // surface_pressure
            weather[4],  // precipitation
            weather[5],  // cloud_cover
            weather[6],  // shortwave_radiation
            weather[7],  // wind_speed_10m
            weather[8],  // wind_direction_10m
            weather[9],  // soil_temperature_0_to_7cm
            time[0],     // hour_sin
            time[1],     // hour_cos
            time[2],     // day_sin
            time[3],     // day_cos 
            time[4],     // month_sin
            time[5],     // month_cos
            self.weather_code, // NOT normalized - raw WMO code
        ]
    }
}

/// Normalize a feature value using z-score: (x - mean) / std
#[inline]
pub fn normalize(value: f32, mean: f32, std: f32) -> f32 {
    (value - mean) / std
}

/// Normalize the first 16 features using statistics
/// weather_code (index 16) is NOT normalized - it goes through embedding
pub fn normalize_features(features: &[f32; 17], stats: &Statistics) -> [f32; 17] {
    let mut normalized = [0.0f32; 17];
    // Normalize first 16 features (continuous)
    for i in 0..16 {
        normalized[i] = normalize(features[i], stats.mean[i], stats.std[i]);
    }
    // Keep weather_code as-is (will be embedded by model)
    normalized[16] = features[16];
    normalized
}

/// Preprocess a sequence of 24 weather records into model input tensor.
///
/// Returns `Array3<f32>` with shape (1, 24, 17):
/// - 1 = batch size
/// - 24 = sequence length (hours)
/// - 17 = feature count (10 weather + 6 time encodings + 1 weather_code)
///
/// Note: First 16 features are normalized, weather_code (index 16) is raw.
///
/// # Arguments
/// * `records` - Exactly 24 WeatherRecord entries (one per hour)
/// * `stats` - Statistics for normalization (must have 16 entries)
///
/// # Errors
/// Returns error if records length is not 24
pub fn preprocess_sequence(
    records: &[WeatherRecord],
    stats: &Statistics,
) -> Result<Array3<f32>, PreprocessError> {
    const SEQ_LEN: usize = 24;
    const NUM_FEATURES: usize = 17; // 16 normalized + 1 weather_code

    if records.len() != SEQ_LEN {
        return Err(PreprocessError::InvalidSequenceLength {
            expected: SEQ_LEN,
            got: records.len(),
        });
    }

    // stats should have 16 entries (for normalized features)
    // output tensor has 17 features (16 normalized + 1 raw weather_code)
    const NORMALIZED_FEATURES: usize = 16;

    if stats.num_features() != NORMALIZED_FEATURES {
        return Err(PreprocessError::InvalidFeatureCount {
            expected: NORMALIZED_FEATURES,
            got: stats.num_features(),
        });
    }

    // Create tensor with shape (1, 24, 17)
    let mut tensor = Array3::<f32>::zeros((1, SEQ_LEN, NUM_FEATURES));

    for (t, record) in records.iter().enumerate() {
        let features = record.all_features();
        let normalized = normalize_features(&features, stats);

        for (f, &value) in normalized.iter().enumerate() {
            tensor[[0, t, f]] = value;
        }
    }

    Ok(tensor)
}

/// Errors that can occur during preprocessing
#[derive(Debug)]
pub enum PreprocessError {
    InvalidSequenceLength { expected: usize, got: usize },
    InvalidFeatureCount { expected: usize, got: usize },
}

impl std::fmt::Display for PreprocessError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PreprocessError::InvalidSequenceLength { expected, got } => {
                write!(f, "Invalid sequence length: expected {}, got {}", expected, got)
            }
            PreprocessError::InvalidFeatureCount { expected, got } => {
                write!(f, "Invalid feature count: expected {}, got {}", expected, got)
            }
        }
    }
}

impl std::error::Error for PreprocessError {}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn test_time_encoding_midnight() {
        // 2024-01-01 00:00:00 UTC
        let dt = Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap();
        let enc = TimeEncoding::from_datetime(&dt);

        // hour=0: sin(0) = 0, cos(0) = 1
        assert!((enc.hour_sin - 0.0).abs() < 1e-6);
        assert!((enc.hour_cos - 1.0).abs() < 1e-6);

        // day=1: sin(2π × 1/365), cos(2π × 1/365)
        let expected_day_sin = (2.0 * PI * 1.0 / 365.0).sin();
        let expected_day_cos = (2.0 * PI * 1.0 / 365.0).cos();
        assert!((enc.day_sin - expected_day_sin).abs() < 1e-6);
        assert!((enc.day_cos - expected_day_cos).abs() < 1e-6);

        // month=1: sin(2π × 0/12) = 0, cos(2π × 0/12) = 1
        assert!((enc.month_sin - 0.0).abs() < 1e-6);
        assert!((enc.month_cos - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_time_encoding_noon() {
        // 2024-07-15 12:00:00 UTC
        let dt = Utc.with_ymd_and_hms(2024, 7, 15, 12, 0, 0).unwrap();
        let enc = TimeEncoding::from_datetime(&dt);

        // hour=12: sin(π) ≈ 0, cos(π) = -1
        assert!((enc.hour_sin - 0.0).abs() < 1e-6);
        assert!((enc.hour_cos - (-1.0)).abs() < 1e-6);

        // month=7: sin(2π × 6/12) = sin(π) ≈ 0, cos(π) = -1
        assert!((enc.month_sin - 0.0).abs() < 1e-6);
        assert!((enc.month_cos - (-1.0)).abs() < 1e-6);
    }

    #[test]
    fn test_normalization() {
        let mean = 15.0;
        let std = 5.0;
        let value = 20.0;

        let normalized = normalize(value, mean, std);
        assert!((normalized - 1.0).abs() < 1e-6); // (20-15)/5 = 1
    }

    #[test]
    fn test_weather_record_features() {
        let dt = Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap();
        let record = WeatherRecord {
            timestamp: dt,
            temperature_2m: 10.0,
            relative_humidity_2m: 80.0,
            dew_point_2m: 7.0,
            surface_pressure: 1013.0,
            precipitation: 0.0,
            cloud_cover: 50.0,
            shortwave_radiation: 100.0,
            wind_speed_10m: 15.0,
            wind_direction_10m: 180.0,
            soil_temperature_0_to_7cm: 8.0,
            weather_code: 3.0, // Cloudy
        };

        let features = record.weather_features();
        assert_eq!(features.len(), 10);
        assert!((features[0] - 10.0).abs() < 1e-6); // temperature_2m
    }

    #[test]
    fn test_preprocess_sequence_shape() {
        let stats = Statistics {
            mean: vec![0.0; 16],
            std: vec![1.0; 16],
            input_cols: vec!["test".to_string(); 16],
        };

        // Create 24 dummy records
        let records: Vec<WeatherRecord> = (0..24)
            .map(|h| {
                let dt = Utc.with_ymd_and_hms(2024, 1, 1, h as u32, 0, 0).unwrap();
                WeatherRecord {
                    timestamp: dt,
                    temperature_2m: 10.0,
                    relative_humidity_2m: 80.0,
                    dew_point_2m: 7.0,
                    surface_pressure: 1013.0,
                    precipitation: 0.0,
                    cloud_cover: 50.0,
                    shortwave_radiation: 100.0,
                    wind_speed_10m: 15.0,
                    wind_direction_10m: 180.0,
                    soil_temperature_0_to_7cm: 8.0,
                    weather_code: 0.0, // Sunny
                }
            })
            .collect();

        let tensor = preprocess_sequence(&records, &stats).unwrap();
        assert_eq!(tensor.shape(), &[1, 24, 17]); // 16 normalized + 1 weather_code
    }

    #[test]
    fn test_invalid_sequence_length() {
        let stats = Statistics {
            mean: vec![0.0; 16],
            std: vec![1.0; 16],
            input_cols: vec!["test".to_string(); 16],
        };

        let records: Vec<WeatherRecord> = vec![]; // Empty

        let result = preprocess_sequence(&records, &stats);
        assert!(result.is_err());
    }
}
