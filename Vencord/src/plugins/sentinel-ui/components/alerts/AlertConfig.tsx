import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay } from "../common/ErrorBoundary";
import { EmptyState } from "../common/EmptyState";
import { s } from "../../styles";

const ALERT_TYPES = [
    "COMES_ONLINE", "GOES_OFFLINE", "STARTS_ACTIVITY", "STOPS_ACTIVITY",
    "JOINS_VOICE", "LEAVES_VOICE", "SENDS_MESSAGE", "DELETES_MESSAGE",
    "GHOST_TYPES", "STATUS_CHANGE", "PROFILE_CHANGE", "UNUSUAL_HOUR",
    "NEW_GAME", "KEYWORD_MENTION",
];

export function AlertConfig({ userId }: { userId?: string }) {
    const { data: rules, loading, error, refetch } = useApi(() => api.getAlertRules(), []);
    const { data: history, refetch: refetchHistory } = useApi(() => api.getAlertHistory({ limit: "50" }), []);
    const [newType, setNewType] = React.useState("COMES_ONLINE");
    const [tab, setTab] = React.useState<"rules" | "history">("rules");

    const handleCreate = async () => {
        await api.createAlertRule({ targetId: userId, ruleType: newType });
        refetch();
    };

    const handleDelete = async (id: number) => {
        await api.deleteAlertRule(id);
        refetch();
    };

    const handleAck = async (id: number) => {
        await api.acknowledgeAlert(id);
        refetchHistory();
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;

    const filteredRules = userId ? (rules || []).filter((r: any) => !r.target_id || r.target_id === userId) : (rules || []);
    const filteredHistory = userId ? (history || []).filter((h: any) => h.target_id === userId) : (history || []);

    return (
        <div>
            <div style={s.tabBar}>
                <div style={s.tab(tab === "rules")} onClick={() => setTab("rules")}>Rules</div>
                <div style={s.tab(tab === "history")} onClick={() => setTab("history")}>History</div>
            </div>

            {tab === "rules" && (
                <div>
                    {/* Create new rule */}
                    <div style={{ ...s.card, display: "flex", gap: "8px", alignItems: "center" }}>
                        <select
                            value={newType}
                            onChange={(e: any) => setNewType(e.target.value)}
                            style={{
                                flex: 1, padding: "6px 8px",
                                backgroundColor: "var(--background-tertiary)",
                                color: "var(--text-normal)",
                                border: "1px solid var(--background-modifier-accent)",
                                borderRadius: "4px", fontSize: "12px",
                            }}
                        >
                            {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span style={{ ...s.linkButton, padding: "6px 12px", backgroundColor: "var(--brand-experiment)", color: "white", borderRadius: "4px" }} onClick={handleCreate}>
                            Add Rule
                        </span>
                    </div>

                    {filteredRules.length === 0 ? (
                        <EmptyState message="No alert rules configured" />
                    ) : filteredRules.map((rule: any) => (
                        <div key={rule.id} style={{ ...s.eventItem, borderLeftColor: "#ff6b6b" }}>
                            <div style={{ flex: 1 }}>
                                <span style={s.badge("#ff6b6b")}>{rule.rule_type}</span>
                                {rule.target_id && (
                                    <span style={{ ...s.muted, marginLeft: "6px" }}>Target: {rule.target_id.slice(-6)}</span>
                                )}
                            </div>
                            <span style={{ ...s.linkButton, color: "#f04747" }} onClick={() => handleDelete(rule.id)}>
                                Delete
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {tab === "history" && (
                <div>
                    {filteredHistory.length === 0 ? (
                        <EmptyState message="No alerts fired yet" />
                    ) : filteredHistory.map((alert: any) => (
                        <div key={alert.id} style={{
                            ...s.eventItem,
                            borderLeftColor: alert.acknowledged ? "#43b581" : "#ff6b6b",
                            opacity: alert.acknowledged ? 0.6 : 1,
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "12px", color: "var(--text-normal)" }}>{alert.message}</div>
                                <div style={{ ...s.muted, marginTop: "2px" }}>
                                    {new Date(alert.timestamp).toLocaleString()}
                                </div>
                            </div>
                            {!alert.acknowledged && (
                                <span style={s.linkButton} onClick={() => handleAck(alert.id)}>Ack</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
