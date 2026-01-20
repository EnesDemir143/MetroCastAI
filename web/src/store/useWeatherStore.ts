import { create } from 'zustand';
import { predictWeather } from '../services/api';
import { fetchS3SampleData } from '../services/s3Service';
import type { PredictionRequest, WeatherInputRecord } from '../services/api';
import type { Language } from '../utils/translations';

interface WeatherState {
    inputHistory: WeatherInputRecord[];
    realData: number[] | null; // For comparison
    predictions: number[] | null;
    isLoading: boolean;
    error: string | null;
    isModalOpen: boolean;
    language: Language;
    activeTab: 'temperature' | 'precipitation' | 'wind';
    displayedTemp: number | string | null;
    selectedDayIndex: number;
    isLoadingSample: boolean;

    setInputHistory: (history: WeatherInputRecord[]) => void;
    setRealData: (data: number[]) => void;
    fetchPrediction: () => Promise<void>;
    reset: () => void;
    toggleModal: (isOpen: boolean) => void;
    setLanguage: (lang: Language) => void;
    setActiveTab: (tab: 'temperature' | 'precipitation' | 'wind') => void;
    setDisplayedTemp: (temp: number | string | null) => void;
    setSelectedDayIndex: (index: number) => void;
    fetchSampleData: () => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
    inputHistory: [],
    realData: null,
    predictions: null,
    isLoading: false,
    error: null,
    isModalOpen: false,
    language: 'tr',
    activeTab: 'temperature',
    displayedTemp: null,
    selectedDayIndex: 0,
    isLoadingSample: false,

    setInputHistory: (history) => set({ inputHistory: history, error: null }),
    setRealData: (data) => set({ realData: data }),
    setLanguage: (lang) => set({ language: lang }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setDisplayedTemp: (temp) => set({ displayedTemp: temp }),
    setSelectedDayIndex: (index: number) => set({ selectedDayIndex: index }),

    toggleModal: (isOpen) => set({ isModalOpen: isOpen }),

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
            set({ predictions: response.predictions, isLoading: false, isModalOpen: false });
        } catch (err: any) {
            console.error(err);
            set({
                error: err.response?.data || err.message || 'Failed to fetch prediction',
                isLoading: false
            });
        }
    },

    fetchSampleData: async () => {
        set({ isLoadingSample: true, error: null });
        try {
            const data = await fetchS3SampleData();
            // Take last 168h of data for the prediction history
            const history = data.slice(-168);
            set({
                inputHistory: history,
                isLoadingSample: false,
                selectedDayIndex: 0,
                displayedTemp: null
            });

            // Automatically get prediction for the loaded data
            await get().fetchPrediction();
        } catch (err: any) {
            set({
                error: err.message || 'Failed to fetch sample data',
                isLoadingSample: false
            });
        }
    },

    reset: () => set({
        inputHistory: [],
        predictions: null,
        realData: null,
        isLoading: false,
        error: null,
        displayedTemp: null,
        selectedDayIndex: 0
    }),
}));
