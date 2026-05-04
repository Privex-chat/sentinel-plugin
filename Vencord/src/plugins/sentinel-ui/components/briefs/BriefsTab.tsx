import { React } from "@webpack/common";
import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { EmptyState } from "../common/EmptyState";
import { s, C } from "../../styles";

function fmt(ts: number | string): string {
    return new Date(typeof ts === "number" ? ts : Number(ts)).toLocaleString();
}

interface BriefsTabProps {
    userId: string;
}

export function BriefsTab({ userId }: BriefsTabProps) {
    const { data: briefs, loading, error, refetch } = useApi(
        () => api.getDailyBriefs(userId, 30),
        [userId]
    );

    const [generating, setGenerating] = React.useState(false);
    const [dateInput, setDateInput] = React.useState("");
    const [selectedId, setSelectedId] = React.useState<number | null>(null);
    const [genError, setGenError] = React.useState<string | null>(null);

    const today = new Date().toISOString().split("T")[0];

    const handleGenerate = async (date?: string) => {
        setGenerating(true);
        setGenError(null);
        try {
            await api.generateBrief(userId, date || undefined);
            await refetch();
        } catch (e: any) {
            setGenError(e.message || "Failed to generate brief");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return (
        <div style={s.error}>Error loading briefs: {error}</div>
    );

    const selected = (briefs || []).find((b: any) => b.id === selectedId);

    return (
        <div style={s.col}>
            {/* Generate card */}
            <div style={{ ...s.card, borderLeft: "3px solid var(--brand-experiment)" }}>
                <div style={{ ...s.subheading, marginBottom: "8px" }}>Generate Brief</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
                    <input
                        type="date"
                        value={dateInput}
                        max={today}
                        onChange={(e: any) => setDateInput(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: "140px",
                            padding: "6px 10px",
                            backgroundColor: "var(--background-secondary)",
                            border: "1px solid var(--background-modifier-accent)",
                            borderRadius: "4px",
                            color: "var(--text-normal)",
                            fontSize: "13px",
                        }}
                    />
                    <span
                        style={{
                            ...s.linkButton,
                            padding: "6px 14px",
                            backgroundColor: generating ? "var(--background-modifier-accent)" : "var(--brand-experiment)",
                            color: "white",
                            borderRadius: "4px",
                            opacity: generating ? 0.7 : 1,
                            cursor: generating ? "default" : "pointer",
                        }}
                        onClick={generating ? undefined : () => handleGenerate(dateInput || undefined)}
                    >
                        {generating ? "Generating..." : dateInput ? "Generate for Date" : "Generate Today"}
                    </span>
                </div>
                {genError && <div style={{ ...s.muted, color: C.danger, marginTop: "4px" }}>{genError}</div>}
                <div style={{ ...s.muted, marginTop: "4px" }}>
                    Requires AI_PROVIDER configured in your selfbot .env
                </div>
            </div>

            {/* Selected brief expanded */}
            {selected && (
                <div style={{ ...s.card, borderLeft: "3px solid #5865f2" }}>
                    <div style={{ ...s.row, justifyContent: "space-between", marginBottom: "8px" }}>
                        <div>
                            <span style={{ fontWeight: 600, fontSize: "13px" }}>{selected.date}</span>
                            <div style={s.muted}>Generated {fmt(selected.generated_at)}</div>
                        </div>
                        <span
                            style={{ ...s.linkButton, fontSize: "11px" }}
                            onClick={() => setSelectedId(null)}
                        >
                            Close [x]
                        </span>
                    </div>
                    <pre style={{
                        whiteSpace: "pre-wrap" as const,
                        fontFamily: "monospace",
                        fontSize: "12px",
                        lineHeight: "1.6",
                        color: "var(--text-normal)",
                        margin: 0,
                        maxHeight: "400px",
                        overflowY: "auto" as const,
                    }}>
                        {selected.brief_text}
                    </pre>
                </div>
            )}

            {/* Brief list */}
            {(!briefs || briefs.length === 0) ? (
                <EmptyState message="No briefs yet. Generate one above." />
            ) : (
                <div style={s.col}>
                    {(briefs as any[]).map((brief: any) => {
                        const preview = brief.brief_text.slice(0, 160).replace(/\n/g, " ");
                        const isSelected = selectedId === brief.id;
                        return (
                            <div
                                key={brief.id}
                                style={{
                                    ...s.card,
                                    cursor: "pointer",
                                    borderLeft: isSelected ? "3px solid var(--brand-experiment)" : "3px solid transparent",
                                }}
                                onClick={() => setSelectedId(isSelected ? null : brief.id)}
                            >
                                <div style={s.row}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: "13px" }}>{brief.date}</div>
                                        <div style={{ ...s.muted, marginTop: "2px", fontSize: "11px" }}>
                                            {preview}{brief.brief_text.length > 160 ? "..." : ""}
                                        </div>
                                        <div style={{ ...s.muted, marginTop: "2px", fontSize: "10px" }}>
                                            {fmt(brief.generated_at)}
                                        </div>
                                    </div>
                                    <span
                                        style={{ ...s.muted, fontSize: "13px", cursor: "pointer", flexShrink: 0 }}
                                        title="Regenerate"
                                        onClick={(e: any) => {
                                            e.stopPropagation();
                                            handleGenerate(brief.date);
                                        }}
                                    >
                                        [re]
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
