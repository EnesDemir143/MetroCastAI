import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useWeatherStore } from '../store/useWeatherStore';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md border border-border text-xs">
                <p className="font-semibold mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }}></div>
                        <span>{entry.value.toFixed(1)}°</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ForecastChart = () => {
    const { predictions, realData, activeTab } = useWeatherStore();

    // Determine colors based on active activeTab
    // Temperature: Yellow (#FFD600)
    // Precipitation: Blue (#3B82F6)
    // Wind: Green (#22C55E)
    const getConfig = () => {
        switch (activeTab) {
            case 'precipitation': return { color: '#3B82F6', id: 'colorBlue' };
            case 'wind': return { color: '#22C55E', id: 'colorGreen' };
            case 'temperature':
            default: return { color: '#FFD600', id: 'colorYellow' };
        }
    };

    const { color, id } = getConfig();

    // Mock data if no predictions yet
    const mockData = Array.from({ length: 24 }).map((_, i) => ({
        time: `${i}:00`,
        prediction: activeTab === 'temperature' ? Math.sin(i / 3) * 5 + 15 : Math.random() * 10,
    }));

    // Prepare data
    // Note: Improvements would be needed to show actual different data for Rain/Wind if backend supported it
    let displayData = mockData;
    if (predictions) {
        displayData = predictions.map((p, i) => ({
            time: `${i}:00`,
            prediction: activeTab === 'temperature' ? p : Math.random() * 20, // Mock other metrics
            real: realData ? realData[i] : null,
        }));
    }

    return (
        <div className="w-full h-[250px] relative transition-colors duration-500">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={displayData}
                    margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                    onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload.length > 0) {
                            const payload = e.activePayload[0].payload;
                            useWeatherStore.getState().setDisplayedTemp(payload.prediction);
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
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        interval={3}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />

                    <Area
                        type="monotone"
                        dataKey="prediction"
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
