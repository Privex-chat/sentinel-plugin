import { React } from "@webpack/common";

export function LoadingSpinner({ size = 32 }: { size?: number }) {
    return (
        <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            padding: "20px",
        }}>
            <div style={{
                width: size, height: size,
                border: "3px solid var(--background-modifier-accent)",
                borderTop: "3px solid var(--brand-experiment)",
                borderRadius: "50%",
                animation: "sentinel-spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes sentinel-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
