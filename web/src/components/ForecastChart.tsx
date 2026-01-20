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
    const { predictions, realData } = useWeatherStore();

    // Mock data if no predictions yet to show the UI
    const mockData = Array.from({ length: 24 }).map((_, i) => ({
        time: `${i}:00`,
        prediction: Math.sin(i / 3) * 5 + 15 + Math.random(),
    }));

    // Prepare data
    let displayData = mockData;
    if (predictions) {
        displayData = predictions.map((p, i) => ({
            time: `${i}:00`,
            prediction: p,
            real: realData ? realData[i] : null,
        }));
    }

    return (
        <div className="w-full h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorYellow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFD600" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#FFD600" stopOpacity={0} />
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
                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />

                    <Area
                        type="monotone"
                        dataKey="prediction"
                        stroke="#FFD600"
                        strokeWidth={3}
                        fill="url(#colorYellow)"
                        activeDot={{ r: 6, fill: '#FFD600', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ForecastChart;
