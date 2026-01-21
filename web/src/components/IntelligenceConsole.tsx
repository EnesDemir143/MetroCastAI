import { useState, useEffect } from 'react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { translations } from '@/utils/translations';
import { LineChart as LucideLineChart, Activity, Cpu, BookOpen, TrendingDown, History, Info, Zap, CheckCircle2, Image as ImageIcon, BarChart3, X, Maximize2, Layers } from 'lucide-react';
import { fetchLatestWandBRun, fetchRunHistory, type WandBRunMetrics, type WandBHistoryPoint } from '@/services/wandbService';
import { TooltipProvider } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const IntelligenceConsole = () => {
    const { language } = useWeatherStore();
    const t = translations[language];
    const [metrics, setMetrics] = useState<WandBRunMetrics | null>(null);
    const [history, setHistory] = useState<WandBHistoryPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const entity = import.meta.env.VITE_WANDB_ENTITY || 'jieuna1-kocaeli-university';
    const project = import.meta.env.VITE_WANDB_PROJECT || 'MetroCast-AI';
    const apiKey = import.meta.env.VITE_WANDB_API_KEY || '';

    useEffect(() => {
        console.log('IntelligenceConsole - Checking Connection:', { entity, project, hasApiKey: !!apiKey });

        if (!apiKey) {
            console.warn('WandB API Key is missing. Please check VITE_WANDB_API_KEY in .env');
            // We don't return here so we can show "Waiting for Data..." or a specific empty state
            // relying on the empty history/metrics state.
        }

        const fetchData = async () => {
            if (!apiKey) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const [metricsData, historyData] = await Promise.all([
                    fetchLatestWandBRun(entity, project, apiKey),
                    fetchRunHistory(entity, project, apiKey)
                ]);
                console.log('WandB Data Received:', { metricsData, historyCount: historyData?.length });
                setMetrics(metricsData);
                setHistory(historyData);
            } catch (error) {
                console.error('Failed to fetch WandB data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [entity, project, apiKey]);


    const architecture = [
        { label: 'Model', value: 'ExcelFormer', desc: 'Custom Transformer' },
        { label: 'Encoder', value: '4 Layers', desc: t.layerTooltip },
        { label: 'Attention', value: '8 Heads', desc: t.headsTooltip },
        { label: 'Embedding', value: '128-dim', desc: 'Vector size' },
        { label: 'Input/Output', value: '168h', desc: '7-day window' },
    ];

    const hyperparams = [
        { label: 'Optimizer', value: 'AdamW', desc: t.optTooltip },
        { label: 'Scheduler', value: 'Cosine', desc: 'Dynamic LR' },
        { label: 'Batch Size', value: '128', desc: 'Training steps' },
        { label: 'Loss Fn', value: 'MSE', desc: 'Mean Squared Error' },
    ];

    return (
        <TooltipProvider>
            <div className="mt-20 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                {/* Header Area */}
                <div className="flex flex-col gap-4 ml-4">
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(56,189,248,0.6)]"></div>
                        <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-zinc-300">
                            {t.intelligenceConsole}
                        </h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic ml-4">
                            {t.sessionSummary}
                        </p>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-800 to-transparent"></div>
                    </div>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

                    {/* Left: Summary Cards & Controls */}
                    <div className="xl:col-span-1 space-y-6">
                        {/* Training Loss Card */}
                        <div className="glass rounded-[2rem] p-6 border-white/[0.05] relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Loss Metrics</span>
                                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Finished</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="text-2xl font-black text-white italic tracking-tighter">
                                            {metrics?.loss?.toFixed(6) || '---'}
                                        </h4>
                                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Total Train Loss</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                    </div>
                                </div>
                                {metrics?.valLoss && (
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black text-zinc-300 italic tracking-tighter">
                                                {metrics.valLoss.toFixed(6)}
                                            </h4>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Val Loss</p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                                            <Activity className="h-3.5 w-3.5 text-primary/50" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/50 to-transparent"></div>
                        </div>

                        {/* Total Batches / Steps */}
                        <div className="glass rounded-[2rem] p-6 border-white/[0.05] flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-zinc-800/50 border border-white/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all">
                                    <Layers className="h-4 w-4 text-zinc-400 group-hover:text-blue-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Total Batches / Steps</p>
                                    <p className="text-lg font-black text-white italic">{metrics?.totalSteps?.toLocaleString() || '---'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Test MAE Card */}
                        <div className="glass rounded-[2rem] p-6 border-white/[0.05] flex items-center justify-between group underline-offset-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-zinc-800/50 border border-white/5 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all">
                                    <BarChart3 className="h-4 w-4 text-zinc-400 group-hover:text-amber-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Final Error (MAE)</p>
                                    <p className="text-lg font-black text-white italic">{metrics?.mae?.toFixed(4) || '---'}°C</p>
                                </div>
                            </div>
                        </div>

                        {/* Epoch Progress Panel */}
                        <div className="glass rounded-[2rem] p-6 border-white/[0.05] flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-zinc-800/50 border border-white/5 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all">
                                    <Zap className="h-4 w-4 text-zinc-400 group-hover:text-amber-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t.totalEpochs}</p>
                                    <p className="text-lg font-black text-white italic">{metrics?.epoch || '---'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle/Right: Live Charts */}
                    <div className="xl:col-span-3 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                            {/* Loss Graphics */}
                            <div className="glass rounded-[2.5rem] p-8 border-white/[0.05] flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                            <LucideLineChart className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">Loss Graphics</h4>
                                            <p className="text-[8px] text-zinc-500 uppercase font-black">{t.lossChart}</p>
                                        </div>
                                    </div>
                                    <History className="h-3.5 w-3.5 text-zinc-800" />
                                </div>
                                <div className="flex-1 min-h-[250px]">
                                    {isLoading ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : history.length > 0 && isMounted ? (
                                        <div className="w-full h-full min-h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                                <LineChart data={history}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                    <XAxis
                                                        dataKey="epoch"
                                                        stroke="#52525b"
                                                        fontSize={9}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        label={{ value: 'Epoch', position: 'insideBottom', offset: -5, fontSize: 8, fill: '#71717a' }}
                                                    />
                                                    <YAxis
                                                        stroke="#52525b"
                                                        fontSize={9}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        domain={['auto', 'auto']}
                                                    />
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', fontSize: '10px' }}
                                                        itemStyle={{ color: '#38bdf8' }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="loss"
                                                        name="Train Loss"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2.5}
                                                        dot={false}
                                                        animationDuration={1500}
                                                        connectNulls={true}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30 text-zinc-500">
                                            <Info className="h-6 w-6" />
                                            <span className="text-[10px] uppercase font-black">
                                                {!apiKey ? 'API Key Missing' : 'History Data Unavailable'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Accuracy Graphics (MAE) */}
                            <div className="glass rounded-[2.5rem] p-8 border-white/[0.05] flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <LucideLineChart className="h-4 w-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">Error Metrics (MAE)</h4>
                                            <p className="text-[8px] text-zinc-500 uppercase font-black">{t.maeChart}</p>
                                        </div>
                                    </div>
                                    <TrendingDown className="h-3.5 w-3.5 text-zinc-800" />
                                </div>
                                <div className="flex-1 min-h-[250px]">
                                    {isLoading ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : history.length > 0 && isMounted ? (
                                        <div className="w-full h-full min-h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                                <LineChart data={history}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                    <XAxis
                                                        dataKey="epoch"
                                                        stroke="#52525b"
                                                        fontSize={9}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#52525b"
                                                        fontSize={9}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', fontSize: '10px' }}
                                                        itemStyle={{ color: '#f59e0b' }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="valMae"
                                                        name="Validation MAE"
                                                        stroke="#f59e0b"
                                                        strokeWidth={2.5}
                                                        dot={false}
                                                        animationDuration={1500}
                                                        connectNulls={true}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30 text-zinc-500">
                                            <Info className="h-6 w-6" />
                                            <span className="text-[10px] uppercase font-black">
                                                {!apiKey ? 'API Key Missing' : 'Waiting for Data...'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Architecture Visualization Section */}
                <div className="glass rounded-[3rem] p-10 border-white/[0.05] space-y-8 relative">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-zinc-800/50 border border-white/5">
                            <ImageIcon className="h-5 w-5 text-zinc-300" />
                        </div>
                        <h4 className="text-[14px] font-black uppercase tracking-[0.3em] text-white italic">
                            {t.architectureDiagram}
                        </h4>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-12 items-center">
                        <div
                            className="flex-1 glass-darker p-4 rounded-[2.5rem] border-white/5 overflow-hidden group cursor-zoom-in relative"
                            onClick={() => setIsZoomed(true)}
                        >
                            <img
                                src="/assets/excelformer_architecture.png"
                                alt="ExcelFormer Architecture Diagram"
                                className="w-full h-auto rounded-[1.5rem] opacity-90 group-hover:opacity-100 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="h-8 w-8 text-white drop-shadow-lg" />
                            </div>
                        </div>
                        <div className="lg:w-[350px] space-y-6">
                            <p className="text-[12px] leading-[1.8] text-zinc-400 font-medium italic">
                                {t.architectureDesc}
                            </p>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest block mb-1">Attention Mechanism</span>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed">Multi-head self-attention allows the model to selectively focus on relevant past time-steps.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">Temporal Projection</span>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed">The final layer reshapes historical encoded features into a structured 168-hour forecast sequence.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lightbox / Zoom Overlay */}
                    {isZoomed && (
                        <div
                            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300"
                            onClick={() => setIsZoomed(false)}
                        >
                            <button
                                className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white"
                                onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <img
                                src="/assets/excelformer_architecture.png"
                                alt="ExcelFormer Architecture Zoomed"
                                className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                </div>

                {/* Narrative & Metrics Table Area */}
                <div className="glass rounded-[3rem] p-10 border-white/[0.05]">
                    <div className="flex flex-col xl:flex-row gap-16">
                        {/* Narrative */}
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-zinc-800/50 border border-white/5">
                                    <BookOpen className="h-5 w-5 text-zinc-300" />
                                </div>
                                <h4 className="text-[14px] font-black uppercase tracking-[0.3em] text-white italic">
                                    {t.projectNarrative}
                                </h4>
                            </div>
                            <p className="text-[13px] leading-[1.8] text-zinc-400 font-medium text-justify">
                                {t.narrativeText}
                            </p>
                        </div>

                        {/* Specs Table */}
                        <div className="xl:w-[400px] flex flex-col gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 ml-4">
                                    <Cpu className="h-4 w-4 text-zinc-500" />
                                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest italic">{t.deploymentSpecs}</h4>
                                </div>
                                <div className="glass-darker rounded-[2rem] p-6 border-white/5 space-y-4">
                                    {architecture.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center group">
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase">{item.label}</span>
                                            <span className="text-[10px] font-mono font-bold text-zinc-300 group-hover:text-primary transition-colors">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 ml-4">
                                    <TrendingDown className="h-4 w-4 text-zinc-500" />
                                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest italic">{t.optimizationStrategy}</h4>
                                </div>
                                <div className="glass-darker rounded-[2rem] p-6 border-white/5 space-y-4">
                                    {hyperparams.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center group">
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase">{item.label}</span>
                                            <span className="text-[10px] font-mono font-bold text-zinc-300 group-hover:text-amber-500 transition-colors">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default IntelligenceConsole;
