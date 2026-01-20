import { CloudRainWind, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeatherStore } from '@/store/useWeatherStore';

const Header = () => {
    const { language, setLanguage } = useWeatherStore();

    const toggleLanguage = () => {
        setLanguage(language === 'tr' ? 'en' : 'tr');
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-2">
                    <CloudRainWind className="h-5 w-5 text-primary" />
                    <span className="text-lg font-bold tracking-tight">
                        MetroCast <span className="font-light text-muted-foreground">AI</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLanguage}
                        className="font-medium text-xs text-muted-foreground hover:text-foreground"
                    >
                        <Globe className="mr-1 h-3 w-3" />
                        {language.toUpperCase()}
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
