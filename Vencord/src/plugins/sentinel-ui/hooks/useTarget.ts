import { React } from "@webpack/common";
import { api } from "../api/client";
import { useApi } from "./useApi";

export function useTargetStatus(userId: string | null) {
    return useApi(
        () => userId ? api.getTargetStatus(userId) : Promise.resolve(null),
        [userId],
        !!userId
    );
}

export function useTargetTimeline(userId: string | null, params?: Record<string, string>) {
    return useApi(
        () => userId ? api.getTimeline(userId, params) : Promise.resolve(null),
        [userId, JSON.stringify(params)],
        !!userId
    );
}
