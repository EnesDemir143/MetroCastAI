import axios from 'axios';
import type { WeatherInputRecord } from './api';



/**
 * Fetches sample weather data from the configured S3 URL.
 * Returns a promise that resolves to an array of WeatherInputRecord.
 */
export const fetchS3SampleData = async (): Promise<WeatherInputRecord[]> => {
    // configured in vite.config.ts proxy
    const PROXY_URL = '/api/s3-data/istanbul_weather.csv';

    try {
        const response = await axios.get<WeatherInputRecord[]>(PROXY_URL);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch data from S3:', error);
        throw new Error('Failed to load sample data from S3.');
    }
};
