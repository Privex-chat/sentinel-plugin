import { React } from "@webpack/common";
import { UserAvatar, getDisplayName } from "./common/UserAvatar";
import { SparkLine } from "./charts/SparkLine";
import { s, STATUS_COLORS } from "../styles";

interface TargetCardProps {
    target: any;
    status: any;
    onClick: () => void;
    onRemove?: () => void;
}

function formatDuration(ms: number): string {
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
}

export function TargetCard({ target, status, onClick, onRemove }: TargetCardProps) {
    const [hovered, setHovered] = React.useState(false);
    const presence = status?.presence;
    const activities = status?.activities || [];
    const voiceState = status?.voiceState;
    const currentStatus = presence?.status || "offline";
    const statusColor = STATUS_COLORS[currentStatus] || STATUS_COLORS.offline;
    const platform = presence?.platform;

    const currentActivity = activities.find((a: any) => a.type === 0);
    const spotifyActivity = activities.find((a: any) => a.type === 2);

    return (
        <div
            style={{
                ...s.targetCard,
                ...(hovered ? s.targetCardHover : {}),
                borderLeftColor: statusColor,
                borderLeftWidth: "3px",
                position: "relative",
            }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Remove button — shown on hover */}
            {onRemove && hovered && (
                <div
                    style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "#f04747",
                        color: "white",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 1,
                        lineHeight: 1,
                        fontWeight: 700,
                    }}
                    onClick={(e: any) => { e.stopPropagation(); onRemove(); }}
                    title="Stop tracking"
                >
                    ×
                </div>
            )}

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                    <UserAvatar userId={target.user_id} size={40} />
                    <div style={{
                        position: "absolute", bottom: -1, right: -1,
                        width: "14px", height: "14px", borderRadius: "50%",
                        backgroundColor: statusColor,
                        border: "2px solid var(--background-tertiary)",
                    }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const }}>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--header-primary)" }}>
                            {getDisplayName(target.user_id)}
                        </span>
                        {target.label && (
                            <span style={s.badge("#5865f2")}>{target.label}</span>
                        )}
                        {target.priority > 0 && (
                            <span style={s.badge(target.priority >= 2 ? "#f04747" : "#faa61a")}>
                                {target.priority >= 2 ? "CRITICAL" : "HIGH"}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {currentStatus !== "offline" ? (
                            <span>{currentStatus}{platform ? ` (${platform})` : ""}</span>
                        ) : (
                            <span>Offline</span>
                        )}
                    </div>
                </div>
            </div>

            {currentActivity && (
                <div style={{
                    marginTop: "8px", padding: "6px 8px",
                    backgroundColor: "var(--background-secondary)",
                    borderRadius: "4px", fontSize: "12px",
                }}>
                    <span style={{ color: "var(--text-muted)" }}>Playing </span>
                    <span style={{ color: "var(--text-normal)", fontWeight: 500 }}>{currentActivity.name}</span>
                    {currentActivity.details && (
                        <span style={{ color: "var(--text-muted)" }}> — {currentActivity.details}</span>
                    )}
                </div>
            )}

            {spotifyActivity && !currentActivity && (
                <div style={{
                    marginTop: "8px", padding: "6px 8px",
                    backgroundColor: "var(--background-secondary)",
                    borderRadius: "4px", fontSize: "12px",
                }}>
                    <span style={{ color: "#1db954" }}>Listening to </span>
                    <span style={{ color: "var(--text-normal)", fontWeight: 500 }}>
                        {spotifyActivity.details || "Spotify"}
                    </span>
                    {spotifyActivity.state && (
                        <span style={{ color: "var(--text-muted)" }}> by {spotifyActivity.state}</span>
                    )}
                </div>
            )}

            {voiceState && (
                <div style={{
                    marginTop: "6px", padding: "6px 8px",
                    backgroundColor: "var(--background-secondary)",
                    borderRadius: "4px", fontSize: "12px",
                    color: "#43b581",
                }}>
                    In voice channel
                    {voiceState.streaming && " (Streaming)"}
                    {voiceState.selfMute && " (Muted)"}
                </div>
            )}
        </div>
    );
}
