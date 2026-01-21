import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';
import { useWeatherStore } from '../store/useWeatherStore';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

const HourlyForecast = () => {
    const { predictions } = useWeatherStore();

    if (!predictions) return null;

    // Helper to map WMO code to Icon (simplified)
    const getWeatherIcon = (code: number = 0) => {
        if (code === 0) return <Sun className="text-yellow-500" size={24} />;
        if (code < 3) return <Cloud className="text-gray-400" size={24} />;
        if (code < 50) return <CloudFog className="text-gray-400" size={24} />;
        if (code < 60) return <CloudRain className="text-blue-500" size={24} />;
        if (code < 80) return <CloudSnow className="text-white" size={24} />;
        if (code < 99) return <CloudLightning className="text-purple-500" size={24} />;
        return <Wind className="text-gray-400" size={24} />;
    };

    // Generate upcoming 24 hours
    const hours = predictions.map((temp, i) => {
        const d = new Date();
        d.setHours(d.getHours() + i + 1);
        const hourLabel = d.toLocaleString('en-US', { hour: 'numeric', hour12: true });

        // Mock weather code variance
        const mockCode = i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 61;

        return {
            label: hourLabel,
            temp: Math.round(temp),
            icon: getWeatherIcon(mockCode)
        };
    });

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium tracking-wide">HOURLY FORECAST</span>
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-lg border bg-card">
                <div className="flex w-max space-x-4 p-4">
                    {hours.map((h, i) => (
                        <Card key={i} className="flex flex-col items-center justify-between w-[100px] h-[140px] pt-4 border-none bg-transparent shadow-none hover:bg-muted/50 transition-colors">
                            <span className="text-sm font-medium text-muted-foreground">{h.label}</span>
                            <div className="my-2 scale-110">
                                {h.icon}
                            </div>
                            <CardContent className="p-0 pb-4">
                                <span className="text-xl font-bold">
                                    {h.temp}°
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
};

export default HourlyForecast;
