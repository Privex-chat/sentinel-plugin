import { React } from "@webpack/common";

interface LineChartProps {
    data: { label: string; value: number }[];
    height?: number;
    color?: string;
    showDots?: boolean;
    showLabels?: boolean;
}

export function LineChart({ data, height = 150, color = "#5865f2", showDots = true, showLabels = true }: LineChartProps) {
    if (data.length < 2) return null;

    const padding = { top: 10, right: 10, bottom: showLabels ? 20 : 5, left: 35 };
    const width = Math.max(data.length * 30, 300);
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const minVal = 0;
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * chartW,
        y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
        ...d,
    }));

    const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
    const [hover, setHover] = React.useState<number | null>(null);

    // Y-axis labels
    const ySteps = 4;
    const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round(minVal + (range * i) / ySteps));

    return (
        <div style={{ overflowX: "auto" }}>
            <svg width={width} height={height} style={{ display: "block" }}>
                {/* Grid lines */}
                {yLabels.map((val, i) => {
                    const y = padding.top + chartH - ((val - minVal) / range) * chartH;
                    return (
                        <g key={i}>
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                                stroke="var(--background-modifier-accent)" strokeWidth="1" />
                            <text x={padding.left - 4} y={y + 3} textAnchor="end"
                                fill="var(--text-muted)" fontSize="9">{val}</text>
                        </g>
                    );
                })}

                {/* Line */}
                <polyline
                    points={polyline}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                />

                {/* Area fill */}
                <polygon
                    points={`${points[0].x},${padding.top + chartH} ${polyline} ${points[points.length - 1].x},${padding.top + chartH}`}
                    fill={color}
                    opacity="0.1"
                />

                {/* Dots */}
                {showDots && points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 5 : 3}
                        fill={color} stroke="var(--background-secondary)" strokeWidth="2"
                        style={{ cursor: "pointer", transition: "r 0.1s" }}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                    />
                ))}

                {/* Hover tooltip */}
                {hover !== null && points[hover] && (
                    <g>
                        <rect x={points[hover].x - 25} y={points[hover].y - 22}
                            width="50" height="16" rx="3"
                            fill="var(--background-floating)" />
                        <text x={points[hover].x} y={points[hover].y - 11}
                            textAnchor="middle" fill="var(--text-normal)" fontSize="10">
                            {points[hover].value}
                        </text>
                    </g>
                )}

                {/* X-axis labels */}
                {showLabels && points.map((p, i) => {
                    if (data.length > 15 && i % Math.ceil(data.length / 10) !== 0) return null;
                    return (
                        <text key={i} x={p.x} y={height - 4}
                            textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                            {p.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
