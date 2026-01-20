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
        <div className="flex items-center justify-start w-full overflow-x-auto py-4 gap-4 no-scrollbar">
            {forecastData.map((day, i) => (
                <div
                    key={i}
                    onClick={() => {
                        if (day.max !== '--') {
                            setDisplayedTemp(day.max);
                            setSelectedDayIndex(i);
                        }
                    }}
                    className={`flex flex-col items-center justify-center min-w-[100px] p-3 rounded-xl gap-2 cursor-pointer transition-all hover:scale-105 border 
                        ${i === selectedDayIndex
                            ? 'bg-muted/60 border-primary/50 shadow-sm'
                            : 'bg-muted/10 border-transparent hover:bg-muted/20'}`}
                >
                    <span className="text-sm font-medium text-muted-foreground">{day.day}</span>
                    <div className="py-1">{day.icon}</div>
                    <div className="flex gap-2 text-sm">
                        <span className="font-bold text-foreground">{day.max}°</span>
                        <span className="text-muted-foreground">{day.min}°</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DailyForecast;
