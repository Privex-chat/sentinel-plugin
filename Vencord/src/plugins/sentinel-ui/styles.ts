import { React } from "@webpack/common";

export const s = {
    // Layout
    container: {
        padding: "16px",
        backgroundColor: "var(--background-secondary)",
        borderRadius: "8px",
        marginBottom: "16px",
    } as React.CSSProperties,
    card: {
        padding: "12px",
        backgroundColor: "var(--background-tertiary)",
        borderRadius: "8px",
        marginBottom: "8px",
    } as React.CSSProperties,
    row: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    } as React.CSSProperties,
    col: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "8px",
    } as React.CSSProperties,
    grid2: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
    } as React.CSSProperties,
    grid3: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "8px",
    } as React.CSSProperties,
    grid4: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "8px",
    } as React.CSSProperties,

    // Top bar
    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: "var(--background-tertiary)",
        borderRadius: "8px",
        marginBottom: "16px",
    } as React.CSSProperties,
    statusDot: (color: string) => ({
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: color,
        display: "inline-block",
        marginRight: "6px",
    } as React.CSSProperties),

    // Tabs
    tabBar: {
        display: "flex",
        gap: "4px",
        marginBottom: "16px",
        borderBottom: "2px solid var(--background-modifier-accent)",
        paddingBottom: "0",
        overflowX: "auto" as const,
    } as React.CSSProperties,
    tab: (active: boolean) => ({
        padding: "8px 16px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: active ? 600 : 400,
        color: active ? "var(--interactive-active)" : "var(--interactive-normal)",
        borderBottom: active ? "2px solid var(--brand-experiment)" : "2px solid transparent",
        marginBottom: "-2px",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap" as const,
    } as React.CSSProperties),

    // Cards
    targetCard: {
        padding: "12px",
        backgroundColor: "var(--background-tertiary)",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "background-color 0.15s",
        border: "1px solid var(--background-modifier-accent)",
    } as React.CSSProperties,
    targetCardHover: {
        backgroundColor: "var(--background-secondary-alt)",
    } as React.CSSProperties,

    // Stats
    statCard: {
        padding: "12px",
        backgroundColor: "var(--background-tertiary)",
        borderRadius: "6px",
        textAlign: "center" as const,
    } as React.CSSProperties,
    statValue: {
        fontSize: "22px",
        fontWeight: 700,
        lineHeight: "1.2",
    } as React.CSSProperties,
    statLabel: {
        fontSize: "11px",
        color: "var(--interactive-normal)",
        marginTop: "4px",
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
    } as React.CSSProperties,

    // Events
    eventItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "8px 10px",
        backgroundColor: "var(--background-tertiary)",
        borderRadius: "4px",
        marginBottom: "4px",
        borderLeft: "3px solid transparent",
    } as React.CSSProperties,
    badge: (color: string) => ({
        display: "inline-block",
        padding: "1px 6px",
        borderRadius: "10px",
        fontSize: "10px",
        fontWeight: 600,
        backgroundColor: color + "25",
        color: color,
    } as React.CSSProperties),
    timestamp: {
        fontSize: "11px",
        color: "var(--interactive-normal)",
    } as React.CSSProperties,

    // Avatar
    avatar: (size: number) => ({
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        flexShrink: 0,
    } as React.CSSProperties),

    // Progress bar
    progressBar: {
        height: "6px",
        backgroundColor: "var(--background-modifier-accent)",
        borderRadius: "3px",
        overflow: "hidden",
    } as React.CSSProperties,
    progressFill: (pct: number, color: string) => ({
        height: "100%",
        width: `${Math.min(pct, 100)}%`,
        backgroundColor: color,
        borderRadius: "3px",
        transition: "width 0.3s ease",
    } as React.CSSProperties),

    // Scrollable
    scrollArea: {
        maxHeight: "500px",
        overflowY: "auto" as const,
        paddingRight: "4px",
    } as React.CSSProperties,

    // Text
    muted: {
        color: "var(--interactive-normal)",
        fontSize: "12px",
    } as React.CSSProperties,
    small: {
        fontSize: "12px",
    } as React.CSSProperties,
    bold: {
        fontWeight: 600,
    } as React.CSSProperties,
    heading: {
        fontSize: "16px",
        fontWeight: 600,
        marginBottom: "8px",
    } as React.CSSProperties,
    subheading: {
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--interactive-normal)",
        marginBottom: "6px",
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
    } as React.CSSProperties,

    // Buttons
    clickable: {
        cursor: "pointer",
        userSelect: "none" as const,
    } as React.CSSProperties,
    linkButton: {
        color: "var(--brand-experiment)",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 500,
    } as React.CSSProperties,

    // Misc
    divider: {
        height: "1px",
        backgroundColor: "var(--background-modifier-accent)",
        margin: "12px 0",
    } as React.CSSProperties,
    empty: {
        textAlign: "center" as const,
        padding: "24px",
        color: "var(--interactive-normal)",
        fontSize: "14px",
    } as React.CSSProperties,
    error: {
        padding: "12px",
        backgroundColor: "var(--background-modifier-selected)",
        borderRadius: "6px",
        color: "var(--status-danger)",
        fontSize: "13px",
    } as React.CSSProperties,
};

