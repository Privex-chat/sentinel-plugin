import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay } from "../common/ErrorBoundary";
import { EmptyState } from "../common/EmptyState";
import { s } from "../../styles";

interface MessageLogProps {
    userId: string;
}

type MsgTab = "all" | "deleted" | "edited" | "ghosts";

export function MessageLog({ userId }: MessageLogProps) {
    const [tab, setTab] = React.useState<MsgTab>("all");
    const [search, setSearch] = React.useState("");

    const tabs: { id: MsgTab; label: string }[] = [
        { id: "all", label: "All" },
        { id: "deleted", label: "Deleted" },
        { id: "edited", label: "Edited" },
        { id: "ghosts", label: "Ghost Typed" },
    ];

    return (
        <div>
            <div style={s.tabBar}>
                {tabs.map(t => (
                    <div key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</div>
                ))}
            </div>

            {tab !== "ghosts" && (
                <input
                    type="text"
                    placeholder="Search messages..."
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    style={{
                        width: "100%", padding: "8px 12px", marginBottom: "12px",
                        backgroundColor: "var(--background-tertiary)",
                        border: "1px solid var(--background-modifier-accent)",
                        borderRadius: "4px", color: "var(--text-normal)", fontSize: "13px",
                        outline: "none",
                    }}
                />
            )}

            {tab === "all" && <AllMessages userId={userId} search={search} />}
            {tab === "deleted" && <DeletedMessages userId={userId} />}
            {tab === "edited" && <EditedMessages userId={userId} />}
            {tab === "ghosts" && <GhostTyping userId={userId} />}
        </div>
    );
}

function AllMessages({ userId, search }: { userId: string; search: string }) {
    const params = search ? { search, limit: "100" } : { limit: "100" };
    const { data, loading, error, refetch } = useApi(
        () => api.getMessages(userId, params),
        [userId, search]
    );

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (!data || data.length === 0) return <EmptyState message="No messages found" />;

    return (
        <div style={s.scrollArea}>
            {data.map((msg: any) => (
                <MessageItem key={msg.message_id} msg={msg} />
            ))}
        </div>
    );
}

function DeletedMessages({ userId }: { userId: string }) {
    const { data, loading, error } = useApi(() => api.getDeletedMessages(userId), [userId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data || data.length === 0) return <EmptyState message="No deleted messages found" />;

    return (
        <div style={s.scrollArea}>
            {data.map((msg: any) => (
                <MessageItem key={msg.message_id} msg={msg} deleted />
            ))}
        </div>
    );
}

function EditedMessages({ userId }: { userId: string }) {
    const { data, loading, error } = useApi(() => api.getEditedMessages(userId), [userId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data || data.length === 0) return <EmptyState message="No edited messages found" />;

    return (
        <div style={s.scrollArea}>
            {data.map((msg: any) => (
                <MessageItem key={msg.message_id} msg={msg} showEditHistory />
            ))}
        </div>
    );
}

function GhostTyping({ userId }: { userId: string }) {
    const { data, loading, error } = useApi(() => api.getTypingAnalytics(userId), [userId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data) return <EmptyState message="No typing data" />;

    return (
        <div style={s.card}>
            <div style={s.grid3}>
                <div style={s.statCard}>
                    <div style={{ ...s.statValue, color: "#9b84ec" }}>{data.total || 0}</div>
                    <div style={s.statLabel}>Total Typing</div>
                </div>
                <div style={s.statCard}>
                    <div style={{ ...s.statValue, color: "#f04747" }}>{data.ghosts || 0}</div>
                    <div style={s.statLabel}>Ghosts</div>
                </div>
                <div style={s.statCard}>
                    <div style={{ ...s.statValue, color: "#faa61a" }}>
                        {data.total > 0 ? `${Math.round(data.ghostRate * 100)}%` : "N/A"}
                    </div>
                    <div style={s.statLabel}>Ghost Rate</div>
                </div>
            </div>
            {data.avgDelayMs > 0 && (
                <div style={{ ...s.muted, marginTop: "8px", textAlign: "center" }}>
                    Average typing-to-message delay: {(data.avgDelayMs / 1000).toFixed(1)}s
                </div>
            )}
        </div>
    );
}

function MessageItem({ msg, deleted, showEditHistory }: { msg: any; deleted?: boolean; showEditHistory?: boolean }) {
    const content = msg.content || "[No content]";
    const ts = msg.created_at || msg.deleted_at || msg.edited_at;

    let editHistory: string[] = [];
    if (showEditHistory && msg.edit_history) {
        try { editHistory = JSON.parse(msg.edit_history); } catch { }
    }

    return (
        <div style={{
            ...s.eventItem,
            borderLeftColor: deleted ? "#f04747" : showEditHistory ? "#f47b67" : "var(--background-modifier-accent)",
        }}>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: "13px",
                    color: deleted ? "#f04747" : "var(--text-normal)",
                    textDecoration: deleted ? "line-through" : "none",
                    wordBreak: "break-word" as const,
                }}>
                    {content}
                </div>

                {editHistory.length > 0 && (
                    <div style={{ marginTop: "4px" }}>
                        {editHistory.map((old: string, i: number) => (
                            <div key={i} style={{
                                fontSize: "11px", color: "var(--text-muted)",
                                textDecoration: "line-through",
                                marginBottom: "2px",
                            }}>
                                {old}
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
                    <span>ch:{msg.channel_id?.slice(-6)}</span>
                    {msg.attachment_count > 0 && <span>{msg.attachment_count} attachments</span>}
                    {msg.word_count > 0 && <span>{msg.word_count} words</span>}
                    {msg.is_reply > 0 && <span>reply</span>}
                    {deleted && msg.deleted_at && <span>Deleted {new Date(msg.deleted_at).toLocaleString()}</span>}
                </div>
            </div>
            <span style={s.timestamp}>
                {new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
        </div>
    );
}
