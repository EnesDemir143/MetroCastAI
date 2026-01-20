import React, { useState, useCallback } from 'react';
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
            {/* Left: Console / Input */}
            <div className="xl:col-span-7 flex flex-col rounded-[2.5rem] glass-darker overflow-hidden border-white/[0.08] shadow-2xl h-[700px]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/[0.05] bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                            <span className="text-[10px] font-black text-primary tracking-widest uppercase">POST</span>
                            <div className="h-3 w-px bg-primary/20"></div>
                            <span className="text-[11px] font-mono font-bold text-white">/predict</span>
                        </div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">{t.requestBuilder}</h4>
                    </div>
                    <div className="flex glass p-1 rounded-full border-white/[0.05]">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-primary text-white' : 'text-zinc-500'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <Info className="h-3 w-3 mr-2" />
                            Params
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'json' ? 'bg-primary text-white' : 'text-zinc-500'}`}
                            onClick={() => setViewMode('json')}
                        >
                            <Code2 className="h-3 w-3 mr-2" />
                            Payload
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-8 py-4 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
                    <div className="flex gap-6">
                        <Label htmlFor="csv-upload-console" className="cursor-pointer flex items-center gap-2 group">
                            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-primary/10 transition-all">
                                <Upload className="h-3 w-3 text-zinc-400 group-hover:text-primary" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest">CSV</span>
                            <input id="csv-upload-console" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </Label>
                        <button onClick={clearHistory} className="flex items-center gap-2 group">
                            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-destructive/10 transition-all">
                                <Trash2 className="h-3 w-3 text-zinc-400 group-hover:text-destructive" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest">Clear</span>
                        </button>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => fetchConsolePrediction()}
                        disabled={isConsoleLoading}
                        className="h-8 px-6 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-full font-black text-[10px] uppercase tracking-widest"
                    >
                        <Play className="h-3 w-3 mr-2 fill-current" />
                        Run Inference
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    {viewMode === 'table' ? (
                        <div className="p-8 space-y-3">
                            {consoleHistory.map((record, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="w-12 text-[9px] font-black text-zinc-600 text-right">T-{167 - i}h</div>
                                    <div className="flex-1 grid grid-cols-4 gap-3 bg-white/[0.02] border border-white/[0.05] p-2 rounded-xl group-hover:border-white/10 group-hover:bg-white/[0.04] transition-all">
                                        <Input
                                            value={record.timestamp.split('T')[1].substring(0, 5)}
                                            readOnly
                                            className="h-7 text-[10px] font-mono bg-black/40 border-transparent text-zinc-500 cursor-default"
                                        />
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-zinc-600 uppercase">Temp</span>
                                            <Input
                                                type="number"
                                                value={record.temperature_2m}
                                                onChange={(e) => handleUpdateField(i, 'temperature_2m', e.target.value)}
                                                className="h-7 pl-10 text-[11px] font-bold bg-black/20 border-white/5 text-primary focus:border-primary"
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-zinc-600 uppercase">Pres</span>
                                            <Input
                                                type="number"
                                                value={record.surface_pressure}
                                                onChange={(e) => handleUpdateField(i, 'surface_pressure', e.target.value)}
                                                className="h-7 pl-10 text-[11px] font-bold bg-black/20 border-white/5 text-zinc-400"
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-zinc-600 uppercase">Wind</span>
                                            <Input
                                                type="number"
                                                value={record.wind_speed_10m}
                                                onChange={(e) => handleUpdateField(i, 'wind_speed_10m', e.target.value)}
                                                className="h-7 pl-10 text-[11px] font-bold bg-black/20 border-white/5 text-zinc-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8">
                            <pre className="p-6 rounded-3xl bg-black/40 border border-white/[0.1] text-emerald-400/90 text-[11px] font-mono leading-relaxed overflow-x-auto">
                                {JSON.stringify({ recent_history: consoleHistory }, null, 2)}
                            </pre>
                        </div>
                    )}
                </ScrollArea>

                {consoleError && (
                    <div className="px-8 py-3 bg-destructive/10 border-t border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {consoleError}
                    </div>
                )}
            </div>

            {/* Right: Output / Visualizer */}
            <div className="xl:col-span-5 flex flex-col gap-8">
                {/* Visual Chart Card */}
                <div className="flex-1 glass rounded-[2.5rem] p-10 border-white/[0.05] relative overflow-hidden flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                                <ChartIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black text-white uppercase tracking-widest italic">Simulation Output</h4>
                                <p className="text-[9px] text-zinc-500 uppercase font-black">7-Day Forecast Visualization</p>
                            </div>
                        </div>
                        {isConsoleLoading && (
                            <div className="h-2 w-2 rounded-full bg-primary animate-ping"></div>
                        )}
                    </div>

                    <div className="flex-1 w-full relative">
                        {consolePredictions ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="hour" hide />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="#ffffff20"
                                        fontSize={10}
                                        tickFormatter={(v) => `${v}°`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                                        itemStyle={{ color: '#38bdf8', fontSize: '12px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="temp"
                                        stroke="#38bdf8"
                                        strokeWidth={3}
                                        dot={false}
                                        animationDuration={1000}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                                <div className="p-6 rounded-full bg-white/[0.02] border border-white/[0.05]">
                                    <Play className="h-8 w-8 text-zinc-800" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">Waiting for Execution</p>
                                    <p className="text-[9px] text-zinc-700 font-bold max-w-[200px]">Update parameters or click 'Run Inference' to see preview</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-10">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Peak Temp</span>
                            <span className="text-xl font-black text-white italic">
                                {consolePredictions ? `${Math.max(...consolePredictions).toFixed(1)}°C` : '--'}
                            </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Low Temp</span>
                            <span className="text-xl font-black text-white italic">
                                {consolePredictions ? `${Math.min(...consolePredictions).toFixed(1)}°C` : '--'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Response Code Card */}
                <div className="glass rounded-[2rem] p-8 border-white/[0.05] bg-emerald-500/[0.02]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Inference Response (JSON)</span>
                    </div>
                    <ScrollArea className="h-[120px]">
                        <pre className="text-[10px] font-mono text-emerald-400/70 leading-relaxed">
                            {consolePredictions
                                ? JSON.stringify({ status: 200, predictions: consolePredictions.slice(0, 10).map(v => parseFloat(v.toFixed(4))), suffix: '...' }, null, 2)
                                : '{ "waiting": "execution..." }'
                            }
                        </pre>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

export default RequestBuilder;
