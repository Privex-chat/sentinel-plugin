import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay } from "../common/ErrorBoundary";
import { EmptyState } from "../common/EmptyState";
import { s } from "../../styles";

export function ProfileHistory({ userId }: { userId: string }) {
    const { data, loading, error } = useApi(() => api.getProfileHistory(userId), [userId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;
    if (!data || data.length === 0) return <EmptyState message="No profile history" />;

    return (
        <div style={s.col}>
            {/* Avatar gallery */}
            <div style={s.card}>
                <div style={s.subheading}>Avatar History</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {data.filter((snap: any) => snap.avatar_hash).map((snap: any, i: number) => {
                        const ext = snap.avatar_hash.startsWith("a_") ? "gif" : "png";
                        const url = `https://cdn.discordapp.com/avatars/${userId}/${snap.avatar_hash}.${ext}?size=128`;
                        return (
                            <div key={i} style={{ textAlign: "center" }}>
                                <img src={url} style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid var(--background-modifier-accent)" }} alt="" />
                                <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
                                    {new Date(snap.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Profile change timeline */}
            <div style={s.card}>
                <div style={s.subheading}>Profile Changes</div>
                {data.map((snap: any, i: number) => {
                    const prev = data[i + 1];
                    const changes: string[] = [];
                    if (prev) {
                        if (prev.username !== snap.username) changes.push(`Username: ${prev.username} -> ${snap.username}`);
                        if (prev.global_name !== snap.global_name) changes.push(`Display: ${prev.global_name || "none"} -> ${snap.global_name || "none"}`);
                        if (prev.avatar_hash !== snap.avatar_hash) changes.push("Avatar changed");
                        if (prev.banner_hash !== snap.banner_hash) changes.push("Banner changed");
                        if (prev.bio !== snap.bio) changes.push(`Bio: "${(prev.bio || "").slice(0, 30)}..." -> "${(snap.bio || "").slice(0, 30)}..."`);
                        if (prev.pronouns !== snap.pronouns) changes.push(`Pronouns: ${prev.pronouns || "none"} -> ${snap.pronouns || "none"}`);
                    }

                    if (changes.length === 0 && i > 0) return null;

                    return (
                        <div key={i} style={{ ...s.eventItem, borderLeftColor: "#e91e63" }}>
                            <div style={{ flex: 1 }}>
                                {i === data.length - 1 ? (
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Initial snapshot</div>
                                ) : (
                                    changes.map((c, j) => (
                                        <div key={j} style={{ fontSize: "12px", color: "var(--text-normal)", marginBottom: "2px" }}>{c}</div>
                                    ))
                                )}
                            </div>
                            <span style={s.timestamp}>
                                {new Date(snap.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    );
                }).filter(Boolean)}
            </div>

            {/* Connected accounts */}
            {data[0]?.connected_accounts && (
                <div style={s.card}>
                    <div style={s.subheading}>Connected Accounts</div>
                    {(() => {
                        try {
                            const accounts = JSON.parse(data[0].connected_accounts);
                            return accounts.map((acc: any, i: number) => (
                                <div key={i} style={{ ...s.row, padding: "4px 0" }}>
                                    <span style={s.badge("#5865f2")}>{acc.type}</span>
                                    <span style={{ fontSize: "12px", color: "var(--text-normal)" }}>{acc.name}</span>
                                    {acc.verified && <span style={{ fontSize: "10px", color: "#43b581" }}>verified</span>}
                                </div>
                            ));
                        } catch { return null; }
                    })()}
                </div>
            )}
        </div>
    );
}
