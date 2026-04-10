import { React } from "@webpack/common";
import { connectSSE, addSSEListener, disconnectSSE } from "../api/sse";
import { settings } from "../index";

export function useSSE(targetFilter?: string): any[] {
    const [events, setEvents] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (!settings.store.enableSSE) return;

        connectSSE(targetFilter);

        const removeListener = addSSEListener((event) => {
            setEvents(prev => [event, ...prev].slice(0, 200));
        });

        return () => {
            removeListener();
        };
    }, [targetFilter]);

    return events;
}
