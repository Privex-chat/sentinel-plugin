import { React } from "@webpack/common";
import { addSSEListener, connectSSE, disconnectSSE } from "../api/sse";
import { settings } from "../index";
import { api } from "../api/client";

interface RealtimeState {
    connected: boolean;
    recentEvents: any[];
    cacheVersion: number;
}

export function useRealtime(): RealtimeState {
    const [connected, setConnected] = React.useState(false);
    const [recentEvents, setRecentEvents] = React.useState<any[]>([]);
    const [cacheVersion, setCacheVersion] = React.useState(0);

    React.useEffect(() => {
        if (!settings.store.enableSSE) return;

        connectSSE();
        setConnected(true);

        let cacheTimer: ReturnType<typeof setTimeout> | null = null;

        const removeListener = addSSEListener((event) => {
            setRecentEvents(prev => [event, ...prev].slice(0, 100));

            // Debounce cache clearing to avoid thrashing on rapid events.
            // After clearing, bump cacheVersion so any useApi call that
            // includes cacheVersion in its deps will trigger a fresh fetch.
            if (!cacheTimer) {
                cacheTimer = setTimeout(() => {
                    api.clearCache();
                    setCacheVersion(v => v + 1);
                    cacheTimer = null;
                }, 2000);
            }
        });

        return () => {
            removeListener();
            if (cacheTimer) clearTimeout(cacheTimer);
            setConnected(false);
        };
    }, []);

    return { connected, recentEvents, cacheVersion };
}
