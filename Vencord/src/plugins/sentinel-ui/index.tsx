import { definePluginSettings } from "@api/Settings";
import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import definePlugin, { OptionType } from "@utils/types";
import { React, Menu } from "@webpack/common";
import { openModal, closeModal, ModalRoot, ModalContent, ModalHeader, ModalCloseButton, ModalSize } from "@utils/modal";

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
    opsecMode: {
        type: OptionType.BOOLEAN,
        description: "OPSEC Mode: hide all Sentinel traces from Discord UI. Removes right-click menu items, replaces all branding with a disguise name, and enables the panic key (Ctrl+Shift+.) to instantly close the dashboard.",
        default: false,
    },
    disguiseName: {
        type: OptionType.STRING,
        description: "Name shown in place of 'Sentinel' when OPSEC Mode is active",
        default: "Discord Utilities",
    },
});

// ============================================================================
// OPSEC - panic close and keyboard handler
// ============================================================================

let sentinelModalKey: string | null = null;

function panicClose() {
    if (sentinelModalKey !== null) {
        closeModal(sentinelModalKey);
        sentinelModalKey = null;
    }
}

function handleGlobalKeyDown(e: KeyboardEvent) {
    // Ctrl+Shift+. = panic close (close dashboard instantly)
    if (e.ctrlKey && e.shiftKey && e.key === ".") {
        panicClose();
    }
}

// Log prefix - generic when OPSEC mode is active
function logPrefix(): string {
    return settings.store.opsecMode ? "[Plugin]" : "[Sentinel]";
}

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
                    label="Stop Tracking"
                    color="danger"
                    action={async () => {
                        try {
                            await api.removeTarget(userId);
                            trackedUserIds.delete(userId);
                            api.clearCache();
                        } catch (e: any) {
                            console.error(`${logPrefix()} removeTarget failed:`, e.message);
                        }
                    }}
                />
            )
            : (
                <Menu.MenuItem
                    key="sentinel-track"
                    id="sentinel-track"
                    label="Track User"
                    action={async () => {
                        try {
                            await api.addTarget(userId);
                            trackedUserIds.add(userId);
                            api.clearCache();
                        } catch (e: any) {
                            console.error(`${logPrefix()} addTarget failed:`, e.message);
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
    const opsec = settings.store.opsecMode;

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

    const topTabs: { id: TabId; label: string }[] = [
        { id: "dashboard",     label: "Dashboard" },
        { id: "runtimeconfig", label: "Runtime Config" },
    ];

    return (
        <div style={{ padding: "16px", minHeight: "600px", position: "relative" as const }}>
            {/* OPSEC indicator - only visible inside the modal, never on external Discord UI */}
            {opsec && (
                <div style={{
                    position: "absolute" as const,
                    top: "0px",
                    right: "0px",
                    padding: "2px 8px",
                    backgroundColor: "var(--background-modifier-accent)",
                    borderRadius: "4px",
                    fontSize: "9px",
                    color: "var(--text-muted)",
                    fontFamily: "monospace",
                    letterSpacing: "1.5px",
                    userSelect: "none" as const,
                }}>
                    OPSEC
                </div>
            )}

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
                    opsecMode={opsec}
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
// ============================================================================

function SentinelPanel() {
    const { data: status } = useApi(() => api.getStatus(), []);

    const opsec       = settings.store.opsecMode;
    const disguise    = settings.store.disguiseName || "Discord Utilities";
    const displayName = opsec ? disguise : "Sentinel";

    const handleOpenDashboard = () => {
        const key = openModal((props: any) => (
            <ModalRoot {...props} size={ModalSize.LARGE}>
                <ModalHeader>
                    <span style={{ fontWeight: 700, fontSize: "16px", flex: 1 }}>
                        {displayName}
                    </span>
                    <ModalCloseButton onClick={props.onClose} />
                </ModalHeader>
                <ModalContent>
                    <SentinelDashboard />
                </ModalContent>
            </ModalRoot>
        ));
        sentinelModalKey = key;
    };

    return (
        <div style={{ padding: "4px 0" }}>
            <ConnectionStatus opsecMode={opsec} disguiseName={disguise} />

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
                    backgroundColor: opsec
                        ? "var(--background-modifier-accent)"
                        : "var(--brand-experiment)",
                    color: opsec ? "var(--text-normal)" : "white",
                    borderRadius: "6px",
                    textAlign: "center" as const,
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: "pointer",
                    userSelect: "none" as const,
                    letterSpacing: "0.2px",
                    border: opsec ? "1px solid var(--background-modifier-accent)" : "none",
                }}
                onClick={handleOpenDashboard}
            >
                {opsec ? `Open ${disguise}` : "Open Sentinel Dashboard"}
            </div>

            {/* Footer hint */}
            <div style={{ ...s.muted, marginTop: "8px", textAlign: "center" as const, fontSize: "11px" }}>
                {opsec
                    ? `OPSEC active - Ctrl+Shift+. closes the panel instantly`
                    : "Opens full dashboard in a large modal window - configure API URL & token above"
                }
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
        // Only add context menu items when OPSEC mode is off
        if (!settings.store.opsecMode) {
            addContextMenuPatch("user-context", userContextMenuPatch);
            refreshTrackedUsers();
        }
        // Panic key always active
        document.addEventListener("keydown", handleGlobalKeyDown);
    },

    stop() {
        removeContextMenuPatch("user-context", userContextMenuPatch);
        document.removeEventListener("keydown", handleGlobalKeyDown);
        // Close any open dashboard on plugin stop
        if (sentinelModalKey !== null) {
            closeModal(sentinelModalKey);
            sentinelModalKey = null;
        }
    },

    settingsAboutComponent: () => <SentinelPanel />,
});
