import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Cpu, Database, ThermometerSun } from 'lucide-react';

const ProjectInfo = () => {
    return (
        <div className="space-y-6">
            <Card className="bg-muted/30 border-none shadow-none">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <Info className="text-primary h-5 w-5" />
                        About MetroCast AI
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    MetroCast AI is an advanced weather forecasting system powered by deep learning. It specializes in predicting hourly temperature fluctuations for Istanbul with high precision, utilizing historical patterns to anticipate future variations.
                </CardContent>
            </Card>

            <div className="grid gap-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/20">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Cpu className="text-primary h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">Deep Learning Model</h4>
                        <p className="text-xs text-muted-foreground mt-1">Uses an ExcelFormer architecture optimized for time-series forecasting, providing 24-hour look-ahead predictions.</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/20">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                        <Database className="text-blue-500 h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">Real-time Data Sync</h4>
                        <p className="text-xs text-muted-foreground mt-1">Automatically fetches the latest meteorological observations from S3 to seed the model with fresh historical context.</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/20">
                    <div className="bg-orange-500/10 p-2 rounded-lg">
                        <ThermometerSun className="text-orange-500 h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">Precision Mapping</h4>
                        <p className="text-xs text-muted-foreground mt-1">Accounts for local variables including pressure, humidity, and solar radiation to produce the most accurate temperature curve.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectInfo;
