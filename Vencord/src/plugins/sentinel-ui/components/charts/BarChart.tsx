import { React } from "@webpack/common";

interface BarChartProps {
    data: { label: string; value: number; color?: string }[];
    maxOverride?: number;
    formatValue?: (v: number) => string;
}

export function BarChart({ data, maxOverride, formatValue }: BarChartProps) {
    const max = maxOverride ?? Math.max(...data.map(d => d.value), 1);
    const fmt = formatValue || ((v: number) => String(v));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.map((item, i) => (
                <div key={i}>
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        marginBottom: "2px", fontSize: "12px",
                    }}>
                        <span style={{ color: "var(--text-normal)" }}>{item.label}</span>
                        <span style={{ color: "var(--text-muted)" }}>{fmt(item.value)}</span>
                    </div>
                    <div style={{
                        height: "8px",
                        backgroundColor: "var(--background-modifier-accent)",
                        borderRadius: "4px",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${(item.value / max) * 100}%`,
                            backgroundColor: item.color || "var(--brand-experiment)",
                            borderRadius: "4px",
                            transition: "width 0.3s ease",
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
