import { React } from "@webpack/common";
import { STATUS_COLORS } from "../../styles";

interface TimelineBarProps {
    sessions: {
        type: string;
        label: string;
        start: number;
        end: number;
        color: string;
    }[];
    dayStart: number;
    dayEnd: number;
    height?: number;
}

export function TimelineBar({ sessions, dayStart, dayEnd, height = 24 }: TimelineBarProps) {
    const totalMs = dayEnd - dayStart;
    if (totalMs <= 0) return null;

    // Group by type for stacking
    const types = [...new Set(sessions.map(s => s.type))];

    return (
        <div style={{ position: "relative", marginBottom: "8px" }}>
            {/* Hour markers */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: "9px", color: "var(--text-muted)",
                marginBottom: "2px", padding: "0 2px",
            }}>
                {Array.from({ length: 25 }, (_, i) => (
                    <span key={i}>{i % 4 === 0 ? `${i}` : ""}</span>
                ))}
            </div>

            {types.map((type, typeIdx) => (
                <div key={type} style={{
                    position: "relative",
                    height: `${height}px`,
                    backgroundColor: "var(--background-modifier-accent)",
                    borderRadius: "3px",
                    marginBottom: "2px",
                    overflow: "hidden",
                }}>
                    {/* Type label */}
                    <div style={{
                        position: "absolute", left: "4px", top: "50%",
                        transform: "translateY(-50%)", fontSize: "9px",
                        color: "var(--text-muted)", zIndex: 1,
                        pointerEvents: "none",
                    }}>{type}</div>

                    {sessions.filter(s => s.type === type).map((session, i) => {
                        const left = Math.max(0, ((session.start - dayStart) / totalMs) * 100);
                        const right = Math.min(100, ((session.end - dayStart) / totalMs) * 100);
                        const width = right - left;
                        if (width <= 0) return null;

                        return (
                            <div
                                key={i}
                                title={session.label}
                                style={{
                                    position: "absolute",
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    height: "100%",
                                    backgroundColor: session.color,
                                    opacity: 0.8,
                                    borderRadius: "2px",
                                }}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
