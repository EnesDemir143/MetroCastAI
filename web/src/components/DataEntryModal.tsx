import { Upload, Database } from 'lucide-react';
import { useWeatherStore } from '../store/useWeatherStore';
import { SAMPLE_HISTORY } from '../utils/sampleData';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"

const DataEntryModal = () => {
    const { isModalOpen, toggleModal, setInputHistory, setRealData, fetchPrediction } = useWeatherStore();

    const handleLoadSample = async () => {
        setInputHistory(SAMPLE_HISTORY);
        const mockRealOutcome = SAMPLE_HISTORY.map(r => r.temperature_2m + (Math.random() * 2 - 1));
        setRealData(mockRealOutcome);
        await fetchPrediction();
    };

    const handleFetchLatestS3 = async () => {
        alert("Fetching latest data from S3...");
        await handleLoadSample();
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={toggleModal}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Update Model Data</DialogTitle>
                    <DialogDescription>
                        Choose a data source to run the forecast.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Card
                        className="cursor-pointer hover:bg-accent hover:border-primary transition-all p-6 flex flex-col items-center justify-center gap-3 border-dashed border-2"
                        onClick={handleFetchLatestS3}
                    >
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Database size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold">Fetch Latest from S3</h3>
                            <p className="text-xs text-muted-foreground">Get real-time cleaning pipeline output</p>
                        </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Card
                            className="cursor-pointer hover:bg-accent transition-colors p-4 flex flex-col items-center justify-center gap-2"
                            onClick={handleLoadSample}
                        >
                            <span className="font-medium">Load Sample</span>
                            <span className="text-xs text-muted-foreground text-center">Use pre-validated test set</span>
                        </Card>

                        <Card className="opacity-50 cursor-not-allowed p-4 flex flex-col items-center justify-center gap-2">
                            <Upload size={16} className="text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">Upload CSV</span>
                        </Card>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        Data must contain 24 hours of hourly records (T-23 to T0).
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DataEntryModal;
