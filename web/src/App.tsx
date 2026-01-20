import Header from './components/Header';
import CurrentWeather from './components/CurrentWeather';
import WeatherTabs from './components/WeatherTabs';
import ForecastChart from './components/ForecastChart';
import DailyForecast from './components/DailyForecast';
import ControlBar from './components/ControlBar';
import { Card, CardContent } from "@/components/ui/card"

function App() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
      <Header />

      <main className="container max-w-3xl mx-auto py-6 px-4 space-y-6">

        {/* Main Weather Card */}
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

        {/* Action Bar */}
        <ControlBar />

      </main>
    </div>
  );
}

export default App;
