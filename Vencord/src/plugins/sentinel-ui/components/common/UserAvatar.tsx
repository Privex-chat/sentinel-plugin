import { React, UserStore } from "@webpack/common";
import { s } from "../../styles";

export function UserAvatar({ userId, size = 32 }: { userId: string; size?: number }) {
    const user = userId ? UserStore.getUser(userId) : null;

    let url: string;
    if (user?.avatar) {
        const ext = user.avatar.startsWith("a_") ? "gif" : "png";
        url = `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.${ext}?size=${size * 2}`;
    } else if (userId && /^\d{17,20}$/.test(userId)) {
        // Guard: only call BigInt when userId is a valid snowflake string.
        // An undefined or non-numeric userId would throw "Cannot convert
        // undefined to a BigInt" which crashes the entire plugin panel.
        try {
            const index = Number((BigInt(userId) >> 22n) % 6n);
            url = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
        } catch {
            url = "https://cdn.discordapp.com/embed/avatars/0.png";
        }
    } else {
        url = "https://cdn.discordapp.com/embed/avatars/0.png";
    }

    return <img src={url} style={s.avatar(size)} alt="" />;
}

export function getDisplayName(userId: string): string {
    if (!userId) return "Unknown";
    const user = UserStore.getUser(userId);
    if (!user) return userId;
    return (user as any).globalName ?? user.username ?? userId;
}