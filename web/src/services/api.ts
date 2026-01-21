import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD
    ? 'https://api.metrocast.enesdemir.me/predict'
    : 'http://localhost:3000/predict';

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
    // The proxy rewrite handles adding '/predict' if we use an empty path, 
    // or we can just call it directly if the proxy target is just the host.
    // In my vite config, I rewrite /api/predict -> /predict
    const response = await apiClient.post<PredictionResponse>('', data);
    return response.data;
};
