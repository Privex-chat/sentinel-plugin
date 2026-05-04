/**
 * RuntimeConfig - hot-swap selfbot .env settings without restarting.
 * Mirrors the web dashboard's Settings > Runtime Config panel.
 */
import { React } from "@webpack/common";
import { api } from "../../api/client";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { s, C } from "../../styles";

// Keys whose values must be masked in the UI
const SENSITIVE = new Set([
    "DISCORD_TOKEN",
    "AI_API_KEY",
    "SUPABASE_SERVICE_KEY",
    "ALERT_WEBHOOK_URL",
    "CRITICAL_WEBHOOK_URL",
]);

// Sentinel value the API returns for masked fields
const MASKED_VALUE = "••••••••";

interface ConfigField {
    key: string;
    label: string;
    desc: string;
    placeholder?: string;
    type?: "text" | "select" | "boolean" | "number";
    options?: string[];
}

const CONFIG_GROUPS: { title: string; fields: ConfigField[] }[] = [
    {
        title: "Discord",
        fields: [
            { key: "DISCORD_TOKEN", label: "Discord Token", desc: "User account token for the selfbot", placeholder: "Paste new token..." },
        ],
    },
    {
        title: "Webhooks",
        fields: [
            { key: "ALERT_WEBHOOK_URL",    label: "Alert Webhook URL",    desc: "Discord webhook for normal alerts and startup notifications", placeholder: "https://discord.com/api/webhooks/..." },
            { key: "CRITICAL_WEBHOOK_URL", label: "Critical Webhook URL", desc: "Separate webhook for critical errors. Falls back to alert webhook if empty.", placeholder: "https://discord.com/api/webhooks/..." },
        ],
    },
    {
        title: "AI",
        fields: [
            { key: "AI_PROVIDER",                  label: "Provider",               desc: "AI backend to use",                                                     type: "select", options: ["none", "gemini", "openai", "anthropic", "ollama"] },
            { key: "AI_MODEL",                     label: "Model",                  desc: "Model name (e.g. gemini-2.0-flash, gpt-4o-mini, claude-haiku-4-5)",    placeholder: "gemini-2.0-flash" },
            { key: "AI_API_KEY",                   label: "API Key",                desc: "API key for the selected provider",                                     placeholder: "Paste new key..." },
            { key: "AI_BASE_URL",                  label: "Base URL",               desc: "Custom base URL - only needed for Ollama or self-hosted APIs",          placeholder: "http://localhost:11434/v1" },
            { key: "AI_ANALYSIS_INTERVAL_MS",      label: "Analysis Interval (ms)", desc: "How often to run AI analysis. Default 86400000 = 24 h",                 type: "number", placeholder: "86400000" },
            { key: "AI_CATEGORIZATION_BATCH_SIZE", label: "Categorization Batch",   desc: "Messages analyzed per AI call. Lower = cheaper but slower.",            type: "number", placeholder: "50" },
        ],
    },
    {
        title: "Briefs & Alerts",
        fields: [
            { key: "BRIEF_GENERATION_TIME",    label: "Brief Generation Time",  desc: "Daily brief time in HH:MM format (24 h, UTC)",                     placeholder: "07:00" },
            { key: "ALERT_DIGEST_MODE",        label: "Digest Mode",            desc: "Batch alerts into a digest instead of firing individually",          type: "boolean" },
            { key: "ALERT_DIGEST_INTERVAL_MS", label: "Digest Interval (ms)",   desc: "How often to flush the alert digest. Default 900000 = 15 min",      type: "number", placeholder: "900000" },
            { key: "ALERT_FATIGUE_THRESHOLD",  label: "Fatigue Threshold",      desc: "Max alert fires in 24 h before auto-suppression",                   type: "number", placeholder: "20" },
        ],
    },
    {
        title: "Polling",
        fields: [
            { key: "PROFILE_POLL_INTERVAL_MS",  label: "Profile Poll (ms)",     desc: "Profile refresh interval. Default 300000 = 5 min",      type: "number", placeholder: "300000" },
            { key: "STATUS_POLL_INTERVAL_MS",   label: "Status Poll (ms)",      desc: "Status poll interval. Default 120000 = 2 min",          type: "number", placeholder: "120000" },
            { key: "DAILY_SUMMARY_INTERVAL_MS", label: "Summary Interval (ms)", desc: "Daily summary compute interval. Default 3600000 = 1 h", type: "number", placeholder: "3600000" },
        ],
    },
    {
        title: "Backfill",
        fields: [
            { key: "BACKFILL_ENABLED",                  label: "Backfill Enabled",         desc: "Run message backfill on startup",          type: "boolean" },
            { key: "BACKFILL_MAX_DAYS",                 label: "Max Days",                 desc: "How far back to backfill messages",        type: "number", placeholder: "90" },
            { key: "BACKFILL_MAX_MESSAGES_PER_CHANNEL", label: "Max Messages Per Channel", desc: "Hard cap on messages fetched per channel", type: "number", placeholder: "5000" },
        ],
    },
    {
        title: "Supabase",
        fields: [
            { key: "SUPABASE_URL",              label: "Supabase URL",       desc: "Supabase project URL (for cloud/hybrid sync mode)",  placeholder: "https://xyz.supabase.co" },
            { key: "SUPABASE_SERVICE_KEY",      label: "Service Key",        desc: "Supabase service role key",                         placeholder: "Paste new key..." },
            { key: "SUPABASE_SYNC_INTERVAL_MS", label: "Sync Interval (ms)", desc: "How often to push data to Supabase. Default 30000", type: "number", placeholder: "30000" },
        ],
    },
];

