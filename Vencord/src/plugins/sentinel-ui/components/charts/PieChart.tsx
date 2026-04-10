import { React } from "@webpack/common";

interface PieChartProps {
    data: { label: string; value: number; color: string }[];
    size?: number;
}

export function PieChart({ data, size = 120 }: PieChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return null;

    // Build conic-gradient
    let cumulative = 0;
    const stops: string[] = [];
    for (const item of data) {
        const start = (cumulative / total) * 360;
        cumulative += item.value;
        const end = (cumulative / total) * 360;
        stops.push(`${item.color} ${start}deg ${end}deg`);
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: `conic-gradient(${stops.join(", ")})`,
                flexShrink: 0,
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {data.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                        <div style={{
                            width: "10px", height: "10px", borderRadius: "2px",
                            backgroundColor: item.color, flexShrink: 0,
                        }} />
                        <span style={{ color: "var(--text-normal)" }}>{item.label}</span>
                        <span style={{ color: "var(--text-muted)" }}>
                            {Math.round(item.value / total * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
