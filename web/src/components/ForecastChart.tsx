import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { useWeatherStore } from '../store/useWeatherStore';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="glass-darker px-4 py-3 rounded-2xl border-white/[0.1] shadow-2xl backdrop-blur-2xl">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 border-b border-white/[0.05] pb-1.5">
                    {label} • {data.isForecast ? 'Forecast' : 'History'}
                </p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]" style={{ backgroundColor: entry.stroke }}></div>
                        <span className="text-xl font-black tracking-tighter text-white">{entry.value.toFixed(1)}°C</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ForecastChart = () => {
    const { predictions, inputHistory, selectedDayIndex } = useWeatherStore();
    const color = 'hsl(var(--primary))';
    const id = 'colorAzure';

    // Prepare data
    let displayData: any[] = [];
    let forecastStartIndex = -1;

    if (predictions && inputHistory.length >= 168) {
        if (selectedDayIndex === 0) {
            // Day 0: Show last 24h history + first 24h forecast
            const last24h = inputHistory.slice(-24).map((record: any) => ({
                time: new Date(record.timestamp).getHours() + ':00',
                temperature: record.temperature_2m,
                isForecast: false,
            }));

            forecastStartIndex = last24h.length;

            const lastTimestamp = inputHistory[inputHistory.length - 1].timestamp;
            const lastHour = new Date(lastTimestamp).getHours();

            const next24h = predictions.slice(0, 24).map((p, i) => ({
                time: ((lastHour + i + 1) % 24) + ':00',
                temperature: p,
                isForecast: true,
            }));

            displayData = [...last24h, ...next24h];
        } else {
            // Day 1-6: Show 24h of that specific day
            const lastTimestamp = inputHistory[inputHistory.length - 1].timestamp;
            const lastHour = new Date(lastTimestamp).getHours();

            // Start index for the selected day (24 * index)
            const dayStart = selectedDayIndex * 24;
            const dayEnd = (selectedDayIndex + 1) * 24;

            displayData = predictions.slice(dayStart, dayEnd).map((p, i) => ({
                time: ((lastHour + dayStart + i + 1) % 24) + ':00',
                temperature: p,
                isForecast: true,
            }));

            forecastStartIndex = 0; // All forecast
        }
    } else {
        // Mock data
        displayData = Array.from({ length: 24 }).map((_, i) => ({
            time: `${i}:00`,
            temperature: Math.sin(i / 3) * 5 + 15,
            isForecast: true,
        }));
    }

    return (
        <div className="w-full h-[320px] relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={displayData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                    onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload.length > 0) {
                            const payload = e.activePayload[0].payload;
                            useWeatherStore.getState().setDisplayedTemp(payload.temperature);
                        }
                    }}
                >
                    <defs>
                        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="0" />
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
                        interval={3}
                        dy={15}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    />

                    {forecastStartIndex !== -1 && (
                        <ReferenceLine
                            x={displayData[forecastStartIndex]?.time}
                            stroke="rgba(255,255,255,0.2)"
                            strokeDasharray="4 4"
                            label={{
                                value: 'FORECAST',
                                position: 'insideTopLeft',
                                fill: 'rgba(255,255,255,0.4)',
                                fontSize: 9,
                                fontWeight: 800,
                                letterSpacing: '0.1em'
                            }}
                        />
                    )}

                    <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke={color}
                        strokeWidth={4}
                        fill={`url(#${id})`}
                        filter="url(#glow)"
                        activeDot={{ r: 6, fill: '#fff', stroke: color, strokeWidth: 2 }}
                        animationDuration={1500}
                    />

                    {/* SVG Filter for stroke glow */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ForecastChart;