// -- Single config row --------------------------------------------------------

function ConfigRow({
    fieldKey,
    field,
    currentValue,
    onSave,
}: {
    fieldKey: string;
    field: ConfigField;
    currentValue: string;
    onSave: (key: string, value: string) => Promise<void>;
}) {
    const isSensitive = SENSITIVE.has(fieldKey);
    const isMasked    = isSensitive && currentValue === MASKED_VALUE;

    const [editing,  setEditing]  = React.useState(false);
    const [draft,    setDraft]    = React.useState("");
    const [revealed, setRevealed] = React.useState(false);
    const [saving,   setSaving]   = React.useState(false);
    const [saved,    setSaved]    = React.useState(false);
    const [err,      setErr]      = React.useState<string | null>(null);

    const startEdit = () => {
        setDraft(isMasked || isSensitive ? "" : currentValue);
        setEditing(true);
        setErr(null);
        setRevealed(false);
    };
    const cancel = () => { setEditing(false); setDraft(""); setErr(null); };

    const save = async () => {
        if (saving) return;
        setSaving(true);
        setErr(null);
        try {
            await onSave(fieldKey, draft);
            setSaved(true);
            setEditing(false);
            setTimeout(() => setSaved(false), 2000);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    };

    const displayValue = isMasked ? MASKED_VALUE : currentValue || "";

    const inputStyle = {
        width: "100%",
        padding: "6px 8px",
        backgroundColor: "var(--background-secondary)",
        border: "1px solid var(--background-modifier-accent)",
        borderRadius: "4px",
        color: "var(--text-normal)",
        fontSize: "12px",
        outline: "none",
        boxSizing: "border-box" as const,
    };

    return (
        <div style={{
            padding: "10px 12px",
            backgroundColor: "var(--background-tertiary)",
            borderRadius: "6px",
            marginBottom: "6px",
        }}>
            <div style={{ ...s.row, justifyContent: "space-between", marginBottom: "2px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" as const }}>
                        <span style={{ fontSize: "12px", fontWeight: 600 }}>{field.label}</span>
                        {isSensitive && (
                            <span style={s.badge("#faa61a")}>sensitive</span>
                        )}
                        {saved && (
                            <span style={{ ...s.muted, color: C.positive, fontSize: "10px" }}>saved</span>
                        )}
                    </div>
                    <div style={{ ...s.muted, fontSize: "10px", marginTop: "1px" }}>{field.desc}</div>
                </div>
                {!editing && (
                    <span
                        style={{ ...s.linkButton, fontSize: "11px", flexShrink: 0, marginLeft: "8px" }}
                        onClick={startEdit}
                    >
                        Edit
                    </span>
                )}
            </div>

            {!editing ? (
                <code style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    display: "block",
                    marginTop: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                }}>
                    {displayValue || <span style={{ fontStyle: "italic" }}>not set</span>}
                </code>
            ) : (
                <div style={{ marginTop: "6px" }}>
                    {field.type === "select" && field.options ? (
                        <select
                            value={draft}
                            onChange={(e: any) => setDraft(e.target.value)}
                            style={{ ...inputStyle }}
                        >
                            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ) : field.type === "boolean" ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                            {["true", "false"].map(opt => (
                                <span
                                    key={opt}
                                    onClick={() => setDraft(opt)}
                                    style={{
                                        flex: 1,
                                        padding: "6px",
                                        textAlign: "center" as const,
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        border: `1px solid ${draft === opt ? "var(--brand-experiment)" : "var(--background-modifier-accent)"}`,
                                        backgroundColor: draft === opt ? "rgba(88,101,242,0.15)" : "transparent",
                                        color: draft === opt ? "var(--brand-experiment)" : "var(--text-muted)",
                                    }}
                                >
                                    {opt}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div style={{ position: "relative" as const }}>
                            <input
                                type={isSensitive && !revealed ? "password" : "text"}
                                inputMode={field.type === "number" ? "numeric" : "text"}
                                value={draft}
                                onChange={(e: any) => setDraft(e.target.value)}
                                placeholder={field.placeholder}
                                autoComplete="off"
                                style={{ ...inputStyle, paddingRight: isSensitive ? "52px" : "8px" }}
                                onKeyDown={(e: any) => {
                                    if (e.key === "Enter") save();
                                    if (e.key === "Escape") cancel();
                                }}
                            />
                            {isSensitive && (
                                <span
                                    style={{
                                        position: "absolute" as const,
                                        right: "8px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        color: "var(--text-muted)",
                                        userSelect: "none" as const,
                                    }}
                                    onClick={() => setRevealed(v => !v)}
                                >
                                    {revealed ? "Hide" : "Show"}
                                </span>
                            )}
                        </div>
                    )}

                    {err && <div style={{ ...s.muted, color: C.danger, fontSize: "10px", marginTop: "3px" }}>{err}</div>}

                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                        <span
                            style={{
                                flex: 1,
                                textAlign: "center" as const,
                                padding: "5px",
                                backgroundColor: saving ? "var(--background-modifier-accent)" : "var(--brand-experiment)",
                                color: "white",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: saving ? "default" : "pointer",
                                opacity: saving ? 0.7 : 1,
                            }}
                            onClick={saving ? undefined : save}
                        >
                            {saving ? "Saving..." : "Save"}
                        </span>
                        <span
                            style={{
                                padding: "5px 10px",
                                color: "var(--text-muted)",
                                fontSize: "12px",
                                cursor: "pointer",
                                borderRadius: "4px",
                            }}
                            onClick={cancel}
                        >
                            Cancel
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// -- Main panel ---------------------------------------------------------------

export function RuntimeConfigPanel() {
    const [cfg,     setCfg]     = React.useState<Record<string, string> | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error,   setError]   = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getRuntimeConfig();
            setCfg(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { load(); }, []);

    const handleSave = React.useCallback(async (key: string, value: string) => {
        await api.updateRuntimeConfig(key, value);
        const fresh = await api.getRuntimeConfig();
        setCfg(fresh);
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return (
        <div style={s.error}>
            Failed to load runtime config: {error}
            <span style={{ ...s.linkButton, marginLeft: "8px" }} onClick={load}>Retry</span>
        </div>
    );
    if (!cfg) return null;

    return (
        <div style={s.col}>
            <div style={{ ...s.muted, marginBottom: "8px" }}>
                Live configuration - changes take effect immediately without restarting the selfbot.
            </div>
            {CONFIG_GROUPS.map(group => (
                <div key={group.title} style={{ ...s.card, borderLeft: "3px solid var(--brand-experiment)" }}>
                    <div style={s.subheading}>{group.title}</div>
                    {group.fields.map(field => (
                        <ConfigRow
                            key={field.key}
                            fieldKey={field.key}
                            field={field}
                            currentValue={cfg[field.key] ?? ""}
                            onSave={handleSave}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
