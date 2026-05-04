import { React } from "@webpack/common";
import { api } from "../../api/client";
import { s } from "../../styles";

interface ConnectionStatusProps {
    opsecMode?: boolean;
    disguiseName?: string;
}

export function ConnectionStatus({ opsecMode = false, disguiseName = "Discord Utilities" }: ConnectionStatusProps) {
    const [status, setStatus] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const check = async () => {
            try {
                const data = await api.getStatus();
                setStatus(data);
                setError(null);
            } catch (err: any) {
                setStatus(null);
                setError(err.message);
            }
        };
        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    const connectedLabel = opsecMode ? "Service connected" : "Connected to Sentinel";
    const failedLabel    = opsecMode ? "Service unavailable" : "Connection failed";
    const checkingLabel  = "Checking...";

    return (
        <div style={s.topBar}>
            <div style={s.row}>
                <span style={s.statusDot(status ? "#43b581" : "#f04747")} />
                <span style={{ fontSize: "13px" }}>
                    {status ? connectedLabel : error ? failedLabel : checkingLabel}
                </span>
            </div>
            {status && (
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {status.uptimeFormatted} uptime | {status.eventCount} events | {status.dbSizeMB}MB
                </div>
            )}
        </div>
    );
}
