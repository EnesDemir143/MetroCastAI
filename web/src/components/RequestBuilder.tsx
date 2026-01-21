import React, { useState } from 'react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Upload, AlertCircle, Trash2, LineChart as ChartIcon, Code2, Info } from 'lucide-react';

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

    // Calculate start time based on the last input timestamp
    const lastInputTime = consoleHistory.length > 0
        ? new Date(consoleHistory[consoleHistory.length - 1].timestamp).getTime()
        : Date.now();

    const chartData = consolePredictions?.map((temp, i) => {
        const time = new Date(lastInputTime + (i + 1) * 3600000); // Add (i+1) hours
        const dayName = new Intl.DateTimeFormat(language, { weekday: 'short' }).format(time);
        const hourStr = time.getHours().toString().padStart(2, '0') + ':00';
        return {
            timeLabel: `${dayName} ${hourStr}`, // For Tooltip: "Mon 14:00"
            dayLabel: `${dayName}`, // For Axis: "Mon"
            temp: parseFloat(temp.toFixed(1))
        };
    }) || [];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch max-w-full overflow-hidden">
            {/* Left: Input Console */}
            <div className="xl:col-span-7 flex flex-col rounded-[2.5rem] glass-darker overflow-hidden border-white/[0.08] shadow-2xl h-[800px] relative transition-all duration-300">
                {/* Header - Fixed Overlap */}
                <div className="flex-none px-8 py-8 border-b border-white/[0.05] bg-black/40 flex items-center justify-between gap-4 z-20">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 shrink-0">
                            <span className="text-[10px] font-black text-[#0ea5e9] tracking-widest uppercase">POST</span>
                            <span className="text-[10px] font-mono text-zinc-400">/predict</span>
                        </div>
                        <h4 className="text-[14px] font-black text-white uppercase tracking-[0.2em] italic truncate">
                            SIMÜLASYON OLUŞTURUCU
                        </h4>
                    </div>

                    <div className="flex glass p-1.5 rounded-full border-white/[0.1] shrink-0 gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-9 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-[#0ea5e9] text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <Info className="h-3.5 w-3.5 mr-2" />
                            PARAMS
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-9 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'json' ? 'bg-[#0ea5e9] text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                            onClick={() => setViewMode('json')}
                        >
                            <Code2 className="h-3.5 w-3.5 mr-2" />
                            PAYLOAD
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex-none px-8 py-5 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between z-10">
                    <div className="flex gap-6">
                        <Label htmlFor="csv-upload-console" className="cursor-pointer flex items-center gap-3 group">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-[#0ea5e9]/20 group-hover:border-[#0ea5e9]/30 transition-all">
                                <Upload className="h-4 w-4 text-zinc-400 group-hover:text-[#0ea5e9]" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-300 uppercase tracking-[0.15em] transition-colors">CSV UPLOAD</span>
                            <input id="csv-upload-console" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </Label>
                        <button onClick={clearHistory} className="flex items-center gap-3 group">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-destructive/20 group-hover:border-destructive/30 transition-all">
                                <Trash2 className="h-4 w-4 text-zinc-400 group-hover:text-destructive" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-300 uppercase tracking-[0.15em] transition-colors">CLEAR</span>
                        </button>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => fetchConsolePrediction()}
                        disabled={isConsoleLoading}
                        className="h-11 px-8 bg-gradient-to-r from-[#10b981] to-[#059669] text-white hover:from-[#059669] hover:to-[#047857] font-black text-[11px] uppercase tracking-widest rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-white/10"
                    >
                        {isConsoleLoading ? (
                            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2"></div>
                        ) : (
                            <Play className="h-3.5 w-3.5 mr-2 fill-current" />
                        )}
                        RUN INFERENCE
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-black/20 overflow-auto">
                    {viewMode === 'table' ? (
                        <div className="p-8 space-y-2.5">
                            <div className="min-w-[1400px]">
                                {/* Column Headers for Clarity */}
                                <div className="flex items-center gap-3 px-2 mb-4 opacity-50">
                                    <span className="w-14 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center shrink-0">Index</span>
                                    <span className="w-16 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center shrink-0">Clock</span>

                                    <div className="flex-1 grid grid-cols-11 gap-2">
                                        <span className="text-[9px] font-black text-[#0ea5e9] uppercase tracking-widest text-center">Temp (°C)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Hum (%)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Dew (°C)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Press (hPa)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Precip (mm)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Cloud (%)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Rad (W/m²)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Wind (m/s)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Dir (°)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Soil (°C)</span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Code</span>
                                    </div>
                                </div>

                                {consoleHistory.map((record, i) => (
                                    <div key={i} className="flex items-center gap-3 group">
                                        {/* T-Hour Pill */}
                                        <div className="w-14 h-9 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.05] text-[10px] font-bold text-zinc-500 font-mono tracking-tighter shrink-0 group-hover:border-white/10 group-hover:text-zinc-400 transition-all">
                                            T-{167 - i}h
                                        </div>

                                        {/* Time Value Pill */}
                                        <div className="w-16 h-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/[0.05] text-[11px] font-bold text-zinc-400 font-mono shrink-0 group-hover:border-white/10 transition-all">
                                            {record.timestamp.split('T')[1].substring(0, 5)}
                                        </div>

                                        <div className="flex-1 grid grid-cols-11 gap-2 p-1">
                                            <Input
                                                type="number"
                                                value={record.temperature_2m}
                                                onChange={(e) => handleUpdateField(i, 'temperature_2m', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-[#0ea5e9]/10 border-white/[0.05] text-[#0ea5e9] text-center rounded-xl focus:bg-[#0ea5e9]/20 focus:border-[#0ea5e9]/50 transition-all placeholder:text-[#0ea5e9]/30"
                                            />
                                            <Input
                                                type="number"
                                                value={record.relative_humidity_2m}
                                                onChange={(e) => handleUpdateField(i, 'relative_humidity_2m', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                            <Input
                                                type="number"
                                                value={record.dew_point_2m}
                                                onChange={(e) => handleUpdateField(i, 'dew_point_2m', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                            <Input
                                                type="number"
                                                value={record.surface_pressure}
                                                onChange={(e) => handleUpdateField(i, 'surface_pressure', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                            <Input
                                                type="number"
                                                value={record.precipitation}
                                                onChange={(e) => handleUpdateField(i, 'precipitation', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                            <Input
                                                type="number"
                                                value={record.cloud_cover}
                                                onChange={(e) => handleUpdateField(i, 'cloud_cover', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                            <Input
                                                type="number"
                                                value={record.shortwave_radiation}
                                                onChange={(e) => handleUpdateField(i, 'shortwave_radiation', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                            <Input
                                                type="number"
                                                value={record.wind_speed_10m}
                                                onChange={(e) => handleUpdateField(i, 'wind_speed_10m', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                            <Input
                                                type="number"
                                                value={record.wind_direction_10m}
                                                onChange={(e) => handleUpdateField(i, 'wind_direction_10m', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                            <Input
                                                type="number"
                                                value={record.soil_temperature_0_to_7cm}
                                                onChange={(e) => handleUpdateField(i, 'soil_temperature_0_to_7cm', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                            <Input
                                                type="number"
                                                value={record.weather_code}
                                                onChange={(e) => handleUpdateField(i, 'weather_code', e.target.value)}
                                                className="h-9 text-[11px] font-bold bg-black/40 border-white/[0.05] text-zinc-300 text-center rounded-xl focus:bg-white/[0.05] focus:border-white/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 h-full flex flex-col">
                            <div className="flex-1 p-8 rounded-[2rem] bg-black/40 border border-white/10 font-mono text-[11px] text-[#0ea5e9] leading-relaxed overflow-x-auto shadow-inner">
                                <pre>{JSON.stringify({ input_data: consoleHistory }, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </div>

                {consoleError && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-destructive/90 border border-destructive text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl backdrop-blur-md">
                        <AlertCircle className="h-4 w-4" />
                        {consoleError}
                    </div>
                )}
            </div>

            {/* Right: Output Side */}
            <div className="xl:col-span-5 flex flex-col gap-8 h-[800px]">
                {/* Result Visualizer - Matching Screenshot */}
                <div className="flex-[0.6] glass-darker rounded-[3rem] p-10 border-white/[0.08] flex flex-col shadow-2xl relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0ea5e9]/5 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="flex items-center gap-5 mb-8 relative z-10">
                        <div className="p-3.5 rounded-2xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 shadow-[0_0_20px_rgba(14,165,233,0.15)]">
                            <ChartIcon className="h-6 w-6 text-[#0ea5e9]" />
                        </div>
                        <div>
                            <h4 className="text-[15px] font-black text-white uppercase tracking-[0.2em] italic">SIMULATION OUTPUT</h4>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">7-DAY FORECAST VISUALIZATION</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full bg-black/40 rounded-[2.5rem] p-6 border border-white/[0.05] flex items-center justify-center relative overflow-hidden group-hover:border-white/[0.08] transition-all">
                        {consolePredictions ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="timeLabel"
                                        hide={false}
                                        interval={23} // Show one tick every 24 hours
                                        tick={{ fill: '#71717a', fontSize: 9, fontWeight: 700 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => val.split(' ')[0]} // Show only Day Name on axis
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="#ffffff10"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `${v}°`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff05', borderRadius: '1rem', fontSize: '11px', fontWeight: 'bold', padding: '12px' }}
                                        itemStyle={{ color: '#0ea5e9' }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                        formatter={(value: number | string | Array<number | string> | undefined) => {
                                            if (value === undefined || Array.isArray(value)) return ['--', 'Temperature'];
                                            return [`${Number(value).toFixed(1)}°C`, 'Temperature'];
                                        }}
                                        labelStyle={{ color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="temp"
                                        stroke="#0ea5e9"
                                        strokeWidth={3}
                                        dot={false}
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center gap-6 text-center opacity-50">
                                <div className="h-20 w-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center bg-white/[0.02]">
                                    <Play className="h-8 w-8 text-zinc-600 ml-1" />
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-[12px] font-black text-zinc-400 uppercase tracking-[0.2em]">Ready to Simulate</h5>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-8 relative z-10">
                        <div className="p-6 rounded-[2rem] bg-black/20 border border-white/5 flex flex-col gap-3 hover:bg-white/[0.02] transition-colors">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">PEAK TEMP</span>
                            <span className="text-3xl font-black text-white italic">
                                {consolePredictions ? `${Math.max(...consolePredictions).toFixed(1)}°` : '--'}
                            </span>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-black/20 border border-white/5 flex flex-col gap-3 hover:bg-white/[0.02] transition-colors">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">LOW TEMP</span>
                            <span className="text-3xl font-black text-white italic">
                                {consolePredictions ? `${Math.min(...consolePredictions).toFixed(1)}°` : '--'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* API Response JSON - Matching Screenshot Bottom Right */}
                <div className="flex-[0.4] glass-darker rounded-[2.5rem] p-10 border-white/[0.08] bg-black/40 flex flex-col gap-6 shadow-xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#10b981]/5 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse"></div>
                        <span className="text-[11px] font-black text-[#10b981] uppercase tracking-[0.2em] italic">INFERENCE RESPONSE (JSON)</span>
                    </div>
                    <div className="flex-1 p-6 rounded-2xl bg-black/60 border border-white/[0.03] font-mono text-[11px] text-[#10b981] leading-relaxed shadow-inner overflow-hidden relative z-10">
                        <pre className="h-full overflow-auto no-scrollbar">
                            {consolePredictions
                                ? JSON.stringify({
                                    status: "200 OK",
                                    inference_time: "42ms",
                                    prediction_range: "168h",
                                    samples: consolePredictions.slice(0, 5).map(v => parseFloat(v.toFixed(2)))
                                }, null, 2).replace(']', '\n    ...\n]')
                                : '{ "status": "waiting_for_input" }'
                            }
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default RequestBuilder;
