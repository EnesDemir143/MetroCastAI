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
import IntelligenceConsole from './components/IntelligenceConsole';
import { Button } from "@/components/ui/button"
import { ChevronDown, Settings2, ArrowUp } from 'lucide-react'
import { translations } from './utils/translations';

function App() {
  const { fetchSampleData, language } = useWeatherStore();
  const [showRequestBuilder, setShowRequestBuilder] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const t = translations[language];

  useEffect(() => {
    fetchSampleData();
  }, [fetchSampleData]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="home" className="min-h-screen font-sans selection:bg-primary/30 antialiased relative">
      <Header />

      <main className="container mx-auto py-12 px-6 max-w-[1440px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column - Dashboard & Controls */}
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-12">
              <CurrentWeather />

              <div className="space-y-6">
                <div className="flex items-center gap-3 ml-2">
                  <div className="h-4 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t.hourlyForecast}</h3>
                </div>
                <div className="glass rounded-[2.5rem] p-8 border-white/[0.05]">
                  <WeatherTabs />
                  <ForecastChart />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between ml-2">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-1 bg-zinc-700 rounded-full"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t.forecast}</h3>
                  </div>
                </div>
                <DailyForecast />
              </div>
            </div>

            {/* Developer Console / Simulation Section */}
            <div id="console" className="pt-12 space-y-10">
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRequestBuilder(!showRequestBuilder)}
                  className={`group gap-4 rounded-full px-10 h-14 glass border-white/[0.05] hover:border-primary/50 transition-all duration-500 hover:bg-primary/5 ${showRequestBuilder ? 'border-primary/40 bg-primary/5' : ''}`}
                >
                  <div className={`p-2 rounded-xl transition-all ${showRequestBuilder ? 'bg-primary/20 scale-110' : 'bg-white/5 group-hover:bg-primary/10'}`}>
                    <Settings2 className={`h-4 w-4 ${showRequestBuilder ? 'text-primary' : 'text-zinc-500 group-hover:text-primary'}`} />
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${showRequestBuilder ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                      {showRequestBuilder ? 'Close Simulation Console' : 'Open Developer Console'}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Manual Inference & API Testing</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 ml-4 transition-transform duration-500 ${showRequestBuilder ? 'rotate-180 text-primary' : 'text-zinc-600'}`} />
                </Button>
              </div>

              {showRequestBuilder && (
                <div className="w-full animate-in fade-in zoom-in-95 slide-in-from-top-6 duration-700 ease-out">
                  <RequestBuilder />
                </div>
              )}
            </div>

            <ControlBar />

            <div className="pt-12 border-t border-white/[0.03]">
              <IntelligenceConsole />
            </div>
          </div>

          {/* Right Column - Project Info */}
          <div id="project" className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
            <div className="flex items-center gap-3 ml-2">
              <div className="h-4 w-1 bg-zinc-700 rounded-full"></div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t.projectInfo}</h3>
            </div>
            <ProjectInfo />
          </div>

        </div>
      </main>

      {/* Scroll to Top Button */}
      <div className={`fixed bottom-8 right-8 transition-all duration-500 z-50 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <Button
          onClick={scrollToTop}
          size="icon"
          className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <ArrowUp className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
        </Button>
      </div>

      {/* Decorative background glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}

export default App;
