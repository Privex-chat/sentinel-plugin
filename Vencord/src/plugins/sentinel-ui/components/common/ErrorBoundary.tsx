import { React } from "@webpack/common";
import { s } from "../../styles";

export function ErrorDisplay({ error, onRetry }: { error: string; onRetry?: () => void }) {
    return (
        <div style={s.error}>
            <div style={{ marginBottom: "8px" }}>Error: {error}</div>
            {onRetry && (
                <span style={s.linkButton} onClick={onRetry}>Retry</span>
            )}
        </div>
    );
}
