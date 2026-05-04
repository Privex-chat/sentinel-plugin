import { React } from "@webpack/common";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { PieChart } from "./charts/PieChart";
import { BarChart } from "./charts/BarChart";
import { LineChart } from "./charts/LineChart";
import { Heatmap } from "./charts/Heatmap";
import { LoadingSpinner } from "./common/LoadingSpinner";
import { ErrorDisplay } from "./common/ErrorBoundary";
import { EmptyState } from "./common/EmptyState";
import { s, STATUS_COLORS } from "../styles";
import type { AnalyticsSubTab } from "../types";

interface AnalyticsProps {
    userId: string;
    refreshTrigger?: number;
}

function formatMs(ms: number): string {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function StatBox({ value, label, color }: { value: string | number; label: string; color?: string }) {
    return (
        <div style={s.statCard}>
            <div style={{ ...s.statValue, color: color || "var(--text-normal)", fontSize: "20px" }}>{value}</div>
            <div style={s.statLabel}>{label}</div>
        </div>
    );
}

export function Analytics({ userId, refreshTrigger = 0 }: AnalyticsProps) {
    const [subTab, setSubTab] = React.useState<AnalyticsSubTab>("presence");

    const tabs: { id: AnalyticsSubTab; label: string }[] = [
        { id: "presence", label: "Presence" },
        { id: "activities", label: "Gaming" },
        { id: "messages", label: "Messages" },
        { id: "voice", label: "Voice" },
        { id: "music", label: "Music" },
        { id: "social", label: "Social" },
    ];

    return (
        <div>
            <div style={s.tabBar}>
                {tabs.map(t => (
                    <div key={t.id} style={s.tab(subTab === t.id)} onClick={() => setSubTab(t.id)}>
                        {t.label}
                    </div>
                ))}
            </div>
            {subTab === "presence" && <PresenceTab userId={userId} refreshTrigger={refreshTrigger} />}
            {subTab === "activities" && <ActivitiesTab userId={userId} refreshTrigger={refreshTrigger} />}
            {subTab === "messages" && <MessagesTab userId={userId} refreshTrigger={refreshTrigger} />}
            {subTab === "voice" && <VoiceTab userId={userId} refreshTrigger={refreshTrigger} />}
            {subTab === "music" && <MusicTab userId={userId} refreshTrigger={refreshTrigger} />}
            {subTab === "social" && <SocialTab userId={userId} refreshTrigger={refreshTrigger} />}
        </div>
    );
}

function PresenceTab({ userId, refreshTrigger }: { userId: string; refreshTrigger: number }) {
    const { data, loading, error } = useApi(
        () => api.getPresenceAnalytics(userId),
        [userId, refreshTrigger]
    );
    const { data: daily } = useApi(
        () => api.getDailySummaries(userId, 30),
        [userId, refreshTrigger]
    );

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data) return <EmptyState message="No presence data" />;

    const sessions = (data.sessions || []) as any[];
    const pieData = sessions.map((s: any) => ({
        label: s.status,
        value: s.total_ms || 0,
        color: STATUS_COLORS[s.status] || "#747f8d",
    })).filter((d: any) => d.value > 0);

    const platforms = (data.platformBreakdown || []) as any[];
    const platformData = platforms.map((p: any) => ({
        label: p.platform || "Unknown",
        value: p.total_ms || 0,
        color: p.platform === "desktop" ? "#5865f2" : p.platform === "mobile" ? "#43b581" : "#faa61a",
    }));

    const dailyOnline = (daily || []).slice().reverse().map((d: any) => ({
        label: d.date?.slice(5) || "",
        value: d.online_minutes || 0,
    }));

    return (
        <div style={s.col}>
            <div style={s.grid2}>
                <div style={s.card}>
                    <div style={s.subheading}>Time Distribution</div>
                    {pieData.length > 0 ? <PieChart data={pieData} /> : <EmptyState message="No data" />}
                </div>
                <div style={s.card}>
                    <div style={s.subheading}>Platform Usage</div>
                    {platformData.length > 0 ? <PieChart data={platformData} size={100} /> : <EmptyState message="No data" />}
                </div>
            </div>
            <div style={s.card}>
                <div style={s.subheading}>Daily Online Minutes (Last 30 Days)</div>
                {dailyOnline.length > 0
                    ? <LineChart data={dailyOnline} color="#43b581" />
                    : <EmptyState message="No daily data" />}
            </div>
        </div>
    );
}

