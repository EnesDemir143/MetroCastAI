import React, { useState, useCallback } from 'react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Upload, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WeatherInputRecord } from '@/services/api';
import { debounce } from 'lodash';

const RequestBuilder = () => {
    const { inputHistory, setInputHistory, fetchPrediction, isLoading, error } = useWeatherStore();
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
        <Card className="border-border/40 bg-zinc-950 text-zinc-100 overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4 bg-zinc-900/50">
                <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2 font-mono">
                        <span className="bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded text-xs font-bold uppercase">POST</span>
                        /predict
                        <span className="text-zinc-500 font-normal text-sm ml-2">Execute Inference</span>
                    </CardTitle>
                    <CardDescription className="text-zinc-500">Provide 24h historical context for temperature prediction</CardDescription>
                </div>
                <div className="flex gap-2">
                    <div className="flex border border-zinc-800 rounded-md p-0.5 bg-zinc-800/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-3 text-xs ${viewMode === 'table' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                            onClick={() => setViewMode('table')}
                        >
                            Parameters
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-3 text-xs ${viewMode === 'json' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                            onClick={() => setViewMode('json')}
                        >
                            JSON Body
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/20">
                    <div className="flex gap-4 items-center">
                        <Label htmlFor="csv-upload" className="cursor-pointer flex items-center gap-2 text-xs text-zinc-400 hover:text-primary transition-colors">
                            <Upload className="h-3 w-3" />
                            Import CSV
                            <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </Label>
                        <button onClick={clearHistory} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-destructive transition-colors">
                            <Trash2 className="h-3 w-3" />
                            Clear
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoading && <span className="text-[10px] text-zinc-500 animate-pulse">Inference running...</span>}
                        {!isLoading && lastExecutionTime && (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Updated {new Date(lastExecutionTime).toLocaleTimeString()}
                            </span>
                        )}
                        <Button variant="default" size="sm" onClick={() => fetchPrediction()} disabled={isLoading} className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white gap-2 border-none">
                            <Play className="h-3 w-3 fill-current" />
                            Try it out
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-400 text-xs p-3 flex items-center gap-2 border-b border-red-500/20">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                <ScrollArea className="h-[500px] bg-zinc-950">
                    {viewMode === 'table' ? (
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-zinc-600 border-b border-zinc-900 pb-2 px-2">
                                <div className="col-span-1">Time</div>
                                <div className="col-span-3">Timestamp</div>
                                <div className="col-span-2">Temp (°C)</div>
                                <div className="col-span-2">Pressure</div>
                                <div className="col-span-2">Humid %</div>
                                <div className="col-span-2">Wind km/h</div>
                            </div>
                            {inputHistory.map((record, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded hover:bg-zinc-900/40 group transition-colors">
                                    <div className="col-span-1 text-[10px] font-mono text-zinc-500">T-{23 - i}h</div>
                                    <div className="col-span-3">
                                        <Input
                                            value={record.timestamp}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'timestamp', e.target.value)}
                                            className="h-7 text-[10px] font-mono bg-zinc-900 border-zinc-800 text-zinc-300 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            value={record.temperature_2m}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'temperature_2m', e.target.value)}
                                            className="h-7 text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            value={record.surface_pressure}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'surface_pressure', e.target.value)}
                                            className="h-7 text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            value={record.relative_humidity_2m}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'relative_humidity_2m', e.target.value)}
                                            className="h-7 text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            value={record.wind_speed_10m}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(i, 'wind_speed_10m', e.target.value)}
                                            className="h-7 text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 font-mono text-xs leading-relaxed text-zinc-400">
                            <div className="flex justify-between items-center mb-4 text-[10px] uppercase font-bold text-zinc-600">
                                <span>Request Payload</span>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] hover:text-white" onClick={() => navigator.clipboard.writeText(JSON.stringify({ recent_history: inputHistory }, null, 2))}>
                                    Copy Code
                                </Button>
                            </div>
                            <pre className="whitespace-pre-wrap overflow-x-auto text-emerald-500/80">
                                {JSON.stringify({ recent_history: inputHistory }, null, 2)}
                            </pre>
                        </div>
                    )}
                </ScrollArea>
                <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800 flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            API Connected
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <span className="font-mono">Content-Type:</span> application/json
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default RequestBuilder;
