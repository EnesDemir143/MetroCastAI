import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { useWeatherStore } from '../store/useWeatherStore';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md border border-border text-xs">
                <p className="font-semibold mb-1">{label} {data.isForecast ? '(Forecast)' : '(History)'}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }}></div>
                        <span className="font-medium text-sm">{entry.value.toFixed(1)}°C</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ForecastChart = () => {
    const { predictions, inputHistory } = useWeatherStore();
    const color = '#FFD600'; // Always yellow for temperature
    const id = 'colorYellow';

    // Mock data if no predictions yet
    const mockData = Array.from({ length: 24 }).map((_, i) => ({
        time: `${i}:00`,
        temperature: Math.sin(i / 3) * 5 + 15,
        isForecast: true,
    }));

    // Prepare data
    let displayData: any[] = [];
    let forecastStartIndex = -1;

    if (predictions && inputHistory.length >= 24) {
        // Last 24h History
        const last24h = inputHistory.slice(-24).map((record: any) => ({
            time: new Date(record.timestamp).getHours() + ':00',
            temperature: record.temperature_2m,
            isForecast: false,
        }));

        forecastStartIndex = last24h.length;

        // Next 24h Forecast
        const lastTimestamp = inputHistory[inputHistory.length - 1].timestamp;
        const lastHour = new Date(lastTimestamp).getHours();

        const next24h = predictions.map((p, i) => ({
            time: ((lastHour + i + 1) % 24) + ':00',
            temperature: p,
            isForecast: true,
        }));

        displayData = [...last24h, ...next24h];
    } else {
        displayData = mockData;
    }

    return (
        <div className="w-full h-[250px] min-h-[250px] relative transition-colors duration-500">
            <ResponsiveContainer width="100%" height="100%" aspect={3}>
                <AreaChart
                    data={displayData}
                    margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                    onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload.length > 0) {
                            const payload = e.activePayload[0].payload;
                            useWeatherStore.getState().setDisplayedTemp(payload.temperature);
                        }
                    }}
                >
                    <defs>
                        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        interval={3}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />

                    {forecastStartIndex !== -1 && (
                        <ReferenceLine
                            x={displayData[forecastStartIndex]?.time}
                            stroke="hsl(var(--muted-foreground))"
                            strokeDasharray="3 3"
                            label={{ value: 'NOW', position: 'insideTopLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                    )}

                    <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke={color}
                        strokeWidth={3}
                        fill={`url(#${id})`}
                        activeDot={{ r: 6, fill: color, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ForecastChart;
