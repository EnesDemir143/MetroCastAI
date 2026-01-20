import { Database, RotateCcw } from 'lucide-react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { SAMPLE_HISTORY } from '@/utils/sampleData';
import { Button } from "@/components/ui/button"
import { translations } from '@/utils/translations';

const ControlBar = () => {
    const { setInputHistory, fetchPrediction, language, reset } = useWeatherStore();
    const t = translations[language];

    const handleLoadData = async () => {
        setInputHistory(SAMPLE_HISTORY);
        await fetchPrediction();
    };

    return (
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground hover:text-foreground">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleLoadData} className="border-border text-foreground hover:bg-muted">
                <Database className="mr-2 h-4 w-4 text-primary" />
                {t.fetchS3}
            </Button>
        </div>
    );
};

export default ControlBar;
