import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay } from "../common/ErrorBoundary";
import { EmptyState } from "../common/EmptyState";
import { s } from "../../styles";

const SEVERITY_COLORS = {
    low: "#faa61a",
    medium: "#f47b67",
    high: "#f04747",
};

export function AnomalyFeed({ userId, limit }: { userId: string; limit?: number }) {
    const { data, loading, error } = useApi(() => api.getAnomalies(userId), [userId]);

    if (loading) return <LoadingSpinner size={24} />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data || data.length === 0) return <EmptyState message="No anomalies detected" />;

    const anomalies = limit ? data.slice(0, limit) : data;

    return (
        <div style={s.card}>
            <div style={s.subheading}>Anomalies ({data.length})</div>
            {anomalies.map((a: any, i: number) => {
                const color = SEVERITY_COLORS[a.severity as keyof typeof SEVERITY_COLORS] || "#99aab5";
                return (
                    <div key={i} style={{ ...s.eventItem, borderLeftColor: color }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <span style={s.badge(color)}>{a.severity}</span>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{a.type}</span>
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-normal)", marginTop: "3px" }}>
                                {a.description}
                            </div>
                        </div>
                        <span style={s.timestamp}>
                            {new Date(a.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
