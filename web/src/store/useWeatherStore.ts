import { create } from 'zustand';
import { predictWeather } from '../services/api';
import { fetchS3SampleData } from '../services/s3Service';
import type { PredictionRequest, WeatherInputRecord } from '../services/api';
import type { Language } from '../utils/translations';

interface WeatherState {
    inputHistory: WeatherInputRecord[];
    predictions: number[] | null;

    // Developer Console State (Independent)
    consoleHistory: WeatherInputRecord[];
    consolePredictions: number[] | null;

    realData: number[] | null;
    isLoading: boolean;
    isConsoleLoading: boolean;
    error: string | null;
    consoleError: string | null;
    language: Language;
    activeTab: 'temperature' | 'precipitation' | 'wind';
    displayedTemp: number | string | null;
    selectedDayIndex: number;
    isLoadingSample: boolean;

    setInputHistory: (history: WeatherInputRecord[]) => void;
    setConsoleHistory: (history: WeatherInputRecord[]) => void;
    setRealData: (data: number[]) => void;
    fetchPrediction: () => Promise<void>;
    fetchConsolePrediction: () => Promise<void>;
    reset: () => void;
    setLanguage: (lang: Language) => void;
    setActiveTab: (tab: 'temperature' | 'precipitation' | 'wind') => void;
    setDisplayedTemp: (temp: number | string | null) => void;
    setSelectedDayIndex: (index: number) => void;
    fetchSampleData: () => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
    inputHistory: [],
    predictions: null,

    consoleHistory: [],
    consolePredictions: null,

    realData: null,
    isLoading: false,
    isConsoleLoading: false,
    error: null,
    consoleError: null,
    language: 'tr',
    activeTab: 'temperature',
    displayedTemp: null,
    selectedDayIndex: 0,
    isLoadingSample: false,

    setInputHistory: (history) => set({ inputHistory: history, error: null }),
    setConsoleHistory: (history) => set({ consoleHistory: history, consoleError: null }),
    setRealData: (data) => set({ realData: data }),
    setLanguage: (lang) => set({ language: lang }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setDisplayedTemp: (temp) => set({ displayedTemp: temp }),
    setSelectedDayIndex: (index: number) => set({ selectedDayIndex: index }),

    fetchPrediction: async () => {
        const { inputHistory } = get();
        if (inputHistory.length !== 168) {
            set({ error: 'Exactly 168 hours (7 days) of history are required.' });
            return;
        }
        set({ isLoading: true, error: null });
        try {
            const request: PredictionRequest = { recent_history: inputHistory };
            const response = await predictWeather(request);
            set({ predictions: response.predictions, isLoading: false });
        } catch (err: any) {
            console.error(err);
            set({
                error: err.response?.data || err.message || 'Failed to fetch prediction',
                isLoading: false
            });
        }
    },

    fetchConsolePrediction: async () => {
        const { consoleHistory } = get();
        if (consoleHistory.length !== 168) {
            set({ consoleError: '168 hours of history required.' });
            return;
        }
        set({ isConsoleLoading: true, consoleError: null });
        try {
            const request: PredictionRequest = { recent_history: consoleHistory };
            const response = await predictWeather(request);
            set({ consolePredictions: response.predictions, isConsoleLoading: false });
        } catch (err: any) {
            set({
                consoleError: err.response?.data || err.message || 'Inference error',
                isConsoleLoading: false
            });
        }
    },

    fetchSampleData: async () => {
        set({ isLoadingSample: true, error: null });
        try {
            const data = await fetchS3SampleData();
            const history = data.slice(-168);

            // Sync both main and console initially with sample data
            set({
                inputHistory: history,
                consoleHistory: JSON.parse(JSON.stringify(history)), // Deep copy
                isLoadingSample: false,
                selectedDayIndex: 0,
                displayedTemp: null
            });

            await get().fetchPrediction();
            await get().fetchConsolePrediction();
        } catch (err: any) {
            set({
                error: err.message || 'Failed to fetch sample data',
                isLoadingSample: false
            });
        }
    },

    reset: () => set({
        inputHistory: [],
        consoleHistory: [],
        predictions: null,
        consolePredictions: null,
        realData: null,
        isLoading: false,
        isConsoleLoading: false,
        error: null,
        consoleError: null,
        displayedTemp: null,
        selectedDayIndex: 0
    }),
}));
