import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { EmptyState } from "../common/EmptyState";
import { s, C } from "../../styles";

const STATUS_CFG: Record<string, { label: string; color: string; icon: string }> = {
    completed:   { label: "Done",        color: C.positive, icon: "OK" },
    failed:      { label: "Failed",      color: C.danger,   icon: "X" },
    in_progress: { label: "In Progress", color: C.warning,  icon: "~" },
    pending:     { label: "Pending",     color: C.offline,  icon: "." },
    skipped:     { label: "Skipped",     color: C.offline,  icon: "-" },
    paused:      { label: "Paused",      color: C.purple,   icon: "||" },
};

function fmt(ts: number | null): string {
    if (!ts) return "";
    return new Date(ts).toLocaleString();
}

interface BackfillTabProps {
    userId: string;
}

export function BackfillTab({ userId }: BackfillTabProps) {
    const { data, loading, error, refetch } = useApi(
        () => api.getBackfillProgress(userId),
        [userId]
    );

    const [starting, setStarting] = React.useState(false);
    const [customMode, setCustomMode] = React.useState<"new_channels" | "full_reset" | null>(null);
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [actionError, setActionError] = React.useState<string | null>(null);

    const handleStart = async () => {
        setStarting(true);
        setActionError(null);
        try {
            await api.startBackfill(userId);
            await refetch();
        } catch (e: any) {
            setActionError(e.message || "Failed to start backfill");
        } finally {
            setStarting(false);
        }
    };

    const handleCustom = async (mode: "new_channels" | "full_reset") => {
        setCustomMode(mode);
        setActionError(null);
        try {
            await api.resetBackfill(userId, mode);
            await refetch();
        } catch (e: any) {
            setActionError(e.message || `Failed to run ${mode}`);
        } finally {
            setCustomMode(null);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div style={s.error}>Error: {error}</div>;
    if (!data) return (
        <EmptyState message="No backfill data. Start a backfill to retrieve historical messages." />
    );

    const { summary, channels } = data;
    const completedPct = summary.total > 0
        ? Math.round(((summary.completed + summary.skipped) / summary.total) * 100)
        : 0;

    const filteredChannels = (statusFilter === "all")
        ? channels
        : channels.filter((c: any) => c.status === statusFilter);

    const statKeys = ["total", "pending", "in_progress", "completed", "failed", "skipped"] as const;

    return (
        <div style={s.col}>
            {/* Summary card */}
            <div style={{ ...s.card, borderLeft: "3px solid var(--brand-experiment)" }}>
                <div style={{ ...s.row, justifyContent: "space-between", flexWrap: "wrap" as const, marginBottom: "12px", gap: "6px" }}>
                    <span style={s.subheading}>Backfill Progress</span>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                        {summary.failed > 0 && (
                            <span
                                style={{ ...s.linkButton, padding: "4px 10px", backgroundColor: "rgba(240,71,71,0.15)", color: C.danger, borderRadius: "4px", fontSize: "11px", cursor: starting || customMode ? "default" : "pointer", opacity: starting || customMode ? 0.5 : 1 }}
                                onClick={starting || customMode ? undefined : handleStart}
                            >
                                Retry Failed
                            </span>
                        )}
                        <span
                            style={{ ...s.linkButton, padding: "4px 10px", backgroundColor: "var(--background-tertiary)", color: "var(--text-normal)", borderRadius: "4px", fontSize: "11px", cursor: starting || customMode ? "default" : "pointer", opacity: starting || customMode ? 0.5 : 1 }}
                            onClick={starting || customMode ? undefined : () => handleCustom("new_channels")}
                            title="Re-fetch profile and add newly joined mutual servers"
                        >
                            {customMode === "new_channels" ? "Scanning..." : "+ Scan New Servers"}
                        </span>
                        <span
                            style={{ ...s.linkButton, padding: "4px 10px", backgroundColor: "rgba(240,71,71,0.15)", color: C.danger, borderRadius: "4px", fontSize: "11px", cursor: starting || customMode ? "default" : "pointer", opacity: starting || customMode ? 0.5 : 1 }}
                            onClick={starting || customMode ? undefined : () => handleCustom("full_reset")}
                            title="Reset all progress and re-scan every channel from scratch"
                        >
                            {customMode === "full_reset" ? "Resetting..." : "Full Reset"}
                        </span>
                        <span
                            style={{ ...s.linkButton, padding: "4px 10px", backgroundColor: starting ? "var(--background-modifier-accent)" : "var(--brand-experiment)", color: "white", borderRadius: "4px", fontSize: "11px", cursor: starting || customMode ? "default" : "pointer", opacity: starting || customMode ? 0.7 : 1 }}
                            onClick={starting || customMode ? undefined : handleStart}
                        >
                            {starting ? "Starting..." : "Start Backfill"}
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: "12px" }}>
                    <div style={{ ...s.row, justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={s.muted}>{completedPct}% complete</span>
                        <span style={{ ...s.muted, fontFamily: "monospace" }}>
                            {summary.totalMessagesFound.toLocaleString()} messages found
                        </span>
                    </div>
                    <div style={s.progressBar}>
                        <div style={s.progressFill(completedPct, "#43b581")} />
                    </div>
                </div>

                {/* Stat tiles */}
                <div style={{ ...s.grid4 }}>
                    {statKeys.map(key => {
                        const val = summary[key as keyof typeof summary] as number;
                        const color = key === "failed"      ? C.danger
                            : key === "completed"   ? C.positive
                            : key === "in_progress" ? C.warning
                            : "var(--text-normal)";
                        const filterKey = key === "total" ? "all" : key;
                        const active = statusFilter === filterKey;
                        return (
                            <div
                                key={key}
                                style={{
                                    ...s.statCard,
                                    cursor: "pointer",
                                    outline: active ? "2px solid var(--brand-experiment)" : "none",
                                    outlineOffset: "-2px",
                                }}
                                onClick={() => setStatusFilter(active ? "all" : filterKey)}
                            >
                                <div style={{ ...s.statValue, color, fontSize: "18px" }}>{val}</div>
                                <div style={s.statLabel}>{key.replace("_", " ")}</div>
                            </div>
                        );
                    })}
                </div>

                {actionError && (
                    <div style={{ ...s.muted, color: C.danger, marginTop: "8px" }}>{actionError}</div>
                )}
            </div>

            {/* Channel list */}
            {filteredChannels.length === 0 ? (
                <EmptyState message="No channels match this filter" />
            ) : (
                <div style={{ ...s.card, padding: "0", overflow: "hidden" }}>
                    <div style={{ maxHeight: "480px", overflowY: "auto" as const }}>
                        {(filteredChannels as any[]).map((ch: any) => {
                            const cfg = STATUS_CFG[ch.status] || STATUS_CFG.pending;
                            return (
                                <div
                                    key={ch.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "10px",
                                        padding: "8px 12px",
                                        borderBottom: "1px solid var(--background-modifier-accent)",
                                    }}
                                >
                                    <span style={{ color: cfg.color, fontSize: "14px", flexShrink: 0, marginTop: "2px" }}>
                                        {cfg.icon}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" as const }}>
                                            <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--text-normal)" }}>
                                                {ch.channel_id}
                                            </span>
                                            <span style={s.badge(cfg.color)}>{cfg.label}</span>
                                            {ch.messages_found > 0 && (
                                                <span style={s.muted}>{ch.messages_found.toLocaleString()} msgs</span>
                                            )}
                                        </div>
                                        {ch.error && (
                                            <div style={{ fontSize: "10px", color: C.danger, marginTop: "2px" }}>
                                                {ch.error}
                                            </div>
                                        )}
                                        {ch.completed_at && (
                                            <div style={s.muted}>{fmt(ch.completed_at)}</div>
                                        )}
                                    </div>
                                    <span style={{ ...s.muted, fontFamily: "monospace", fontSize: "10px", flexShrink: 0 }}>
                                        {ch.guild_id?.slice(-8)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
