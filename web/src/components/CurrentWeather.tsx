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

    const condition = displayedTemp !== null ? t.hourlyForecast : "Current Conditions";

    // Format current date: "Salı 14:00"
    const now = new Date();
    const dayName = t.days[now.getDay()];

    return (
        <div className="relative group overflow-hidden rounded-[2rem] glass p-8 transition-all hover:bg-white/[0.05] border-white/[0.08]">
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700"></div>

            <div className="relative flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold tracking-tight text-white">Istanbul</h2>
                            <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-tighter">TR</div>
                        </div>
                        <p className="text-zinc-400 text-sm font-medium tracking-wide">{dayName}, {now.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl glass-darker flex items-center justify-center border-white/[0.1]">
                        <CloudRain className="h-6 w-6 text-primary" />
                    </div>
                </div>

                <div className="flex items-start gap-1">
                    <span className="text-8xl font-black tracking-tighter text-white text-glow leading-[0.8]">
                        {currentTemp}
                    </span>
                    <span className="text-3xl font-bold text-primary mt-1">°C</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-darker border-white/[0.08]">
                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">{condition}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurrentWeather;
