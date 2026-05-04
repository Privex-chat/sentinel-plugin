import { definePluginSettings } from "@api/Settings";
import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import definePlugin, { OptionType } from "@utils/types";
import { React, Menu } from "@webpack/common";
import { openModal, ModalRoot, ModalContent, ModalHeader, ModalCloseButton, ModalSize } from "@utils/modal";

import { api } from "./api/client";
import { Dashboard } from "./components/Dashboard";
import { Timeline } from "./components/Timeline";
import { Analytics } from "./components/Analytics";
import { Overview } from "./components/Overview";
import { ProfileHistory } from "./components/profiles/ProfileHistory";
import { MessageLog } from "./components/messages/MessageLog";
import { AlertConfig } from "./components/alerts/AlertConfig";
import { InsightsPanel } from "./components/insights/InsightsPanel";
import { BriefsTab } from "./components/briefs/BriefsTab";
import { BackfillTab } from "./components/backfill/BackfillTab";
import { TargetConfigView } from "./components/config/TargetConfig";
import { RuntimeConfigPanel } from "./components/settings/RuntimeConfig";
import { ConnectionStatus } from "./components/settings/ConnectionSettings";
import { useRealtime } from "./hooks/useRealtime";
import { useApi } from "./hooks/useApi";
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
        placeholder: "Click to enter token",
        componentProps: {
            type: "password",
        },
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
// CONTEXT MENU - module-level cache of tracked user IDs so the patch function
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
// FULL DASHBOARD - rendered inside the modal for spacious layout
// ============================================================================

function SentinelDashboard() {
    const [tab, setTab] = React.useState<TabId>("dashboard");
    const [selectedTarget, setSelectedTarget] = React.useState<string | null>(null);
    const [targetTab, setTargetTab] = React.useState<TargetTab>("overview");

    const { connected, recentEvents, cacheVersion } = useRealtime();

    React.useEffect(() => {
        refreshTrackedUsers();
    }, [cacheVersion]);

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
        { id: "overview",  label: "Overview" },
        { id: "timeline",  label: "Timeline" },
        { id: "analytics", label: "Analytics" },
        { id: "messages",  label: "Messages" },
        { id: "profile",   label: "Profile" },
        { id: "insights",  label: "Insights" },
        { id: "alerts",    label: "Alerts" },
        { id: "briefs",    label: "Briefs" },
        { id: "backfill",  label: "Backfill" },
        { id: "config",    label: "Config" },
    ];

    // Top-level nav tabs
    const topTabs: { id: TabId; label: string }[] = [
        { id: "dashboard",     label: "Dashboard" },
        { id: "runtimeconfig", label: "Runtime Config" },
    ];

    return (
        <div style={{ padding: "16px", minHeight: "600px" }}>
            {/* Top-level tabs - only visible when not inside a target view */}
            {tab !== "target" && (
                <div style={{ ...s.tabBar, marginBottom: "16px" }}>
                    {topTabs.map(t => (
                        <div key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>
                            {t.label}
                        </div>
                    ))}
                </div>
            )}

            {tab === "dashboard" && (
                <Dashboard
                    onSelectTarget={handleSelectTarget}
                    connected={connected}
                    recentEvents={recentEvents}
                    cacheVersion={cacheVersion}
                />
            )}

            {tab === "runtimeconfig" && (
                <div>
                    <div style={s.heading}>Runtime Configuration</div>
                    <div style={{ ...s.muted, marginBottom: "16px" }}>
                        Hot-swap selfbot settings without restarting. Changes apply immediately.
                    </div>
                    <RuntimeConfigPanel />
                </div>
            )}

            {tab === "target" && selectedTarget && (
                <div>
                    {/* Back + target header */}
                    <div style={{ ...s.row, marginBottom: "12px" }}>
                        <span style={s.linkButton} onClick={handleBack}>
                            &lt;- Dashboard
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

                    {targetTab === "overview"  && <Overview userId={selectedTarget} refreshTrigger={cacheVersion} />}
                    {targetTab === "timeline"  && <Timeline userId={selectedTarget} />}
                    {targetTab === "analytics" && <Analytics userId={selectedTarget} refreshTrigger={cacheVersion} />}
                    {targetTab === "messages"  && <MessageLog userId={selectedTarget} />}
                    {targetTab === "profile"   && <ProfileHistory userId={selectedTarget} />}
                    {targetTab === "insights"  && <InsightsPanel userId={selectedTarget} />}
                    {targetTab === "alerts"    && <AlertConfig userId={selectedTarget} />}
                    {targetTab === "briefs"    && <BriefsTab userId={selectedTarget} />}
                    {targetTab === "backfill"  && <BackfillTab userId={selectedTarget} />}
                    {targetTab === "config"    && <TargetConfigView userId={selectedTarget} />}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// LAUNCHER - what shows in Settings -> Plugins -> SentinelUI -> Gear Icon
// A minimal card that opens the full dashboard in a spacious modal window.
// ============================================================================

function SentinelPanel() {
    const { data: status } = useApi(() => api.getStatus(), []);

    const handleOpenDashboard = () => {
        openModal((props: any) => (
            <ModalRoot {...props} size={ModalSize.LARGE}>
                <ModalHeader>
                    <span style={{ fontWeight: 700, fontSize: "16px", flex: 1 }}>
                        Sentinel Dashboard
                    </span>
                    <ModalCloseButton onClick={props.onClose} />
                </ModalHeader>
                <ModalContent>
                    <SentinelDashboard />
                </ModalContent>
            </ModalRoot>
        ));
    };

    const connected = !!status;

    return (
        <div style={{ padding: "4px 0" }}>
            <ConnectionStatus />

            {/* Stats row */}
            {status && (
                <div style={{ ...s.grid4, marginBottom: "12px" }}>
                    {[
                        { label: "Targets",  value: String(status.activeTargets) },
                        { label: "Events",   value: status.eventCount?.toLocaleString() || "0" },
                        { label: "Uptime",   value: status.uptimeFormatted || "-" },
                        { label: "DB Size",  value: `${status.dbSizeMB} MB` },
                    ].map(item => (
                        <div key={item.label} style={s.statCard}>
                            <div style={s.statValue}>{item.value}</div>
                            <div style={s.statLabel}>{item.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Open dashboard button */}
            <div
                style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 0",
                    backgroundColor: "var(--brand-experiment)",
                    color: "white",
                    borderRadius: "6px",
                    textAlign: "center" as const,
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    userSelect: "none" as const,
                    letterSpacing: "0.2px",
                }}
                onClick={handleOpenDashboard}
            >
                Open Sentinel Dashboard
            </div>

            <div style={{ ...s.muted, marginTop: "8px", textAlign: "center" as const, fontSize: "11px" }}>
                Opens full dashboard in a large modal window - configure API URL &amp; token above
            </div>
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
        refreshTrackedUsers();
    },

    stop() {
        removeContextMenuPatch("user-context", userContextMenuPatch);
    },

    settingsAboutComponent: () => <SentinelPanel />,
});