// Semantic color tokens - use these everywhere instead of hardcoded hex.
// They reference Discord's own CSS variables so they adapt to Light/Ash/Dark/Onyx.
export const C = {
    // Status presence
    online:   "var(--status-positive)",
    idle:     "var(--status-warning)",
    dnd:      "var(--status-danger)",
    offline:  "var(--interactive-normal)",

    // Semantic feedback
    danger:   "var(--status-danger)",
    positive: "var(--status-positive)",
    warning:  "var(--status-warning)",

    // Brand / third-party (no Discord-native var exists, keep fixed)
    blurple:  "#5865f2",
    spotify:  "#1db954",
    twitch:   "#6441a5",
    purple:   "#9b84ec",
    pink:     "#e91e63",
} as const;

// Event type styling
export const EVENT_COLORS: Record<string, string> = {
    PRESENCE_UPDATE: "#43b581",
    INITIAL_PRESENCE: "#00d9ff",
    PLATFORM_SWITCH: "#5865f2",
    ACTIVITY_START: "#7289da",
    ACTIVITY_END: "#99aab5",
    SPOTIFY_START: "#1db954",
    SPOTIFY_END: "#99aab5",
    STREAMING_START: "#6441a5",
    STREAMING_END: "#99aab5",
    CUSTOM_STATUS_SET: "#e91e63",
    CUSTOM_STATUS_CLEARED: "#99aab5",
    MESSAGE_CREATE: "#faa61a",
    MESSAGE_UPDATE: "#f47b67",
    MESSAGE_DELETE: "#f04747",
    TYPING_START: "#9b84ec",
    GHOST_TYPE: "#9b84ec",
    VOICE_JOIN: "#43b581",
    VOICE_LEAVE: "#f04747",
    VOICE_MOVE: "#faa61a",
    VOICE_STATE_CHANGE: "#7289da",
    PROFILE_UPDATE: "#e91e63",
    AVATAR_CHANGE: "#e91e63",
    USERNAME_CHANGE: "#e91e63",
    NICKNAME_CHANGE: "#5865f2",
    ROLE_ADD: "#43b581",
    ROLE_REMOVE: "#f04747",
    REACTION_ADD: "#faa61a",
    REACTION_REMOVE: "#99aab5",
    SERVER_JOIN: "#43b581",
    SERVER_LEAVE: "#f04747",
    ACCOUNT_CONNECTED: "#43b581",
    ACCOUNT_DISCONNECTED: "#f04747",
    DM_CHANNEL_OPENED: "#e91e63",
    ALERT: "#ff6b6b",
};

export const EVENT_LABELS: Record<string, string> = {
    PRESENCE_UPDATE: "Status Change",
    INITIAL_PRESENCE: "Initial Status",
    PLATFORM_SWITCH: "Platform Switch",
    ACTIVITY_START: "Started Activity",
    ACTIVITY_END: "Ended Activity",
    SPOTIFY_START: "Spotify Playing",
    SPOTIFY_END: "Spotify Stopped",
    STREAMING_START: "Started Streaming",
    STREAMING_END: "Stopped Streaming",
    CUSTOM_STATUS_SET: "Custom Status",
    CUSTOM_STATUS_CLEARED: "Status Cleared",
    MESSAGE_CREATE: "Sent Message",
    MESSAGE_UPDATE: "Edited Message",
    MESSAGE_DELETE: "Deleted Message",
    TYPING_START: "Typing",
    GHOST_TYPE: "Ghost Typed",
    VOICE_JOIN: "Joined Voice",
    VOICE_LEAVE: "Left Voice",
    VOICE_MOVE: "Moved Channel",
    VOICE_STATE_CHANGE: "Voice State",
    PROFILE_UPDATE: "Profile Update",
    AVATAR_CHANGE: "Avatar Changed",
    USERNAME_CHANGE: "Username Changed",
    NICKNAME_CHANGE: "Nickname Changed",
    ROLE_ADD: "Role Added",
    ROLE_REMOVE: "Role Removed",
    REACTION_ADD: "Reacted",
    REACTION_REMOVE: "Un-reacted",
    SERVER_JOIN: "Joined Server",
    SERVER_LEAVE: "Left Server",
    ACCOUNT_CONNECTED: "Account Linked",
    ACCOUNT_DISCONNECTED: "Account Unlinked",
    DM_CHANNEL_OPENED: "DM Opened",
    ALERT: "Alert",
};

export const STATUS_COLORS: Record<string, string> = {
    online:    "var(--status-positive)",
    idle:      "var(--status-warning)",
    dnd:       "var(--status-danger)",
    offline:   "var(--interactive-normal)",
    invisible: "var(--interactive-normal)",
};
