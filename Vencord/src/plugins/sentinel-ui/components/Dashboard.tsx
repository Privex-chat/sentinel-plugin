import { React } from "@webpack/common";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { TargetCard } from "./TargetCard";
import { LoadingSpinner } from "./common/LoadingSpinner";
import { ErrorDisplay } from "./common/ErrorBoundary";
import { EmptyState } from "./common/EmptyState";
import { s, EVENT_COLORS, EVENT_LABELS } from "../styles";
import { settings } from "../index";

interface DashboardProps {
    onSelectTarget: (userId: string) => void;
    connected: boolean;
    recentEvents: any[];
    cacheVersion: number;
    opsecMode?: boolean;
}

export function Dashboard({ onSelectTarget, connected, recentEvents, cacheVersion, opsecMode = false }: DashboardProps) {
    const { data: targets, loading: targetsLoading, error: targetsError, refetch: refetchTargets } = useApi(
        () => api.getTargets(),
        [cacheVersion]
    );
    const { data: status } = useApi(() => api.getStatus(), []);

    // Per-target live statuses
    const [targetStatuses, setTargetStatuses] = React.useState<Record<string, any>>({});

    React.useEffect(() => {
        if (!targets) return;
        const fetchStatuses = async () => {
            const statuses: Record<string, any> = {};
            for (const target of targets) {
                try {
                    statuses[target.user_id] = await api.getTargetStatus(target.user_id);
                } catch { }
            }
            setTargetStatuses(statuses);
        };
        fetchStatuses();
        const interval = setInterval(fetchStatuses, (settings.store.dashboardRefreshInterval || 30) * 1000);
        return () => clearInterval(interval);
    }, [targets]);

    // Re-fetch statuses when SSE events arrive
    React.useEffect(() => {
        if (!targets?.length) return;
        const fetchStatuses = async () => {
            const statuses: Record<string, any> = {};
            for (const target of targets) {
                try {
                    statuses[target.user_id] = await api.getTargetStatus(target.user_id);
                } catch { }
            }
            setTargetStatuses(statuses);
        };
        fetchStatuses();
    }, [cacheVersion]);

    // Add-target input state
    const [addUserId, setAddUserId] = React.useState("");
    const [addLabel, setAddLabel] = React.useState("");
    const [addError, setAddError] = React.useState<string | null>(null);
    const [addLoading, setAddLoading] = React.useState(false);
    const [showAddForm, setShowAddForm] = React.useState(false);

    const handleAddTarget = async () => {
        const uid = addUserId.trim();
        if (!/^\d{17,20}$/.test(uid)) {
            setAddError("Invalid Discord user ID (must be 17-20 digits)");
            return;
        }
        setAddLoading(true);
        setAddError(null);
        try {
            await api.addTarget(uid, addLabel.trim() || undefined);
            setAddUserId("");
            setAddLabel("");
            setShowAddForm(false);
            api.clearCache();
            refetchTargets();
        } catch (e: any) {
            setAddError(e.message || "Failed to add target");
        } finally {
            setAddLoading(false);
        }
    };

    const handleRemoveTarget = async (userId: string) => {
        try {
            await api.removeTarget(userId);
            api.clearCache();
            refetchTargets();
        } catch { }
    };

    if (targetsLoading) return <LoadingSpinner />;
    if (targetsError) return <ErrorDisplay error={targetsError} onRetry={refetchTargets} />;

    return (
        <div>
            {/* ── Status bar ── */}
            <div style={s.topBar}>
                <div style={s.row}>
                    <span style={s.statusDot(connected ? "#43b581" : "#f04747")} />
                    <span style={{ fontSize: "13px", color: "var(--text-normal)" }}>
                        {connected
                            ? (opsecMode ? "Live" : "Live - Connected to Sentinel")
                            : "Disconnected"
                        }
                    </span>
                </div>
                {status && (
                    <div style={{ ...s.row, gap: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
                        <span>{status.activeTargets} active targets</span>
                        <span>{status.eventCount?.toLocaleString()} events</span>
                        <span>{status.uptimeFormatted} uptime</span>
                        <span>{status.dbSizeMB} MB</span>
                    </div>
                )}
            </div>

            {/* ── Targets header ── */}
            <div style={{ ...s.row, marginBottom: "8px", justifyContent: "space-between" }}>
                <div style={s.subheading}>Targets ({targets?.length || 0})</div>
                <span
                    style={{
                        ...s.linkButton,
                        padding: "4px 10px",
                        backgroundColor: showAddForm ? "var(--background-modifier-accent)" : "var(--brand-experiment)",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "12px",
                    }}
                    onClick={() => { setShowAddForm(v => !v); setAddError(null); }}
                >
                    {showAddForm ? "Cancel" : "+ Add Target"}
                </span>
            </div>

            {/* ── Add-target form ── */}
            {showAddForm && (
                <div style={{ ...s.card, marginBottom: "12px", borderLeft: "3px solid var(--brand-experiment)" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--header-secondary)" }}>
                        ADD TARGET BY USER ID
                    </div>
                    <div style={{ ...s.row, gap: "8px", marginBottom: "6px", flexWrap: "wrap" as const }}>
                        <input
                            type="text"
                            placeholder="Discord User ID (17-20 digits)"
                            value={addUserId}
                            onChange={(e: any) => { setAddUserId(e.target.value); setAddError(null); }}
                            style={{
                                flex: 2,
                                minWidth: "180px",
                                padding: "7px 10px",
                                backgroundColor: "var(--background-secondary)",
                                border: `1px solid ${addError ? "#f04747" : "var(--background-modifier-accent)"}`,
                                borderRadius: "4px",
                                color: "var(--text-normal)",
                                fontSize: "13px",
                                outline: "none",
                            }}
                            onKeyDown={(e: any) => e.key === "Enter" && handleAddTarget()}
                        />
                        <input
                            type="text"
                            placeholder="Label (optional)"
                            value={addLabel}
                            onChange={(e: any) => setAddLabel(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: "120px",
                                padding: "7px 10px",
                                backgroundColor: "var(--background-secondary)",
                                border: "1px solid var(--background-modifier-accent)",
                                borderRadius: "4px",
                                color: "var(--text-normal)",
                                fontSize: "13px",
                                outline: "none",
                            }}
                        />
                        <span
                            style={{
                                ...s.linkButton,
                                padding: "7px 14px",
                                backgroundColor: addLoading ? "var(--background-modifier-accent)" : "var(--brand-experiment)",
                                color: "white",
                                borderRadius: "4px",
                                opacity: addLoading ? 0.6 : 1,
                                cursor: addLoading ? "default" : "pointer",
                                fontSize: "13px",
                            }}
                            onClick={addLoading ? undefined : handleAddTarget}
                        >
                            {addLoading ? "Adding..." : "Track"}
                        </span>
                    </div>
                    {addError && (
                        <div style={{ fontSize: "12px", color: "#f04747" }}>{addError}</div>
                    )}
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Tip: you can also right-click any user in Discord and select "Track with Sentinel"
                    </div>
                </div>
            )}

            {/* ── Target grid ── */}
            {(!targets || targets.length === 0) ? (
                <EmptyState message='No targets tracked. Click "+ Add Target" above or right-click a user in Discord.' />
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "8px",
                    marginBottom: "16px",
                }}>
                    {targets.map((target: any) => (
                        <TargetCard
                            key={target.user_id}
                            target={target}
                            status={targetStatuses[target.user_id]}
                            onClick={() => onSelectTarget(target.user_id)}
                            onRemove={() => handleRemoveTarget(target.user_id)}
                        />
                    ))}
                </div>
            )}

            {/* ── Live event feed ── */}
            {recentEvents.length > 0 && (
                <>
                    <div style={s.subheading}>Live Feed</div>
                    <div style={s.scrollArea}>
                        {recentEvents.slice(0, 30).map((event: any, i: number) => {
                            const color = EVENT_COLORS[event.event_type] || "#99aab5";
                            const label = EVENT_LABELS[event.event_type] || event.event_type;
                            let detail = "";
                            try {
                                const d = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                                if (d.newStatus) detail = `${d.oldStatus || "?"} -> ${d.newStatus}`;
                                else if (d.name) detail = d.name;
                                else if (d.messageId) detail = `msg ${d.messageId?.slice(-6)}`;
                                else if (d.song) detail = `${d.song} - ${d.artist}`;
                            } catch { }

                            return (
                                <div
                                    key={i}
                                    style={{ ...s.eventItem, borderLeftColor: color, cursor: "pointer" }}
                                    onClick={() => onSelectTarget(event.target_id)}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 500 }}>
                                                {event.target_id?.slice(-6)}
                                            </span>
                                            <span style={s.badge(color)}>{label}</span>
                                        </div>
                                        {detail && (
                                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                {detail}
                                            </div>
                                        )}
                                    </div>
                                    <span style={s.timestamp}>
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
