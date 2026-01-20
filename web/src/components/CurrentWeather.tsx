import { CloudRain } from 'lucide-react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { translations } from '@/utils/translations';

const CurrentWeather = () => {
    const { predictions, inputHistory, language, displayedTemp } = useWeatherStore();
    const t = translations[language];

    // Use latest temperature from S3 history as current if no display override
    const latestHistoricalTemp = inputHistory.length > 0
        ? inputHistory[inputHistory.length - 1].temperature_2m
        : null;

    const currentTemp = displayedTemp !== null
        ? Math.round(Number(displayedTemp))
        : (predictions ? Math.round(predictions[0]) : (latestHistoricalTemp !== null ? Math.round(latestHistoricalTemp) : '--'));

    const condition = "İstanbul Forecast";

    // Format current date: "Salı 14:00"
    const now = new Date();
    const dayName = t.days[now.getDay()];

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Top Info */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <CloudRain size={64} className="text-secondary-foreground" />
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-7xl font-normal text-foreground leading-none">{currentTemp}</span>
                            <div className="flex flex-col text-muted-foreground text-lg">
                                <span>°C</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location & Time */}
            <div className="text-foreground text-2xl font-normal">
                Istanbul, TR
                <div className="text-sm text-muted-foreground mt-1 font-normal">
                    {dayName} • {condition}
                </div>
            </div>
        </div>
    );
};

export default CurrentWeather;
