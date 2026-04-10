import { settings } from "../index";

type SSECallback = (event: any) => void;

let abortController: AbortController | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let listeners: Set<SSECallback> = new Set();
let connected = false;

export function connectSSE(targetFilter?: string): void {
    disconnectSSE();

    const baseUrl = settings.store.sentinelUrl || "http://localhost:48923";
    const token = settings.store.sentinelToken;
    const params = new URLSearchParams();
    if (targetFilter) params.set("targetId", targetFilter);

    // EventSource doesn't support custom headers, so we use fetch-based SSE
    const url = `${baseUrl}/api/events/stream?${params.toString()}`;

    startSSE(url, token);
}

async function startSSE(url: string, token: string): Promise<void> {
    try {
        abortController = new AbortController();

        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` },
            signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
            throw new Error(`SSE connection failed: ${response.status}`);
        }

        connected = true;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        for (const listener of listeners) {
                            listener(data);
                        }
                    } catch (e) {
                        console.warn("[Sentinel SSE] Failed to parse event:", line);
                    }
                }
            }
        }

        connected = false;
    } catch (err: any) {
        connected = false;
        if (err.name === "AbortError") return; // Intentional disconnect
        console.error("[Sentinel SSE] Connection error:", err);
        // Auto-reconnect after 5 seconds
        reconnectTimeout = setTimeout(() => {
            if (listeners.size > 0) {
                startSSE(url, token);
            }
        }, 5000);
    }
}

export function disconnectSSE(): void {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    connected = false;
}

export function addSSEListener(callback: SSECallback): () => void {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
        if (listeners.size === 0) {
            disconnectSSE();
        }
    };
}

export function isSSEConnected(): boolean {
    return connected;
}
