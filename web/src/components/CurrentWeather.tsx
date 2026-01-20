import { CloudRain } from 'lucide-react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { translations } from '@/utils/translations';

const CurrentWeather = () => {
    const { predictions, language, displayedTemp } = useWeatherStore();
    const t = translations[language];

    // Use displayed prediction if available, otherwise current prediction or fallback
    const currentTemp = displayedTemp !== null
        ? Math.round(Number(displayedTemp))
        : (predictions ? Math.round(predictions[0]) : '--');
    const condition = "Parçalı Bulutlu"; // Mocked condition

    const humidity = "68%";
    const precip = "10%";
    const wind = "12 km/s";

    // Format current date: "Salı 14:00"
    const now = new Date();
    const dayName = t.days[now.getDay()];
    // const time = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

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

                <div className="flex flex-col items-end text-right gap-1 text-muted-foreground text-sm">
                    <div className="flex items-center gap-2">
                        <span>{t.precipitation}: <span className="text-foreground">{precip}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>{t.humidity}: <span className="text-foreground">{humidity}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>{t.wind}: <span className="text-foreground">{wind}</span></span>
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
