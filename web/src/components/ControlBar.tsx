import { RotateCcw } from 'lucide-react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { Button } from "@/components/ui/button"
import { translations } from '@/utils/translations';

const ControlBar = () => {
    const { fetchSampleData, isLoadingSample, language } = useWeatherStore();
    const t = translations[language];

    return (
        <div className="flex items-center justify-between gap-4 py-6 border-t border-white/[0.05] mt-8">

            <Button
                variant="ghost"
                size="sm"
                onClick={fetchSampleData}
                disabled={isLoadingSample}
                className="group relative h-10 px-6 rounded-full glass border-white/[0.05] hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
            >
                <div className="flex items-center gap-2.5">
                    <RotateCcw className={`h-4 w-4 text-primary transition-transform duration-700 ${isLoadingSample ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
                        {isLoadingSample ? t.loading : t.resetAndRefresh}
                    </span>
                </div>
            </Button>
        </div>
    );
};

export default ControlBar;
