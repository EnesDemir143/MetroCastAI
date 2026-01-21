import axios from 'axios';
import type { WeatherInputRecord } from './api';



const parseCSV = (csvText: string): WeatherInputRecord[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(',');
        const record: any = {};
        headers.forEach((header, index) => {
            const val = values[index];
            if (header === 'time' || header === 'timestamp') {
                // Ensure timestamp is in valid ISO 8601 format for the backend
                // If it's missing 'Z' or offset, we append 'Z' after making it a proper ISO string
                const date = new Date(val.includes('Z') ? val : `${val}:00Z`);
                record.timestamp = date.toISOString();
            } else {
                record[header] = parseFloat(val);
            }
        });
        return record as WeatherInputRecord;
    });
};

/**
 * Fetches sample weather data from the configured S3 URL.
 * Returns a promise that resolves to an array of WeatherInputRecord.
 */
export const fetchS3SampleData = async (): Promise<WeatherInputRecord[]> => {
    // configured in vite.config.ts proxy
    const PROXY_URL = import.meta.env.PROD
        ? 'https://api.metrocast.enesdemir.me/s3-data'
        : 'http://localhost:3000/s3-data';

    try {
        const response = await axios.get(PROXY_URL, { responseType: 'text' });
        return parseCSV(response.data);
    } catch (error) {
        console.error('Failed to fetch data from S3:', error);
        throw new Error('Failed to load sample data from S3.');
    }
};
