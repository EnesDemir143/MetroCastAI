import { CloudRainWind, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeatherStore } from '@/store/useWeatherStore';

const Header = () => {
    const { language, setLanguage } = useWeatherStore();

    const toggleLanguage = () => {
        setLanguage(language === 'tr' ? 'en' : 'tr');
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-background/60 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2.5 group cursor-pointer">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-primary/20 rounded-full blur group-hover:bg-primary/30 transition-all"></div>
                        <CloudRainWind className="relative h-6 w-6 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                            MetroCast <span className="text-primary italic">AI</span>
                        </h1>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium mt-0.5">Istanbul Smart Forecast</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">System Live</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLanguage}
                        className="font-medium text-[10px] text-zinc-400 hover:text-white hover:bg-white/5 rounded-full px-3 uppercase tracking-wider transition-all"
                    >
                        <Globe className="mr-1.5 h-3 w-3" />
                        {language.toUpperCase()}
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
