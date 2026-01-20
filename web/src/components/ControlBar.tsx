import { RotateCcw } from 'lucide-react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { Button } from "@/components/ui/button"

const ControlBar = () => {
    const { fetchSampleData, isLoadingSample } = useWeatherStore();

    return (
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button
                variant="ghost"
                size="sm"
                onClick={fetchSampleData}
                disabled={isLoadingSample}
                className="text-muted-foreground hover:text-foreground"
            >
                <RotateCcw className={`mr-2 h-4 w-4 ${isLoadingSample ? 'animate-spin' : ''}`} />
                {isLoadingSample ? 'Refreshing...' : 'Reset & Refresh'}
            </Button>
        </div>
    );
};

export default ControlBar;
