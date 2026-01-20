import { Cloud, Sun } from 'lucide-react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { translations } from '@/utils/translations';

const DailyForecast = () => {
    const { language, predictions, inputHistory, selectedDayIndex, setSelectedDayIndex, setDisplayedTemp } = useWeatherStore();
    const t = translations[language];

    // Calculate Today/Tomorrow from predictions (which covers 24h from last history)
    // We can split predictions into Today and Tomorrow based on the hour
    const getForecastBlocks = () => {
        if (!predictions || inputHistory.length === 0) {
            return Array.from({ length: 2 }).map((_, i) => ({
                day: i === 0 ? t.days[new Date().getDay()] : t.days[(new Date().getDay() + 1) % 7],
                icon: <Sun size={24} className="text-yellow-500" />,
                max: '--',
                min: '--',
            }));
        }

        const lastTimestamp = inputHistory[inputHistory.length - 1].timestamp;
        const lastHour = new Date(lastTimestamp).getHours();

        // Hours remaining in 'Today'
        const hoursLeftToday = 24 - (lastHour + 1);

        const todayPreds = predictions.slice(0, hoursLeftToday > 0 ? hoursLeftToday : 0);
        const tomorrowPreds = predictions.slice(hoursLeftToday > 0 ? hoursLeftToday : 0);

        const getStats = (preds: number[]) => {
            if (preds.length === 0) return { min: '--', max: '--' };
            return {
                min: Math.round(Math.min(...preds)),
                max: Math.round(Math.max(...preds))
            };
        };

        const todayStats = getStats(todayPreds);
        const tomorrowStats = getStats(tomorrowPreds);

        return [
            {
                day: t.days[new Date().getDay()],
                icon: <Sun size={24} className="text-yellow-500" />,
                max: todayStats.max,
                min: todayStats.min,
            },
            {
                day: t.days[(new Date().getDay() + 1) % 7],
                icon: <Cloud size={24} className="text-gray-400" />,
                max: tomorrowStats.max,
                min: tomorrowStats.min,
            }
        ];
    };

    const forecastData = getForecastBlocks();

    return (
        <div className="flex items-center justify-start w-full overflow-x-auto py-2 gap-4 no-scrollbar">
            {forecastData.map((day, i) => (
                <div
                    key={i}
                    onClick={() => {
                        if (day.max !== '--') {
                            setDisplayedTemp(day.max);
                            setSelectedDayIndex(i);
                        }
                    }}
                    className={`group relative flex flex-col items-center justify-center min-w-[120px] p-5 rounded-[1.5rem] gap-3 cursor-pointer transition-all duration-300 border
                        ${i === selectedDayIndex
                            ? 'glass-darker border-primary/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                            : 'glass border-white/[0.05] hover:border-white/20 hover:bg-white/[0.05]'}`}
                >
                    {i === selectedDayIndex && (
                        <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                    )}

                    <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors
                        ${i === selectedDayIndex ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                        {day.day}
                    </span>

                    <div className={`p-2 rounded-2xl transition-all duration-300 
                        ${i === selectedDayIndex ? 'bg-primary/10 scale-110' : 'bg-white/5 opacity-70 group-hover:opacity-100 group-hover:scale-105'}`}>
                        {day.icon}
                    </div>

                    <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-xl font-black tracking-tighter transition-colors
                            ${i === selectedDayIndex ? 'text-white' : 'text-white/80'}`}>
                            {day.max}°
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500">{day.min}°</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DailyForecast;
