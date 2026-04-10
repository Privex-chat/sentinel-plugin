import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay } from "../common/ErrorBoundary";
import { EmptyState } from "../common/EmptyState";
import { s } from "../../styles";

interface SleepScheduleProps {
    userId: string;
    compact?: boolean;
}

export function SleepScheduleView({ userId, compact }: SleepScheduleProps) {
    const { data, loading, error } = useApi(() => api.getSleepSchedule(userId), [userId]);

    if (loading) return <LoadingSpinner size={24} />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data || !data.estimatedBedtime) return <EmptyState message="Not enough data to estimate sleep schedule" />;

    // Parse times for clock visualization
    const bedHour = parseFloat(data.estimatedBedtime.split(":")[0]) + parseFloat(data.estimatedBedtime.split(":")[1]) / 60;
    const wakeHour = parseFloat(data.estimatedWakeTime.split(":")[0]) + parseFloat(data.estimatedWakeTime.split(":")[1]) / 60;

    return (
        <div style={s.card}>
            <div style={s.subheading}>Sleep Schedule</div>

            {/* Clock visualization */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "12px" }}>
                <svg width={compact ? "80" : "120"} height={compact ? "80" : "120"} viewBox="0 0 120 120">
                    {/* Clock face */}
                    <circle cx="60" cy="60" r="55" fill="var(--background-tertiary)" stroke="var(--background-modifier-accent)" strokeWidth="2" />

                    {/* Hour markers */}
                    {Array.from({ length: 24 }, (_, i) => {
                        const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
                        const inner = 44;
                        const outer = 50;
                        return (
                            <line key={i}
                                x1={60 + Math.cos(angle) * inner} y1={60 + Math.sin(angle) * inner}
                                x2={60 + Math.cos(angle) * outer} y2={60 + Math.sin(angle) * outer}
                                stroke={i % 6 === 0 ? "var(--text-muted)" : "var(--background-modifier-accent)"}
                                strokeWidth={i % 6 === 0 ? 2 : 1}
                            />
                        );
                    })}

                    {/* Sleep arc */}
                    {(() => {
                        const startAngle = (bedHour / 24) * Math.PI * 2 - Math.PI / 2;
                        const endAngle = (wakeHour / 24) * Math.PI * 2 - Math.PI / 2;
                        const r = 38;
                        const largeArc = (wakeHour < bedHour ? (24 - bedHour + wakeHour) : (wakeHour - bedHour)) > 12 ? 1 : 0;
                        const x1 = 60 + Math.cos(startAngle) * r;
                        const y1 = 60 + Math.sin(startAngle) * r;
                        const x2 = 60 + Math.cos(endAngle) * r;
                        const y2 = 60 + Math.sin(endAngle) * r;
                        return (
                            <path
                                d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                                fill="none" stroke="#5865f2" strokeWidth="8" opacity="0.5" strokeLinecap="round"
                            />
                        );
                    })()}

                    {/* Labels */}
                    {[0, 6, 12, 18].map(h => {
                        const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
                        const x = 60 + Math.cos(angle) * 32;
                        const y = 60 + Math.sin(angle) * 32;
                        return (
                            <text key={h} x={x} y={y + 3} textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                                {h === 0 ? "0" : h}
                            </text>
                        );
                    })}
                </svg>

                <div>
                    <div style={{ marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>BEDTIME</span>
                        <div style={{ fontSize: "18px", fontWeight: 600 }}>{data.estimatedBedtime}</div>
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>WAKE TIME</span>
                        <div style={{ fontSize: "18px", fontWeight: 600 }}>{data.estimatedWakeTime}</div>
                    </div>
                    <div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>AVG SLEEP</span>
                        <div style={{ fontSize: "16px", fontWeight: 500 }}>{data.avgSleepDurationHours}h</div>
                    </div>
                </div>
            </div>

            {!compact && (
                <>
                    <div style={s.divider} />
                    <div style={s.grid2}>
                        <div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Weekday Bed</span>
                            <div style={{ fontWeight: 500 }}>{data.weekdayBedtime || "N/A"}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Weekend Bed</span>
                            <div style={{ fontWeight: 500 }}>{data.weekendBedtime || "N/A"}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Weekday Wake</span>
                            <div style={{ fontWeight: 500 }}>{data.weekdayWakeTime || "N/A"}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Weekend Wake</span>
                            <div style={{ fontWeight: 500 }}>{data.weekendWakeTime || "N/A"}</div>
                        </div>
                    </div>
                    <div style={{ ...s.muted, marginTop: "8px" }}>
                        Confidence: {data.confidence}% ({data.dataPoints} data points)
                    </div>
                    {data.irregularities?.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                            <div style={s.subheading}>Irregularities</div>
                            {data.irregularities.map((ir: string, i: number) => (
                                <div key={i} style={{ ...s.muted, marginBottom: "2px" }}>{ir}</div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
