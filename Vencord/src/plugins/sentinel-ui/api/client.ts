import { settings } from "../index";

interface CacheEntry {
    data: any;
    expiresAt: number;
}

const cache: Map<string, CacheEntry> = new Map();
const pendingRequests: Map<string, Promise<any>> = new Map();

/**
 * Only include Content-Type: application/json when the request actually has a
 * body. Fastify rejects requests that declare this header but send an empty
 * body (HTTP 400 FST_ERR_CTP_EMPTY_JSON_BODY). DELETE and bodyless PATCH
 * requests must not set this header.
 */
function getHeaders(hasBody = false): Record<string, string> {
    const headers: Record<string, string> = {
        "Authorization": `Bearer ${settings.store.sentinelToken}`,
    };
    if (hasBody) {
        headers["Content-Type"] = "application/json";
    }
    return headers;
}

function getBaseUrl(): string {
    return settings.store.sentinelUrl || "http://localhost:48923";
}

async function request<T>(path: string, options: RequestInit = {}, cacheTtl: number = 0): Promise<T> {
    const url = `${getBaseUrl()}${path}`;
    const cacheKey = `${options.method || "GET"}:${url}`;
    const hasBody = options.body != null;

    // Check cache
    if (cacheTtl > 0 && options.method !== "POST" && options.method !== "DELETE" && options.method !== "PATCH") {
        const cached = cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data as T;
        }
    }

    // Deduplicate in-flight requests
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey) as Promise<T>;
    }

    const promise = (async () => {
        try {
            const res = await fetch(url, {
                ...options,
                headers: { ...getHeaders(hasBody), ...options.headers },
            });

            if (!res.ok) {
                const body = await res.text();
                throw new Error(`API error ${res.status}: ${body}`);
            }

            const text = await res.text();
            let data: T;
            try {
                data = JSON.parse(text) as T;
            } catch {
                throw new Error(`API returned invalid JSON: ${text.slice(0, 200)}`);
            }

            if (cacheTtl > 0) {
                cache.set(cacheKey, { data, expiresAt: Date.now() + cacheTtl });
            }

            return data as T;
        } finally {
            pendingRequests.delete(cacheKey);
        }
    })();

    pendingRequests.set(cacheKey, promise);
    return promise;
}

// Target management
export const api = {
    // Status
    getStatus: () => request<any>("/api/status", {}, 10000),

    // Targets
    getTargets: () => request<any[]>("/api/targets", {}, 5000),
    addTarget: (userId: string, label?: string, notes?: string, priority?: number) =>
        request<any>("/api/targets", {
            method: "POST",
            body: JSON.stringify({ userId, label, notes, priority }),
        }),
    removeTarget: (userId: string) =>
        request<any>(`/api/targets/${userId}`, { method: "DELETE" }),
    updateTarget: (userId: string, data: { label?: string; notes?: string; priority?: number; active?: boolean }) =>
        request<any>(`/api/targets/${userId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // Target status
    getTargetStatus: (userId: string) =>
        request<any>(`/api/targets/${userId}/status`, {}, 5000),

    // Events
    getEvents: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<any[]>(`/api/events${qs}`, {}, 5000);
    },

    // Timeline
    getTimeline: (userId: string, params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<any>(`/api/targets/${userId}/timeline${qs}`, {}, 10000);
    },
    getTimelineDay: (userId: string, date: string) =>
        request<any>(`/api/targets/${userId}/timeline/day/${date}`, {}, 30000),

    // Analytics
    getPresenceAnalytics: (userId: string, days?: number) =>
        request<any>(`/api/targets/${userId}/analytics/presence?days=${days || 30}`, {}, 60000),
    getActivityAnalytics: (userId: string, days?: number) =>
        request<any>(`/api/targets/${userId}/analytics/activities?days=${days || 90}`, {}, 60000),
    getMessageAnalytics: (userId: string, days?: number) =>
        request<any>(`/api/targets/${userId}/analytics/messages?days=${days || 30}`, {}, 60000),
    getVoiceAnalytics: (userId: string, days?: number) =>
        request<any>(`/api/targets/${userId}/analytics/voice?days=${days || 30}`, {}, 60000),
    getSocialGraph: (userId: string, days?: number) =>
        request<any>(`/api/targets/${userId}/analytics/social?days=${days || 30}`, {}, 60000),
    getHeatmap: (userId: string) =>
        request<any>(`/api/targets/${userId}/analytics/heatmap`, {}, 60000),
    getDailySummaries: (userId: string, days?: number) =>
        request<any[]>(`/api/targets/${userId}/analytics/daily?days=${days || 30}`, {}, 60000),
    getMusicAnalytics: (userId: string, days?: number) =>
        request<any>(`/api/targets/${userId}/analytics/music?days=${days || 30}`, {}, 60000),
    getTypingAnalytics: (userId: string) =>
        request<any>(`/api/targets/${userId}/analytics/typing`, {}, 30000),

    // Insights
    getInsights: (userId: string) =>
        request<any>(`/api/targets/${userId}/insights`, {}, 60000),
    getSleepSchedule: (userId: string) =>
        request<any>(`/api/targets/${userId}/insights/sleep`, {}, 60000),
    getRoutine: (userId: string) =>
        request<any>(`/api/targets/${userId}/insights/routine`, {}, 60000),
    getAvailability: (userId: string) =>
        request<any>(`/api/targets/${userId}/insights/availability`, {}, 60000),
    getAnomalies: (userId: string) =>
        request<any[]>(`/api/targets/${userId}/insights/anomalies`, {}, 30000),

    // Profile
    getProfileHistory: (userId: string) =>
        request<any[]>(`/api/targets/${userId}/profile/history`, {}, 30000),
    getCurrentProfile: (userId: string) =>
        request<any>(`/api/targets/${userId}/profile/current`, {}, 10000),

    // Messages
    getMessages: (userId: string, params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<any[]>(`/api/targets/${userId}/messages${qs}`, {}, 10000);
    },
    getDeletedMessages: (userId: string) =>
        request<any[]>(`/api/targets/${userId}/messages/deleted`, {}, 10000),
    getEditedMessages: (userId: string) =>
        request<any[]>(`/api/targets/${userId}/messages/edited`, {}, 10000),

    // Alerts
    getAlertRules: () => request<any[]>("/api/alerts/rules", {}, 10000),
    createAlertRule: (data: { targetId?: string; ruleType: string; condition?: any }) =>
        request<any>("/api/alerts/rules", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteAlertRule: (id: number) =>
        request<any>(`/api/alerts/rules/${id}`, { method: "DELETE" }),
    getAlertHistory: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<any[]>(`/api/alerts/history${qs}`, {}, 5000);
    },
    acknowledgeAlert: (id: number) =>
        request<any>(`/api/alerts/history/${id}/ack`, { method: "PATCH" }),

    // Export
    exportData: (userId: string) =>
        request<any>(`/api/export/${userId}`),

    // Clear cache
    clearCache: () => cache.clear(),
};