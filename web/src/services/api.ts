import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export interface WeatherInputRecord {
    timestamp: string; // ISO 8601
    temperature_2m: number;
    relative_humidity_2m: number;
    dew_point_2m: number;
    surface_pressure: number;
    precipitation: number;
    cloud_cover: number;
    shortwave_radiation: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    soil_temperature_0_to_7cm: number;
    weather_code: number;
}

export interface PredictionRequest {
    recent_history: WeatherInputRecord[];
}

export interface PredictionResponse {
    predictions: number[];
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const predictWeather = async (data: PredictionRequest): Promise<PredictionResponse> => {
    const response = await apiClient.post<PredictionResponse>('/predict', data);
    return response.data;
};
