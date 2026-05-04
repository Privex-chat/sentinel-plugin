import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { EmptyState } from "../common/EmptyState";
import { s, C } from "../../styles";

interface CorrelationsViewProps {
    userId: string;
}

export function CorrelationsView({ userId }: CorrelationsViewProps) {
    const { data, loading, error } = useApi(
        () => api.getCorrelations(userId),
        [userId]
    );

    if (loading) return <LoadingSpinner />;
    if (error) return <div style={s.error}>Error loading correlations: {error}</div>;

    // Filter out any malformed entries
    const valid = (data ?? []).filter(
        (c: any) =>
            c != null &&
            typeof c.triggerType === "string" &&
            typeof c.followType === "string" &&
            typeof c.occurrences === "number" &&
            typeof c.avgDelayMs === "number" &&
            typeof c.lift === "number" &&
            typeof c.confidence === "number"
    );

    if (valid.length === 0) {
        return (
            <EmptyState message="No correlations detected yet. Needs more data - two event types must consistently follow each other within a short time window." />
        );
    }

    return (
        <div style={s.col}>
            <div style={{ ...s.muted, marginBottom: "8px" }}>
                Pairs of events that consistently follow each other. Lift = how much more likely the follow event is after the trigger vs. random.
            </div>
            {valid.map((corr: any, i: number) => {
                const lift       = corr.lift ?? 0;
                const confidence = corr.confidence ?? 0;
                const avgDelayMs = corr.avgDelayMs ?? 0;

                const liftColor = lift >= 3
                    ? C.positive
                    : lift >= 1.5
                    ? C.warning
                    : "var(--text-muted)";

                const delayMin = avgDelayMs / 60_000;
                const delayLabel = delayMin < 1
                    ? `${Math.round(avgDelayMs / 1000)}s`
                    : `${delayMin.toFixed(1)}m`;

                const triggerLabel = corr.triggerType.replace(/_/g, " ");
                const followLabel  = corr.followType.replace(/_/g, " ");

                return (
                    <div key={i} style={s.card}>
                        <div style={{ ...s.row, alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                                    When{" "}
                                    <span style={{
                                        fontFamily: "monospace",
                                        fontSize: "11px",
                                        padding: "1px 6px",
                                        backgroundColor: "var(--background-secondary)",
                                        borderRadius: "3px",
                                        color: "var(--text-normal)",
                                    }}>
                                        {triggerLabel}
                                    </span>
                                    {" "}happens,{" "}
                                    <span style={{
                                        fontFamily: "monospace",
                                        fontSize: "11px",
                                        padding: "1px 6px",
                                        backgroundColor: "var(--background-secondary)",
                                        borderRadius: "3px",
                                        color: "var(--text-normal)",
                                    }}>
                                        {followLabel}
                                    </span>
                                    {" "}follows <strong>{corr.occurrences}x</strong> within ~{delayLabel}
                                </div>

                                {/* Confidence bar */}
                                <div style={{ ...s.row, marginTop: "8px", gap: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <div style={{ ...s.progressBar, width: "80px", height: "4px" }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${Math.round(confidence * 100)}%`,
                                                backgroundColor: liftColor,
                                                borderRadius: "3px",
                                                transition: "width 0.3s ease",
                                            }} />
                                        </div>
                                        <span style={s.muted}>{Math.round(confidence * 100)}% conf</span>
                                    </div>
                                    <span style={s.muted}>avg {delayLabel} delay</span>
                                </div>
                            </div>

                            {/* Lift badge */}
                            <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "16px", color: liftColor }}>
                                    {lift.toFixed(1)}x
                                </div>
                                <div style={{ ...s.muted, fontSize: "9px" }}>lift</div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
