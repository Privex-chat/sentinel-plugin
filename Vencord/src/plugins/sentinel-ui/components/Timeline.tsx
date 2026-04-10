import { React } from "@webpack/common";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { TimelineBar } from "./charts/TimelineBar";
import { LoadingSpinner } from "./common/LoadingSpinner";
import { ErrorDisplay } from "./common/ErrorBoundary";
import { EmptyState } from "./common/EmptyState";
import { s, EVENT_COLORS, EVENT_LABELS, STATUS_COLORS } from "../styles";

interface TimelineProps {
    userId: string;
}

function parseEventData(data: string): any {
    try { return JSON.parse(data); } catch { return {}; }
}

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDuration(ms: number): string {
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
}

export function Timeline({ userId }: TimelineProps) {
    const [offset, setOffset] = React.useState(0);
    const [typeFilter, setTypeFilter] = React.useState("");
    const limit = 100;

    const { data, loading, error, refetch } = useApi(
        () => api.getTimeline(userId, { limit: String(limit), offset: String(offset), ...(typeFilter ? { type: typeFilter } : {}) }),
        [userId, offset, typeFilter]
    );

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (!data) return <EmptyState message="No timeline data" />;

    const { events, presenceSessions, activitySessions, voiceSessions } = data;

    // Build Gantt bars for today
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayEnd = todayStart + 86400000;

    const ganttSessions: any[] = [];

    for (const ps of presenceSessions || []) {
        if (ps.start_time < todayEnd && (ps.end_time || now) > todayStart) {
            ganttSessions.push({
                type: "Status",
                label: `${ps.status} (${ps.platform || "?"})`,
                start: Math.max(ps.start_time, todayStart),
                end: Math.min(ps.end_time || now, todayEnd),
                color: STATUS_COLORS[ps.status] || "#747f8d",
            });
        }
    }

    for (const as of activitySessions || []) {
        if (as.start_time < todayEnd && (as.end_time || now) > todayStart) {
            ganttSessions.push({
                type: "Activity",
                label: `${as.activity_name}${as.details ? " - " + as.details : ""}`,
                start: Math.max(as.start_time, todayStart),
                end: Math.min(as.end_time || now, todayEnd),
                color: as.activity_type === 2 ? "#1db954" : "#7289da",
            });
        }
    }

    for (const vs of voiceSessions || []) {
        if (vs.start_time < todayEnd && (vs.end_time || now) > todayStart) {
            ganttSessions.push({
                type: "Voice",
                label: vs.channel_name || vs.channel_id,
                start: Math.max(vs.start_time, todayStart),
                end: Math.min(vs.end_time || now, todayEnd),
                color: "#43b581",
            });
        }
    }

    const eventTypes = [...new Set((events || []).map((e: any) => e.event_type))].sort();

    return (
        <div>
            {/* Gantt visualization */}
            {ganttSessions.length > 0 && (
                <div style={{ ...s.card, marginBottom: "12px" }}>
                    <div style={s.subheading}>Today's Timeline</div>
                    <TimelineBar
                        sessions={ganttSessions}
                        dayStart={todayStart}
                        dayEnd={todayEnd}
                    />
                </div>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <select
                    value={typeFilter}
                    onChange={(e: any) => { setTypeFilter(e.target.value); setOffset(0); }}
                    style={{
                        backgroundColor: "var(--background-tertiary)",
                        color: "var(--text-normal)",
                        border: "1px solid var(--background-modifier-accent)",
                        borderRadius: "4px", padding: "6px 8px", fontSize: "12px",
                    }}
                >
                    <option value="">All Events</option>
                    {eventTypes.map(t => (
                        <option key={t} value={t}>{EVENT_LABELS[t] || t}</option>
                    ))}
                </select>
                <span style={{ ...s.muted, alignSelf: "center" }}>
                    {events?.length || 0} events
                </span>
            </div>

            {/* Event list */}
            <div style={s.scrollArea}>
                {(!events || events.length === 0) ? (
                    <EmptyState message="No events found" />
                ) : events.map((event: any) => {
                    const color = EVENT_COLORS[event.event_type] || "#99aab5";
                    const label = EVENT_LABELS[event.event_type] || event.event_type;
                    const d = parseEventData(event.data);

                    let detail = "";
                    if (d.newStatus) detail = `${d.oldStatus || "?"} -> ${d.newStatus}`;
                    else if (d.name) detail = d.name;
                    else if (d.changes) detail = Array.isArray(d.changes) ? d.changes.join(", ") : String(d.changes);
                    else if (d.channelId) detail = `ch:${d.channelId?.slice(-6)}`;

                    return (
                        <div key={event.id} style={{ ...s.eventItem, borderLeftColor: color }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                                    <span style={s.badge(color)}>{label}</span>
                                    {event.guild_id && (
                                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                            g:{event.guild_id.slice(-5)}
                                        </span>
                                    )}
                                </div>
                                {detail && (
                                    <div style={{ fontSize: "12px", color: "var(--text-normal)", marginTop: "3px" }}>
                                        {detail}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={s.timestamp}>{formatTime(event.timestamp)}</div>
                                <div style={{ ...s.timestamp, fontSize: "10px" }}>{formatDate(event.timestamp)}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {events && events.length >= limit && (
                <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
                    {offset > 0 && (
                        <span style={s.linkButton} onClick={() => setOffset(Math.max(0, offset - limit))}>
                            Previous
                        </span>
                    )}
                    <span style={s.linkButton} onClick={() => setOffset(offset + limit)}>
                        Next
                    </span>
                </div>
            )}
        </div>
    );
}
