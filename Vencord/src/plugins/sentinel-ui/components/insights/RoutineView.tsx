import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { Heatmap } from "../charts/Heatmap";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay } from "../common/ErrorBoundary";
import { EmptyState } from "../common/EmptyState";
import { s } from "../../styles";

export function RoutineView({ userId }: { userId: string }) {
    const { data, loading, error } = useApi(() => api.getRoutine(userId), [userId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data) return <EmptyState message="No routine data" />;

    const grid = data.weeklyGrid;
    const heatmapData = grid ? grid.map((row: any[]) => row.map((b: any) => b.eventCount)) : [];

    return (
        <div style={s.col}>
            {heatmapData.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Weekly Activity Pattern</div>
                    <Heatmap data={heatmapData} color="#5865f2" />
                </div>
            )}
            {data.summary?.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Routine Summary</div>
                    {data.summary.map((line: string, i: number) => (
                        <div key={i} style={{ fontSize: "12px", color: "var(--text-normal)", marginBottom: "4px", paddingLeft: "8px", borderLeft: "2px solid var(--brand-experiment)" }}>
                            {line}
                        </div>
                    ))}
                </div>
            )}
            {data.anomalies?.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Current Anomalies</div>
                    {data.anomalies.map((a: string, i: number) => (
                        <div key={i} style={{ ...s.badge("#faa61a"), marginBottom: "4px" }}>{a}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
