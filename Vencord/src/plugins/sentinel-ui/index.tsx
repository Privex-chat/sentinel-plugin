import { definePluginSettings } from "@api/Settings";
import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import definePlugin, { OptionType } from "@utils/types";
import { React, Menu } from "@webpack/common";

import { api } from "./api/client";
import { Dashboard } from "./components/Dashboard";
import { Timeline } from "./components/Timeline";
import { Analytics } from "./components/Analytics";
import { Overview } from "./components/Overview";
import { ProfileHistory } from "./components/profiles/ProfileHistory";
import { MessageLog } from "./components/messages/MessageLog";
import { AlertConfig } from "./components/alerts/AlertConfig";
import { InsightsPanel } from "./components/insights/InsightsPanel";
import { ConnectionStatus } from "./components/settings/ConnectionSettings";
import { useRealtime } from "./hooks/useRealtime";
import { connectSSE } from "./api/sse";
import { s } from "./styles";
import type { TabId, TargetTab } from "./types";

// ============================================================================
// SETTINGS
// ============================================================================

export const settings = definePluginSettings({
    sentinelUrl: {
        type: OptionType.STRING,
        description: "URL of your Sentinel API server",
        default: "http://localhost:48923",
    },
    sentinelToken: {
        type: OptionType.STRING,
        description: "Bearer token for Sentinel API authentication",
        default: "",
    },
    dashboardRefreshInterval: {
        type: OptionType.NUMBER,
        description: "Dashboard auto-refresh interval in seconds",
        default: 30,
    },
    enableSSE: {
        type: OptionType.BOOLEAN,
        description: "Enable real-time event streaming (SSE)",
        default: true,
    },
    showDesktopNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show desktop notifications for alerts",
        default: true,
    },
});

// ============================================================================
// CONTEXT MENU — module-level cache of tracked user IDs so the patch function
// (which is not a React component) can read it synchronously.
// ============================================================================

let trackedUserIds: Set<string> = new Set();

async function refreshTrackedUsers() {
    try {
        const targets = await api.getTargets();
        trackedUserIds = new Set(targets.map((t: any) => t.user_id));
    } catch { }
}

const userContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const userId: string | undefined = props?.user?.id;
    if (!userId) return;

    const isTracked = trackedUserIds.has(userId);

    children.push(
        <Menu.MenuSeparator key="sentinel-sep" />,
        isTracked
            ? (
                <Menu.MenuItem
                    key="sentinel-untrack"
                    id="sentinel-untrack"
                    label="Stop Tracking (Sentinel)"
                    color="danger"
                    action={async () => {
                        try {
                            await api.removeTarget(userId);
                            trackedUserIds.delete(userId);
                            api.clearCache();
                        } catch (e: any) {
                            console.error("[Sentinel] removeTarget failed:", e.message);
                        }
                    }}
                />
            )
            : (
                <Menu.MenuItem
                    key="sentinel-track"
                    id="sentinel-track"
                    label="Track with Sentinel"
                    action={async () => {
                        try {
                            await api.addTarget(userId);
                            trackedUserIds.add(userId);
                            api.clearCache();
                        } catch (e: any) {
                            console.error("[Sentinel] addTarget failed:", e.message);
                        }
                    }}
                />
            )
    );
};

// ============================================================================
// MAIN PANEL
// ============================================================================

function SentinelPanel() {
    const [tab, setTab] = React.useState<TabId>("dashboard");
    const [selectedTarget, setSelectedTarget] = React.useState<string | null>(null);
    const [targetTab, setTargetTab] = React.useState<TargetTab>("overview");

    // Single SSE connection for the whole panel. cacheVersion increments
    // every time SSE events cause the API cache to be cleared, so any
    // useApi call that includes it as a dep will automatically refetch.
    const { connected, recentEvents, cacheVersion } = useRealtime();

    // Keep the context-menu tracked-user cache in sync whenever
    // the cache version bumps (i.e. after any target-list change).
    React.useEffect(() => {
        refreshTrackedUsers();
    }, [cacheVersion]);

    // Also refresh once on mount.
    React.useEffect(() => {
        refreshTrackedUsers();
    }, []);

    const handleSelectTarget = (userId: string) => {
        setSelectedTarget(userId);
        setTab("target");
        setTargetTab("overview");
    };

    const handleBack = () => {
        setTab("dashboard");
        setSelectedTarget(null);
    };

    const targetTabs: { id: TargetTab; label: string }[] = [
        { id: "overview", label: "Overview" },
        { id: "timeline", label: "Timeline" },
        { id: "analytics", label: "Analytics" },
        { id: "messages", label: "Messages" },
        { id: "profile", label: "Profile" },
        { id: "insights", label: "Insights" },
        { id: "alerts", label: "Alerts" },
    ];

    return (
        <div style={{ maxWidth: "900px" }}>
            <ConnectionStatus />

            {tab === "dashboard" && (
                <Dashboard
                    onSelectTarget={handleSelectTarget}
                    connected={connected}
                    recentEvents={recentEvents}
                    cacheVersion={cacheVersion}
                />
            )}

            {tab === "target" && selectedTarget && (
                <div>
                    {/* Back + target header */}
                    <div style={{ ...s.row, marginBottom: "12px" }}>
                        <span style={s.linkButton} onClick={handleBack}>
                            ← Dashboard
                        </span>
                        <span style={{ ...s.muted, marginLeft: "8px", fontFamily: "monospace", fontSize: "11px" }}>
                            {selectedTarget}
                        </span>
                    </div>

                    {/* Target sub-tabs */}
                    <div style={s.tabBar}>
                        {targetTabs.map(t => (
                            <div
                                key={t.id}
                                style={s.tab(targetTab === t.id)}
                                onClick={() => setTargetTab(t.id)}
                            >
                                {t.label}
                            </div>
                        ))}
                    </div>

                    {/* Tab content — every tab receives cacheVersion so it can
                        refetch when SSE events clear the API cache */}
                    {targetTab === "overview" && (
                        <Overview userId={selectedTarget} refreshTrigger={cacheVersion} />
                    )}
                    {targetTab === "timeline" && (
                        <Timeline userId={selectedTarget} />
                    )}
                    {targetTab === "analytics" && (
                        <Analytics userId={selectedTarget} refreshTrigger={cacheVersion} />
                    )}
                    {targetTab === "messages" && (
                        <MessageLog userId={selectedTarget} />
                    )}
                    {targetTab === "profile" && (
                        <ProfileHistory userId={selectedTarget} />
                    )}
                    {targetTab === "insights" && (
                        <InsightsPanel userId={selectedTarget} />
                    )}
                    {targetTab === "alerts" && (
                        <AlertConfig userId={selectedTarget} />
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// PLUGIN DEFINITION
// ============================================================================

export default definePlugin({
    name: "SentinelUI",
    description: "Frontend dashboard for the Sentinel Discord intelligence platform. Connects to your Sentinel API to display real-time tracking, analytics, and behavioral insights.",
    authors: [
        {
            id: 1053965380957241344n,
            name: "sonixaep",
        },
    ],
    settings,

    start() {
        addContextMenuPatch("user-context", userContextMenuPatch);
        // Pre-populate the tracked-user cache so the first right-click is correct.
        refreshTrackedUsers();
    },

    stop() {
        removeContextMenuPatch("user-context", userContextMenuPatch);
    },

    settingsAboutComponent: () => <SentinelPanel />,
});
