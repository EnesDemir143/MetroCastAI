import { Upload, Trash2, Zap } from 'lucide-react';
import { useWeatherStore } from '../store/useWeatherStore';
import { SAMPLE_HISTORY } from '../utils/sampleData';

const InputControl = () => {
    const { inputHistory, setInputHistory, reset, isLoading, fetchPrediction } = useWeatherStore();

    const handleLoadSample = () => {
        setInputHistory(SAMPLE_HISTORY);
    };

    const handleReset = () => {
        reset();
    };

    const handlePredict = async () => {
        await fetchPrediction();
    };

    return (
        <div className="glass-panel p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold m-0">Input Data Control</h2>
                <p className="text-sm text-text-secondary m-0">
                    {inputHistory.length > 0
                        ? `${inputHistory.length} records loaded. Ready for prediction.`
                        : 'No data loaded. Load sample data to start.'}
                </p>
            </div>

            <div className="flex items-center gap-3">
                {inputHistory.length === 0 ? (
                    <button onClick={handleLoadSample} className="flex items-center gap-2">
                        <Upload size={18} />
                        Load Sample Data
                    </button>
                ) : (
                    <>
                        <button onClick={handleReset} className="bg-red-500/10 text-red-400 border-red-500/50 hover:bg-red-500/20 hover:border-red-500 flex items-center gap-2">
                            <Trash2 size={18} />
                            Reset
                        </button>
                        <button
                            onClick={handlePredict}
                            disabled={isLoading}
                            className="bg-accent-primary text-white border-accent-secondary hover:bg-accent-secondary shadow-[0_0_15px_rgba(100,108,255,0.3)] flex items-center gap-2"
                        >
                            {isLoading ? (
                                <span className="animate-spin">⌛</span>
                            ) : (
                                <Zap size={18} />
                            )}
                            Predict Forecast
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default InputControl;
