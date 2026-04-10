import { React } from "@webpack/common";
import { SleepScheduleView } from "./SleepSchedule";
import { RoutineView } from "./RoutineView";
import { AnomalyFeed } from "./AnomalyFeed";
import { s } from "../../styles";

interface InsightsPanelProps {
    userId: string;
}

export function InsightsPanel({ userId }: InsightsPanelProps) {
    const [subView, setSubView] = React.useState<"overview" | "sleep" | "routine" | "anomalies">("overview");

    const tabs = [
        { id: "overview" as const, label: "Overview" },
        { id: "sleep" as const, label: "Sleep" },
        { id: "routine" as const, label: "Routine" },
        { id: "anomalies" as const, label: "Anomalies" },
    ];

    return (
        <div>
            <div style={s.tabBar}>
                {tabs.map(t => (
                    <div key={t.id} style={s.tab(subView === t.id)} onClick={() => setSubView(t.id)}>
                        {t.label}
                    </div>
                ))}
            </div>

            {subView === "overview" && (
                <div style={s.col}>
                    <SleepScheduleView userId={userId} compact />
                    <AnomalyFeed userId={userId} limit={5} />
                </div>
            )}
            {subView === "sleep" && <SleepScheduleView userId={userId} />}
            {subView === "routine" && <RoutineView userId={userId} />}
            {subView === "anomalies" && <AnomalyFeed userId={userId} />}
        </div>
    );
}