function ActivitiesTab({ userId, refreshTrigger }: { userId: string; refreshTrigger: number }) {
    const { data, loading, error } = useApi(
        () => api.getActivityAnalytics(userId),
        [userId, refreshTrigger]
    );

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data) return <EmptyState message="No gaming data" />;

    const games = (data.games || []).slice(0, 15);
    const barData = games.map((g: any) => ({
        label: g.name,
        value: g.totalPlaytimeMs,
        color: "#7289da",
    }));

    return (
        <div style={s.col}>
            <div style={s.grid3}>
                <StatBox value={formatMs(data.totalGamingMs || 0)} label="Total Gaming" color="#7289da" />
                <StatBox value={games.length} label="Games Played" />
                <StatBox value={`${data.peakGamingHour ?? "-"}:00`} label="Peak Hour" />
            </div>
            <div style={s.card}>
                <div style={s.subheading}>Top Games by Playtime</div>
                {barData.length > 0
                    ? <BarChart data={barData} formatValue={(v) => formatMs(v)} />
                    : <EmptyState message="No games played" />}
            </div>
            {data.recentlyStarted?.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Recently Started</div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px" }}>
                        {data.recentlyStarted.map((g: string, i: number) => (
                            <div key={i} style={s.badge("#43b581")}>{g}</div>
                        ))}
                    </div>
                </div>
            )}
            {data.abandoned?.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Abandoned</div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px" }}>
                        {data.abandoned.slice(0, 8).map((g: string, i: number) => (
                            <div key={i} style={s.badge("#747f8d")}>{g}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MessagesTab({ userId, refreshTrigger }: { userId: string; refreshTrigger: number }) {
    const { data, loading, error } = useApi(
        () => api.getMessageAnalytics(userId),
        [userId, refreshTrigger]
    );
    const { data: heatmapData } = useApi(
        () => api.getHeatmap(userId),
        [userId, refreshTrigger]
    );

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data) return <EmptyState message="No message data" />;

    const byHour = data.messagesByHour || new Array(24).fill(0);
    const hourData = byHour.map((v: number, i: number) => ({
        label: `${i}`,
        value: v,
    }));

    return (
        <div style={s.col}>
            <div style={s.grid4}>
                <StatBox value={data.totalMessages || 0} label="Messages" color="#faa61a" />
                <StatBox value={data.avgWordCount?.toFixed(1) || 0} label="Avg Words" />
                <StatBox value={`${((data.editRate || 0) * 100).toFixed(1)}%`} label="Edit Rate" />
                <StatBox value={`${((data.deleteRate || 0) * 100).toFixed(1)}%`} label="Delete Rate" />
                <StatBox value={`${((data.ghostTypeRate || 0) * 100).toFixed(1)}%`} label="Ghost Rate" color="#9b84ec" />
                <StatBox value={`${((data.replyRate || 0) * 100).toFixed(1)}%`} label="Reply Rate" />
                <StatBox value={data.avgMessageLength || 0} label="Avg Length" />
                <StatBox value={(data.vocabularyRichness || 0).toFixed(3)} label="Vocab Richness" />
            </div>
            <div style={s.card}>
                <div style={s.subheading}>Messages by Hour</div>
                <LineChart data={hourData} color="#faa61a" height={120} />
            </div>
            {heatmapData?.weeklyGrid && (
                <div style={s.card}>
                    <div style={s.subheading}>Activity Heatmap</div>
                    <Heatmap data={heatmapData.weeklyGrid.map((row: any[]) => row.map((b: any) => b.eventCount))} />
                </div>
            )}
        </div>
    );
}

function VoiceTab({ userId, refreshTrigger }: { userId: string; refreshTrigger: number }) {
    const { data, loading, error } = useApi(
        () => api.getVoiceAnalytics(userId),
        [userId, refreshTrigger]
    );

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data) return <EmptyState message="No voice data" />;

    const channelData = (data.preferredChannels || []).slice(0, 10).map((c: any) => ({
        label: c.channelId.slice(-8),
        value: c.totalMs,
        color: "#43b581",
    }));

    return (
        <div style={s.col}>
            <div style={s.grid4}>
                <StatBox value={formatMs(data.totalVoiceMs || 0)} label="Total Voice" color="#43b581" />
                <StatBox value={data.sessionCount || 0} label="Sessions" />
                <StatBox value={formatMs(data.avgSessionMs || 0)} label="Avg Session" />
                <StatBox value={`${((data.muteRatio || 0) * 100).toFixed(0)}%`} label="Muted" />
            </div>
            {channelData.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Top Channels</div>
                    <BarChart data={channelData} formatValue={v => formatMs(v)} />
                </div>
            )}
            {data.topPartners?.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Top Voice Partners</div>
                    <BarChart
                        data={data.topPartners.slice(0, 10).map((p: any) => ({
                            label: p.userId.slice(-8),
                            value: p.sharedMs,
                            color: "#5865f2",
                        }))}
                        formatValue={v => formatMs(v)}
                    />
                </div>
            )}
        </div>
    );
}

