import { React } from "@webpack/common";

interface HeatmapProps {
    data: number[][];  // 7 rows x 24 cols
    rowLabels?: string[];
    colLabels?: string[];
    color?: string;
    maxOverride?: number;
}

const DEFAULT_ROWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_COLS = Array.from({ length: 24 }, (_, i) => `${i}`);

export function Heatmap({ data, rowLabels, colLabels, color = "#5865f2", maxOverride }: HeatmapProps) {
    const max = maxOverride ?? Math.max(...data.flat(), 1);
    const rows = rowLabels || DEFAULT_ROWS;
    const cols = colLabels || DEFAULT_COLS;

    return (
        <div style={{ overflowX: "auto" }}>
            <div style={{
                display: "grid",
                gridTemplateColumns: `40px repeat(${cols.length}, 1fr)`,
                gap: "2px",
                fontSize: "10px",
                minWidth: "500px",
            }}>
                {/* Header row */}
                <div />
                {cols.map((label, i) => (
                    <div key={i} style={{
                        textAlign: "center",
                        color: "var(--text-muted)",
                        padding: "2px 0",
                    }}>{i % 2 === 0 ? label : ""}</div>
                ))}

                {/* Data rows */}
                {data.map((row, rowIdx) => (
                    <React.Fragment key={rowIdx}>
                        <div style={{
                            display: "flex", alignItems: "center",
                            color: "var(--text-muted)", fontSize: "10px",
                            paddingRight: "4px", justifyContent: "flex-end",
                        }}>{rows[rowIdx]}</div>
                        {row.map((value, colIdx) => {
                            const opacity = max > 0 ? value / max : 0;
                            return (
                                <div
                                    key={colIdx}
                                    title={`${rows[rowIdx]} ${cols[colIdx]}:00 - ${value}`}
                                    style={{
                                        backgroundColor: opacity > 0 ? color : "var(--background-tertiary)",
                                        opacity: opacity > 0 ? 0.2 + opacity * 0.8 : 1,
                                        borderRadius: "2px",
                                        minHeight: "16px",
                                        transition: "opacity 0.2s",
                                    }}
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
