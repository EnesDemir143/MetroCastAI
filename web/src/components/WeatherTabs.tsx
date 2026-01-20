import { useWeatherStore } from '@/store/useWeatherStore';
import { translations } from '@/utils/translations';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const WeatherTabs = () => {
    const { language, activeTab, setActiveTab } = useWeatherStore();
    const t = translations[language];

    const handleTabChange = (val: string) => {
        if (val === 'temperature' || val === 'precipitation' || val === 'wind') {
            setActiveTab(val);
        }
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-transparent p-0 border-b border-border w-full justify-start h-auto rounded-none gap-8">
                <TabsTrigger
                    value="temperature"
                    className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors"
                >
                    {t.temperature}
                </TabsTrigger>
                <TabsTrigger
                    value="precipitation"
                    className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors"
                >
                    {t.precipitation}
                </TabsTrigger>
                <TabsTrigger
                    value="wind"
                    className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-green-500 data-[state=active]:text-green-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors"
                >
                    {t.wind}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
};

export default WeatherTabs;
