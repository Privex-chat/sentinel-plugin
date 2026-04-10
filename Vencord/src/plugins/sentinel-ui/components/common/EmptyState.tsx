import { React } from "@webpack/common";
import { s } from "../../styles";

export function EmptyState({ message }: { message: string }) {
    return <div style={s.empty}>{message}</div>;
}
