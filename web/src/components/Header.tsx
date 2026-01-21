import { CloudRainWind, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeatherStore } from '@/store/useWeatherStore';

const Header = () => {
    const { language, setLanguage } = useWeatherStore();

    const toggleLanguage = () => {
        setLanguage(language === 'tr' ? 'en' : 'tr');
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-background/60 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div onClick={scrollToTop} className="flex items-center gap-2.5 group cursor-pointer">
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
                    <div className="hidden md:flex items-center gap-1 mr-4 border-r border-white/10 pr-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => scrollToSection('console')}
                            className="font-bold text-[10px] text-zinc-400 hover:text-white hover:bg-white/5 rounded-full px-4 uppercase tracking-widest transition-all"
                        >
                            Console
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => scrollToSection('project')}
                            className="font-bold text-[10px] text-zinc-400 hover:text-white hover:bg-white/5 rounded-full px-4 uppercase tracking-widest transition-all"
                        >
                            Project
                        </Button>
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