function MusicTab({ userId, refreshTrigger }: { userId: string; refreshTrigger: number }) {
    // refreshTrigger is in deps so that when an SSE event clears the cache
    // (Spotify start/stop), this component automatically re-fetches fresh data.
    const { data, loading, error } = useApi(
        () => api.getMusicAnalytics(userId),
        [userId, refreshTrigger]
    );

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data) return <EmptyState message="No music data" />;

    return (
        <div style={s.col}>
            <div style={s.grid3}>
                <StatBox value={formatMs(data.totalListeningMs || 0)} label="Listen Time" color="#1db954" />
                <StatBox value={data.sessionCount || 0} label="Sessions" />
                <StatBox value={data.topArtists?.[0]?.name || "-"} label="Top Artist" />
            </div>

            {data.recentTrack && (
                <div style={{ ...s.card, borderLeft: "3px solid #1db954" }}>
                    <div style={{ fontSize: "11px", color: "#1db954", marginBottom: "4px", fontWeight: 600 }}>
                        LAST PLAYED
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--text-normal)", fontSize: "14px" }}>
                        {data.recentTrack.song}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        by {data.recentTrack.artist}
                        {data.recentTrack.album ? ` - ${data.recentTrack.album}` : ""}
                    </div>
                </div>
            )}

            {data.topArtists?.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Top Artists</div>
                    <BarChart
                        data={data.topArtists.slice(0, 10).map((a: any) => ({
                            label: a.name,
                            value: a.listens,
                            color: "#1db954",
                        }))}
                    />
                </div>
            )}

            {data.topSongs?.length > 0 && (
                <div style={s.card}>
                    <div style={s.subheading}>Top Songs</div>
                    <BarChart
                        data={data.topSongs.slice(0, 10).map((s: any) => ({
                            label: `${s.name} - ${s.artist}`,
                            value: s.listens,
                            color: "#1db954",
                        }))}
                    />
                </div>
            )}
        </div>
    );
}

function SocialTab({ userId, refreshTrigger }: { userId: string; refreshTrigger: number }) {
    const { data, loading, error } = useApi(
        () => api.getSocialGraph(userId),
        [userId, refreshTrigger]
    );

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data || !data.connections?.length) return <EmptyState message="No social data yet" />;

    const connections = data.connections.slice(0, 20);
    const maxScore = connections[0]?.score || 1;

    return (
        <div style={s.col}>
            <StatBox value={data.connections.length} label="Connections Found" color="#5865f2" />
            <div style={s.card}>
                <div style={s.subheading}>Social Graph</div>
                <svg width="100%" height="250" viewBox="0 0 400 250">
                    <circle cx="200" cy="125" r="20" fill="var(--brand-experiment)" />
                    <text x="200" y="130" textAnchor="middle" fill="white" fontSize="10">Target</text>
                    {connections.slice(0, 12).map((conn: any, i: number) => {
                        const angle = (i / Math.min(connections.length, 12)) * Math.PI * 2 - Math.PI / 2;
                        const radius = 70 + (1 - conn.score / maxScore) * 40;
                        const x = 200 + Math.cos(angle) * radius;
                        const y = 125 + Math.sin(angle) * radius;
                        const thickness = Math.max(1, (conn.score / maxScore) * 4);
                        return (
                            <g key={i}>
                                <line x1="200" y1="125" x2={x} y2={y}
                                    stroke="var(--brand-experiment)" strokeWidth={thickness} opacity="0.4" />
                                <circle cx={x} cy={y} r={8 + (conn.score / maxScore) * 6}
                                    fill="var(--background-tertiary)" stroke="var(--brand-experiment)" strokeWidth="1.5" />
                                <text x={x} y={y + 3} textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                                    {conn.userId.slice(-4)}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
            <div style={s.card}>
                <div style={s.subheading}>Top Connections</div>
                {connections.map((conn: any, i: number) => (
                    <div key={i} style={{ ...s.eventItem, borderLeftColor: "#5865f2" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: "13px" }}>{conn.userId}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{conn.relationship}</div>
                        </div>
                        <div style={{ textAlign: "right" as const, fontSize: "11px" }}>
                            <div>Score: {conn.score}</div>
                            <div style={{ color: "var(--text-muted)" }}>
                                {conn.messageInteractions}msg {conn.reactionInteractions}react{" "}
                                {conn.voiceTime > 0 ? formatMs(conn.voiceTime) + "vc" : ""}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
