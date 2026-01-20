import { Cloud, CloudRain, Sun } from 'lucide-react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { translations } from '@/utils/translations';

const DailyForecast = () => {
    const { language } = useWeatherStore();
    const t = translations[language];

    // Mock 7-day data
    const weekData = Array.from({ length: 8 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            day: t.days[d.getDay()],
            icon: i % 3 === 0 ? <Sun size={24} className="text-yellow-500" /> : i % 2 === 0 ? <CloudRain size={24} className="text-blue-400" /> : <Cloud size={24} className="text-gray-400" />,
            max: Math.round(15 + Math.random() * 5),
            min: Math.round(5 + Math.random() * 5),
        }
    });

    return (
        <div className="flex items-center justify-between w-full overflow-x-auto py-4 gap-2 no-scrollbar">
            {weekData.map((day, i) => (
                <div
                    key={i}
                    onClick={() => useWeatherStore.getState().setDisplayedTemp(day.max)}
                    className={`flex flex-col items-center justify-center min-w-[70px] p-2 rounded-lg gap-2 cursor-pointer transition-colors ${i === 0 ? 'bg-muted/50' : 'hover:bg-muted/20'}`}
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
