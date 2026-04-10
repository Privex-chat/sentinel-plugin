import { React } from "@webpack/common";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { UserAvatar, getDisplayName } from "./common/UserAvatar";
import { LoadingSpinner } from "./common/LoadingSpinner";
import { ErrorDisplay } from "./common/ErrorBoundary";
import { EmptyState } from "./common/EmptyState";
import { s, STATUS_COLORS, EVENT_COLORS, EVENT_LABELS } from "../styles";

interface OverviewProps {
    userId: string;
    refreshTrigger?: number;
}

function formatRelative(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

function formatMs(ms: number): string {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function ActivityRow({ label, color, title, subtitle }: {
    label: string; color: string; title: string; subtitle?: string;
}) {
    return (
        <div style={{ ...s.eventItem, borderLeftColor: color, marginBottom: "4px" }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={s.badge(color)}>{label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-normal)" }}>{title}</span>
                </div>
                {subtitle && (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{subtitle}</div>
                )}
            </div>
        </div>
    );
}

export function Overview({ userId, refreshTrigger = 0 }: OverviewProps) {
    const { data: status, loading: statusLoading, error: statusError } = useApi(
        () => api.getTargetStatus(userId),
        [userId, refreshTrigger]
    );
    const { data: targets } = useApi(
        () => api.getTargets(),
        [userId]
    );
    const { data: timeline } = useApi(
        () => api.getTimeline(userId, { limit: "20" }),
        [userId, refreshTrigger]
    );
    const { data: daily } = useApi(
        () => api.getDailySummaries(userId, 1),
        [userId, refreshTrigger]
    );
    const { data: anomalies } = useApi(
        () => api.getAnomalies(userId),
        [userId]
    );

    const target = (targets || []).find((t: any) => t.user_id === userId);
    const presence = status?.presence;
    const activities: any[] = status?.activities || [];
    const voiceState = status?.voiceState;
    const currentStatus = presence?.status || "offline";
    const statusColor = STATUS_COLORS[currentStatus] || STATUS_COLORS.offline;

    const gamingActivity = activities.find((a: any) => a.type === 0);
    const spotifyActivity = activities.find((a: any) => a.type === 2);
    const streamingActivity = activities.find((a: any) => a.type === 1);
    const customStatus = activities.find((a: any) => a.type === 4);

    const todaySummary = daily?.[0];
    const recentEvents = timeline?.events || [];
    const recentAnomalies = (anomalies || []).slice(0, 3);

    if (statusLoading) return <LoadingSpinner />;
    if (statusError) return <ErrorDisplay error={statusError} />;

    return (
        <div style={s.col}>
            {/* ── Target identity card ── */}
            <div style={{
                ...s.card,
                borderLeft: `4px solid ${statusColor}`,
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
            }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <UserAvatar userId={userId} size={64} />
                    <div style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: "18px", height: "18px", borderRadius: "50%",
                        backgroundColor: statusColor,
                        border: "3px solid var(--background-tertiary)",
                    }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--header-primary)", marginBottom: "2px" }}>
                        {getDisplayName(userId)}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace", marginBottom: "6px" }}>
                        {userId}
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, alignItems: "center" }}>
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            fontSize: "13px", fontWeight: 600, color: statusColor,
                        }}>
                            <span style={{
                                width: "8px", height: "8px", borderRadius: "50%",
                                backgroundColor: statusColor, display: "inline-block",
                            }} />
                            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                        </span>
                        {presence?.platform && (
                            <span style={s.badge("#5865f2")}>{presence.platform}</span>
                        )}
                        {target?.label && (
                            <span style={s.badge("#5865f2")}>{target.label}</span>
                        )}
                        {target?.priority > 0 && (
                            <span style={s.badge(target.priority >= 2 ? "#f04747" : "#faa61a")}>
                                {target.priority >= 2 ? "CRITICAL" : "HIGH"}
                            </span>
                        )}
                    </div>
                    {customStatus?.state && (
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px", fontStyle: "italic" }}>
                            "{customStatus.state}"
                        </div>
                    )}
                </div>
            </div>

            {/* ── Current activity ── */}
            {(gamingActivity || spotifyActivity || streamingActivity || voiceState) && (
                <div style={s.card}>
                    <div style={s.subheading}>Right Now</div>
                    {gamingActivity && (
                        <ActivityRow
                            label="Playing"
                            color="#7289da"
                            title={gamingActivity.name}
                            subtitle={[gamingActivity.details, gamingActivity.state].filter(Boolean).join(" — ")}
                        />
                    )}
                    {spotifyActivity && (
                        <ActivityRow
                            label="Spotify"
                            color="#1db954"
                            title={spotifyActivity.details || "Spotify"}
                            subtitle={spotifyActivity.state ? `by ${spotifyActivity.state}` : undefined}
                        />
                    )}
                    {streamingActivity && (
                        <ActivityRow
                            label="Streaming"
                            color="#6441a5"
                            title={streamingActivity.name}
                            subtitle={streamingActivity.details}
                        />
                    )}
                    {voiceState && (
                        <ActivityRow
                            label="Voice"
                            color="#43b581"
                            title="In a voice channel"
                            subtitle={[
                                voiceState.streaming && "Streaming",
                                voiceState.selfMute && "Muted",
                                voiceState.selfDeaf && "Deafened",
                            ].filter(Boolean).join(" · ") || undefined}
                        />
                    )}
                </div>
            )}

            {/* ── Today's stats ── */}
            {todaySummary && (
                <div style={s.card}>
                    <div style={s.subheading}>Today ({todaySummary.date})</div>
                    <div style={s.grid4}>
                        {[
                            { value: `${todaySummary.online_minutes}m`, label: "Online", color: "#43b581" },
                            { value: todaySummary.message_count, label: "Messages", color: "#faa61a" },
                            { value: `${todaySummary.voice_minutes}m`, label: "Voice", color: "#5865f2" },
                            { value: todaySummary.ghost_type_count, label: "Ghosts", color: "#9b84ec" },
                            { value: todaySummary.delete_count, label: "Deleted", color: "#f04747" },
                            { value: todaySummary.edit_count, label: "Edited", color: "#f47b67" },
                            { value: todaySummary.reaction_count, label: "Reactions", color: "#faa61a" },
                            {
                                value: todaySummary.first_seen
                                    ? new Date(todaySummary.first_seen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                    : "—",
                                label: "First Seen",
                                color: "var(--text-normal)",
                            },
                        ].map(({ value, label, color }, i) => (
                            <div key={i} style={s.statCard}>
                                <div style={{ ...s.statValue, color, fontSize: "16px" }}>{value}</div>
                                <div style={s.statLabel}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Active anomalies ── */}
            {recentAnomalies.length > 0 && (
                <div style={{ ...s.card, borderLeft: "3px solid #f04747" }}>
                    <div style={{ ...s.subheading, color: "#f04747" }}>⚠ Active Anomalies</div>
                    {recentAnomalies.map((a: any, i: number) => {
                        const severityColor = a.severity === "high" ? "#f04747" : a.severity === "medium" ? "#f47b67" : "#faa61a";
                        return (
                            <div key={i} style={{ ...s.eventItem, borderLeftColor: severityColor, marginBottom: "4px" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        <span style={s.badge(severityColor)}>{a.severity}</span>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{a.type}</span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--text-normal)", marginTop: "2px" }}>
                                        {a.description}
                                    </div>
                                </div>
                                <span style={s.timestamp}>{formatRelative(a.timestamp)}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Recent events ── */}
            {recentEvents.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Recent Activity</div>
                    <div style={{ maxHeight: "220px", overflowY: "auto" as const }}>
                        {recentEvents.slice(0, 15).map((event: any, i: number) => {
                            const color = EVENT_COLORS[event.event_type] || "#99aab5";
                            const label = EVENT_LABELS[event.event_type] || event.event_type;
                            let detail = "";
                            try {
                                const d = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                                if (d.newStatus) detail = `${d.oldStatus || "?"} → ${d.newStatus}`;
                                else if (d.name) detail = d.name;
                                else if (d.changes) detail = Array.isArray(d.changes) ? d.changes.slice(0, 2).join(", ") : String(d.changes);
                                else if (d.song) detail = `${d.song} — ${d.artist}`;
                            } catch { }
                            return (
                                <div key={i} style={{ ...s.eventItem, borderLeftColor: color, marginBottom: "3px" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" as const }}>
                                            <span style={s.badge(color)}>{label}</span>
                                            {detail && (
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{detail}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span style={s.timestamp}>{formatRelative(event.timestamp)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Target notes ── */}
            {target?.notes && (
                <div style={{ ...s.card, borderLeft: "3px solid #5865f2" }}>
                    <div style={s.subheading}>Notes</div>
                    <div style={{ fontSize: "13px", color: "var(--text-normal)", whiteSpace: "pre-wrap" as const }}>
                        {target.notes}
                    </div>
                </div>
            )}
        </div>
    );
}
