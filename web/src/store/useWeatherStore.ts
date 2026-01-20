import { create } from 'zustand';
import { predictWeather } from '../services/api';
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

    setInputHistory: (history: WeatherInputRecord[]) => void;
    setRealData: (data: number[]) => void;
    fetchPrediction: () => Promise<void>;
    reset: () => void;
    toggleModal: (isOpen: boolean) => void;
    setLanguage: (lang: Language) => void;
    setActiveTab: (tab: 'temperature' | 'precipitation' | 'wind') => void;
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

    setInputHistory: (history) => set({ inputHistory: history, error: null }),
    setRealData: (data) => set({ realData: data }),
    setLanguage: (lang) => set({ language: lang }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    toggleModal: (isOpen) => set({ isModalOpen: isOpen }),

    fetchPrediction: async () => {
        const { inputHistory } = get();

        if (inputHistory.length !== 24) {
            set({ error: 'Exactly 24 hours of history are required.' });
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

    reset: () => set({ inputHistory: [], predictions: null, realData: null, isLoading: false, error: null }),
}));
