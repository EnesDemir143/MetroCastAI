import React, { useState } from 'react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Upload, AlertCircle, Trash2, LineChart as ChartIcon, Code2, Info } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WeatherInputRecord } from '@/services/api';
import { translations } from '@/utils/translations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RequestBuilder = () => {
    const {
        consoleHistory,
        setConsoleHistory,
        fetchConsolePrediction,
        consolePredictions,
        isConsoleLoading,
        consoleError,
        language
    } = useWeatherStore();

    const t = translations[language];
    const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

    const handleUpdateField = (index: number, field: keyof WeatherInputRecord, value: string) => {
        const newHistory = [...consoleHistory];
        const numValue = field === 'timestamp' ? value : parseFloat(value);
        (newHistory[index] as any)[field] = isNaN(numValue as any) && field !== 'timestamp' ? 0 : numValue;
        setConsoleHistory(newHistory);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = lines.slice(1, 169).map(line => {
                const values = line.split(',');
                const record: any = {};
                headers.forEach((header, i) => {
                    const key = header === 'time' ? 'timestamp' : header;
                    const val = values[i];
                    record[key] = (key === 'timestamp') ? val : parseFloat(val);
                });
                return record as WeatherInputRecord;
            });
            if (data.length === 168) {
                setConsoleHistory(data);
                fetchConsolePrediction();
            }
        };
        reader.readAsText(file);
    };

    const clearHistory = () => {
        const empty = Array(168).fill(null).map((_, i) => ({
            timestamp: new Date(Date.now() - (167 - i) * 3600000).toISOString(),
            cloud_cover: 0,
            dew_point_2m: 0,
            precipitation: 0,
            relative_humidity_2m: 0,
            shortwave_radiation: 0,
            soil_temperature_0_to_7cm: 0,
            surface_pressure: 1013,
            temperature_2m: 20,
            weather_code: 0,
            wind_direction_10m: 0,
            wind_speed_10m: 0
        }));
        setConsoleHistory(empty);
    };

    const chartData = consolePredictions?.map((temp, i) => ({
        hour: i,
        temp: parseFloat(temp.toFixed(1))
    })) || [];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch max-w-full overflow-hidden">
            {/* Left: Input Console */}
            <div className="xl:col-span-7 flex flex-col rounded-[2.5rem] glass-darker overflow-hidden border-white/[0.08] shadow-2xl h-[800px] relative">
                {/* Header - Fixed Overlap */}
                <div className="flex-none px-6 py-6 border-b border-white/[0.05] bg-black/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 shrink-0">
                            <span className="text-[10px] font-black text-primary tracking-widest uppercase">POST</span>
                            <span className="text-[10px] font-mono text-zinc-400">/predict</span>
                        </div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic truncate hidden sm:block">
                            {t.requestBuilder}
                        </h4>
                    </div>

                    <div className="flex glass p-1 rounded-full border-white/[0.1] shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <Info className="h-3 w-3 mr-2" />
                            Params
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'json' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                            onClick={() => setViewMode('json')}
                        >
                            <Code2 className="h-3 w-3 mr-2" />
                            Payload
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex-none px-8 py-5 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
                    <div className="flex gap-8">
                        <Label htmlFor="csv-upload-console" className="cursor-pointer flex items-center gap-2.5 group">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-primary/10 transition-all">
                                <Upload className="h-3.5 w-3.5 text-zinc-400 group-hover:text-primary" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-300 uppercase tracking-[0.15em]">CSV</span>
                            <input id="csv-upload-console" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </Label>
                        <button onClick={clearHistory} className="flex items-center gap-2.5 group">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-destructive/10 transition-all">
                                <Trash2 className="h-3.5 w-3.5 text-zinc-400 group-hover:text-destructive" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-300 uppercase tracking-[0.15em]">Clear</span>
                        </button>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => fetchConsolePrediction()}
                        disabled={isConsoleLoading}
                        className="h-10 px-8 bg-[#10b981] text-black hover:bg-[#059669] font-black text-[11px] uppercase tracking-widest rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                    >
                        {isConsoleLoading ? (
                            <div className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin mr-2"></div>
                        ) : (
                            <Play className="h-3.5 w-3.5 mr-2 fill-current" />
                        )}
                        Run Inference
                    </Button>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 bg-black/10">
                    {viewMode === 'table' ? (
                        <div className="p-8 space-y-3">
                            {consoleHistory.map((record, i) => (
                                <div key={i} className="flex items-center gap-6 py-1 group">
                                    <div className="w-12 text-[9px] font-black text-zinc-700 text-right group-hover:text-primary transition-colors shrink-0">T-{167 - i}h</div>
                                    <div className="flex-1 grid grid-cols-4 gap-3 bg-white/[0.02] border border-white/[0.04] p-2 rounded-2xl group-hover:border-white/10 group-hover:bg-white/[0.04] transition-all">
                                        <div className="text-[10px] font-mono border-r border-white/5 flex items-center px-3 text-zinc-600">
                                            {record.timestamp.split('T')[1].substring(0, 5)}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={record.temperature_2m}
                                                onChange={(e) => handleUpdateField(i, 'temperature_2m', e.target.value)}
                                                className="h-8 text-[11px] font-bold bg-black/40 border-none text-primary p-2 focus:ring-1 focus:ring-primary/30 text-center"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={record.surface_pressure}
                                                onChange={(e) => handleUpdateField(i, 'surface_pressure', e.target.value)}
                                                className="h-8 text-[11px] font-bold bg-black/40 border-none text-zinc-400 p-2 focus:ring-1 focus:ring-white/10 text-center"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={record.wind_speed_10m}
                                                onChange={(e) => handleUpdateField(i, 'wind_speed_10m', e.target.value)}
                                                className="h-8 text-[11px] font-bold bg-black/40 border-none text-zinc-400 p-2 focus:ring-1 focus:ring-white/10 text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 h-full flex flex-col">
                            <div className="flex-1 p-6 rounded-[2rem] bg-black/40 border border-white/10 font-mono text-[11px] text-[#10b981]/90 leading-relaxed overflow-x-auto shadow-inner">
                                <pre>{JSON.stringify({ input_data: consoleHistory }, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </ScrollArea>

                {consoleError && (
                    <div className="px-8 py-3 bg-destructive/10 border-t border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {consoleError}
                    </div>
                )}
            </div>

            {/* Right: Output Side */}
            <div className="xl:col-span-5 flex flex-col gap-8">
                {/* Result Visualizer - Matching Screenshot */}
                <div className="flex-1 glass-darker rounded-[3rem] p-10 border-white/[0.08] flex flex-col min-h-[480px] shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 rounded-2xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20">
                            <ChartIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-black text-white uppercase tracking-[0.2em] italic">Simulation Output</h4>
                            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">7-Day Forecast Visualization</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full bg-black/40 rounded-[2.5rem] p-6 border border-white/[0.03] flex items-center justify-center">
                        {consolePredictions ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                    <XAxis dataKey="hour" hide />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="#ffffff10"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `${v}°`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff05', borderRadius: '1rem', fontSize: '11px', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#0ea5e9' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="temp"
                                        stroke="#0ea5e9"
                                        strokeWidth={3}
                                        dot={false}
                                        animationDuration={1000}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="h-16 w-16 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02]">
                                    <Play className="h-6 w-6 text-zinc-600 ml-1" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Waiting for Execution</h5>
                                    <p className="text-[10px] text-zinc-600 max-w-[200px] leading-relaxed">Update parameters or click 'Run Inference' to see preview</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-10">
                        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Peak Temp</span>
                            <span className="text-2xl font-black text-white italic">
                                {consolePredictions ? `${Math.max(...consolePredictions).toFixed(1)}°` : '--'}
                            </span>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Low Temp</span>
                            <span className="text-2xl font-black text-white italic">
                                {consolePredictions ? `${Math.min(...consolePredictions).toFixed(1)}°` : '--'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* API Response JSON - Matching Screenshot Bottom Right */}
                <div className="glass-darker rounded-[2.5rem] p-8 border-white/[0.08] bg-black/20 flex flex-col gap-6 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.2em] italic">Inference Response (JSON)</span>
                    </div>
                    <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.03] font-mono text-[10px] text-[#10b981]/70 leading-relaxed shadow-inner overflow-hidden">
                        <pre>
                            {consolePredictions
                                ? JSON.stringify({
                                    status: "200 OK",
                                    inference_time: "42ms",
                                    prediction_range: "168h",
                                    samples: consolePredictions.slice(0, 3).map(v => parseFloat(v.toFixed(2)))
                                }, null, 2)
                                : '{ "waiting": "execution..." }'
                            }
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestBuilder;
