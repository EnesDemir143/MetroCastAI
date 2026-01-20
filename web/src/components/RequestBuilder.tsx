import React, { useState, useCallback } from 'react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Upload, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WeatherInputRecord } from '@/services/api';
import { debounce } from 'lodash';
import { translations } from '@/utils/translations';

const RequestBuilder = () => {
    const { inputHistory, setInputHistory, fetchPrediction, isLoading, error, language } = useWeatherStore();
    const t = translations[language];
    const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
    const [lastExecutionTime, setLastExecutionTime] = useState<number | null>(null);

    // Debounced prediction for "enter values one by one" logic
    const debouncedPredict = useCallback(
        debounce(() => {
            fetchPrediction();
            setLastExecutionTime(Date.now());
        }, 1000),
        [fetchPrediction]
    );

    const handleUpdateField = (index: number, field: keyof WeatherInputRecord, value: string) => {
        const newHistory = [...inputHistory];
        const numValue = field === 'timestamp' ? value : parseFloat(value);
        (newHistory[index] as any)[field] = isNaN(numValue as any) && field !== 'timestamp' ? 0 : numValue;
        setInputHistory(newHistory);
        debouncedPredict();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = lines.slice(1, 25).map(line => {
                const values = line.split(',');
                const record: any = {};
                headers.forEach((header, i) => {
                    const key = header === 'time' ? 'timestamp' : header;
                    const val = values[i];
                    record[key] = (key === 'timestamp') ? val : parseFloat(val);
                });
                return record as WeatherInputRecord;
            });
            if (data.length === 24) {
                setInputHistory(data);
                fetchPrediction();
                setLastExecutionTime(Date.now());
            }
        };
        reader.readAsText(file);
    };

    const clearHistory = () => {
        const empty = Array(24).fill(null).map((_, i) => ({
            timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
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
        setInputHistory(empty);
    };

    return (
        <div className="rounded-[2rem] glass-darker overflow-hidden border-white/[0.08] shadow-2xl">
            {/* Header / API Bar */}
            <div className="px-8 py-6 border-b border-white/[0.05] bg-black/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                        <span className="text-[10px] font-black text-primary tracking-widest uppercase">POST</span>
                        <div className="h-3 w-px bg-primary/20"></div>
                        <span className="text-[11px] font-mono font-bold text-white">/api/predict</span>
                    </div>
                    <div className="hidden sm:block h-4 w-px bg-white/[0.05]"></div>
                    <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">{t.requestBuilder}</p>
                </div>

                <div className="flex glass p-1 rounded-full border-white/[0.05]">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        onClick={() => setViewMode('table')}
                    >
                        Params
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'json' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        onClick={() => setViewMode('json')}
                    >
                        JSON
                    </Button>
                </div>
            </div>

            {/* Controls Sub-Bar */}
            <div className="px-8 py-4 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
                <div className="flex gap-6">
                    <Label htmlFor="csv-upload" className="cursor-pointer flex items-center gap-2 group">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                            <Upload className="h-3 w-3 text-zinc-400 group-hover:text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest transition-colors">Import CSV</span>
                        <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </Label>
                    <button onClick={clearHistory} className="flex items-center gap-2 group">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-destructive/10 group-hover:border-destructive/20 transition-all">
                            <Trash2 className="h-3 w-3 text-zinc-400 group-hover:text-destructive" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest transition-colors">Clear Data</span>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {isLoading ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border-white/[0.05]">
                            <div className="h-1 w-1 rounded-full bg-primary animate-ping"></div>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-tighter italic">Inference Engine Busy...</span>
                        </div>
                    ) : lastExecutionTime && (
                        <div className="flex items-center gap-2 text-emerald-500 animate-in fade-in slide-in-from-right-2 duration-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Model Sync: {new Date(lastExecutionTime).toLocaleTimeString()}</span>
                        </div>
                    )}
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => fetchPrediction()}
                        disabled={isLoading}
                        className="h-9 px-5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                    >
                        <Play className="h-3 w-3 mr-2 fill-current" />
                        Request
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest px-8 py-3 flex items-center gap-3 border-b border-destructive/20 animate-in slide-in-from-top duration-500">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            <ScrollArea className="h-[450px]">
                {viewMode === 'table' ? (
                    <div className="p-8 space-y-4">
                        <div className="grid grid-cols-12 gap-4 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 border-b border-white/[0.03] pb-4">
                            <div className="col-span-1">Rel</div>
                            <div className="col-span-3">ISO Timestamp</div>
                            <div className="col-span-2">TEMP (°C)</div>
                            <div className="col-span-2">PR (hPa)</div>
                            <div className="col-span-2">RH (%)</div>
                            <div className="col-span-2">WD (km/h)</div>
                        </div>

                        <div className="space-y-2">
                            {inputHistory.map((record, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 items-center px-4 py-2.5 rounded-2xl glass border-transparent hover:border-white/10 hover:bg-white/[0.04] transition-all group">
                                    <div className="col-span-1 text-[9px] font-black text-zinc-600 group-hover:text-primary transition-colors">T-{23 - i}h</div>
                                    <div className="col-span-3">
                                        <Input
                                            value={record.timestamp}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'timestamp', e.target.value)}
                                            className="h-8 text-[11px] font-mono font-bold bg-black/20 border-white/5 text-zinc-400 focus:text-white transition-all focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            value={record.temperature_2m}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'temperature_2m', e.target.value)}
                                            className="h-8 text-[11px] font-bold bg-black/20 border-white/5 text-primary transition-all focus:border-primary"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            value={record.surface_pressure}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'surface_pressure', e.target.value)}
                                            className="h-8 text-[11px] font-bold bg-black/20 border-white/5 text-zinc-400 focus:text-white transition-all focus:border-white/20"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            value={record.relative_humidity_2m}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'relative_humidity_2m', e.target.value)}
                                            className="h-8 text-[11px] font-bold bg-black/20 border-white/5 text-zinc-400 focus:text-white transition-all focus:border-white/20"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            value={record.wind_speed_10m}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'wind_speed_10m', e.target.value)}
                                            className="h-8 text-[11px] font-bold bg-black/20 border-white/5 text-zinc-400 focus:text-white transition-all focus:border-white/20"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 font-mono text-xs leading-relaxed">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600">Request Body</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-4 rounded-full glass border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                                onClick={() => navigator.clipboard.writeText(JSON.stringify({ recent_history: inputHistory }, null, 2))}
                            >
                                Copy Payload
                            </Button>
                        </div>
                        <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.05] relative group">
                            <div className="absolute top-4 right-4 text-[10px] font-mono text-zinc-700 select-none">JSON</div>
                            <pre className="whitespace-pre-wrap overflow-x-auto text-emerald-400/90 text-[11px] leading-relaxed selection:bg-emerald-500/20">
                                {JSON.stringify({ recent_history: inputHistory }, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default RequestBuilder;
