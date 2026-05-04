import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { EmptyState } from "../common/EmptyState";
import { s } from "../../styles";

interface TargetConfigProps {
    userId: string;
}

interface ConfigState {
    social_weight_messages: number;
    social_weight_reactions: number;
    social_weight_voice_hours: number;
    social_weight_mentions: number;
    anomaly_z_threshold: number;
}

const SOCIAL_FIELDS: { key: keyof ConfigState; label: string; desc: string; min: number; max: number; step: number }[] = [
    { key: "social_weight_messages",    label: "Message Weight",      desc: "Score multiplier per message interaction (default 3.0)",            min: 0, max: 20, step: 0.5 },
    { key: "social_weight_reactions",   label: "Reaction Weight",     desc: "Score multiplier per reaction interaction (default 1.0)",           min: 0, max: 20, step: 0.5 },
    { key: "social_weight_voice_hours", label: "Voice Hours Weight",  desc: "Score multiplier per hour of shared voice time (default 5.0)",      min: 0, max: 20, step: 0.5 },
    { key: "social_weight_mentions",    label: "Mention Weight",      desc: "Score multiplier per mention interaction (default 2.0)",            min: 0, max: 20, step: 0.5 },
];

function SliderField({
    label,
    desc,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    desc: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div style={{ marginBottom: "12px" }}>
            <div style={{ ...s.row, justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 500 }}>{label}</span>
                <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "var(--brand-experiment)" }}>
                    {value}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e: any) => onChange(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--brand-experiment)" }}
            />
            <div style={{ ...s.muted, fontSize: "10px", marginTop: "2px" }}>{desc}</div>
        </div>
    );
}

export function TargetConfigView({ userId }: TargetConfigProps) {
    const { data, loading, error, refetch } = useApi(
        () => api.getTargetConfig(userId),
        [userId]
    );

    const [weights, setWeights] = React.useState<ConfigState | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const [saveError, setSaveError] = React.useState<string | null>(null);

    // Sync local state when data arrives
    React.useEffect(() => {
        if (data) {
            setWeights({
                social_weight_messages:    data.social_weight_messages,
                social_weight_reactions:   data.social_weight_reactions,
                social_weight_voice_hours: data.social_weight_voice_hours,
                social_weight_mentions:    data.social_weight_mentions,
                anomaly_z_threshold:       data.anomaly_z_threshold,
            });
        }
    }, [data]);

    const handleSave = async () => {
        if (!weights) return;
        setSaving(true);
        setSaveError(null);
        try {
            await api.updateTargetConfig(userId, weights);
            await refetch();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e: any) {
            setSaveError(e.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div style={s.error}>Error: {error}</div>;
    if (!weights) return <EmptyState message="No config data available" />;

    return (
        <div style={s.col}>
            {/* Social weights */}
            <div style={{ ...s.card, borderLeft: "3px solid #5865f2" }}>
                <div style={s.subheading}>Social Graph Weights</div>
                <div style={{ ...s.muted, marginBottom: "12px" }}>
                    Adjust how interaction types contribute to relationship score.
                    Higher weight = stronger influence on relationship rank.
                </div>
                {SOCIAL_FIELDS.map(f => (
                    <SliderField
                        key={f.key}
                        label={f.label}
                        desc={f.desc}
                        value={weights[f.key]}
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        onChange={v => setWeights(prev => prev ? { ...prev, [f.key]: v } : prev)}
                    />
                ))}
            </div>

            {/* Anomaly threshold */}
            <div style={{ ...s.card, borderLeft: "3px solid #faa61a" }}>
                <div style={s.subheading}>Anomaly Detection</div>
                <div style={{ ...s.muted, marginBottom: "12px" }}>
                    Lower z-threshold = more anomalies flagged. Higher = only extreme deviations.
                </div>
                <SliderField
                    label="Z-Score Threshold"
                    desc="Standard deviations from baseline required to flag an anomaly (default 2.0)"
                    value={weights.anomaly_z_threshold}
                    min={0.5}
                    max={5}
                    step={0.25}
                    onChange={v => setWeights(prev => prev ? { ...prev, anomaly_z_threshold: v } : prev)}
                />
            </div>

            {/* Save button */}
            <span
                style={{
                    ...s.linkButton,
                    display: "block",
                    textAlign: "center" as const,
                    padding: "10px",
                    backgroundColor: saved ? "#43b581" : saving ? "var(--background-modifier-accent)" : "var(--brand-experiment)",
                    color: "white",
                    borderRadius: "6px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: saving ? "default" : "pointer",
                    opacity: saving ? 0.7 : 1,
                }}
                onClick={saving ? undefined : handleSave}
            >
                {saved ? "✓ Saved" : saving ? "Saving…" : "Save Configuration"}
            </span>

            {saveError && <div style={s.error}>{saveError}</div>}
        </div>
    );
}
