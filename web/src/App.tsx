import { useState, useEffect } from 'react';
import { useWeatherStore } from './store/useWeatherStore';
import Header from './components/Header';
import CurrentWeather from './components/CurrentWeather';
import WeatherTabs from './components/WeatherTabs';
import ForecastChart from './components/ForecastChart';
import DailyForecast from './components/DailyForecast';
import ControlBar from './components/ControlBar';
import ProjectInfo from './components/ProjectInfo';
import RequestBuilder from './components/RequestBuilder';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, Settings2 } from 'lucide-react'

function App() {
  const fetchSampleData = useWeatherStore((state) => state.fetchSampleData);
  const [showRequestBuilder, setShowRequestBuilder] = useState(false);

  useEffect(() => {
    fetchSampleData();
  }, [fetchSampleData]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
      <Header />

      <main className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column - Dashboard & Controls */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="p-0 space-y-8">
                <CurrentWeather />
                <div className="space-y-4">
                  <WeatherTabs />
                  <ForecastChart />
                </div>
                <DailyForecast />
              </CardContent>
            </Card>

            <div className="pt-8 border-t border-border/50 space-y-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRequestBuilder(!showRequestBuilder)}
                className="gap-2 rounded-full px-6 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs"
              >
                <Settings2 className={`h-3 w-3 ${showRequestBuilder ? 'text-primary' : ''}`} />
                {showRequestBuilder ? 'Hide Advanced Simulation' : 'Show Advanced Simulation & Parameters'}
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${showRequestBuilder ? 'rotate-180' : ''}`} />
              </Button>

              {showRequestBuilder && (
                <div className="text-left animate-in fade-in slide-in-from-top-4 duration-300">
                  <RequestBuilder />
                </div>
              )}
            </div>

            <ControlBar />
          </div>

          {/* Right Column - Project Info */}
          <div className="lg:col-span-4 space-y-6">
            <ProjectInfo />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
