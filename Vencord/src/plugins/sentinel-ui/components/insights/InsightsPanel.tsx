import { React } from "@webpack/common";
import { SleepScheduleView } from "./SleepSchedule";
import { RoutineView } from "./RoutineView";
import { AnomalyFeed } from "./AnomalyFeed";
import { CorrelationsView } from "./CorrelationsView";
import { s } from "../../styles";

interface InsightsPanelProps {
    userId: string;
}

type InsightsTab = "overview" | "sleep" | "routine" | "anomalies" | "correlations";

export function InsightsPanel({ userId }: InsightsPanelProps) {
    const [subView, setSubView] = React.useState<InsightsTab>("overview");

    const tabs: { id: InsightsTab; label: string }[] = [
        { id: "overview",      label: "Overview" },
        { id: "sleep",         label: "Sleep" },
        { id: "routine",       label: "Routine" },
        { id: "anomalies",     label: "Anomalies" },
        { id: "correlations",  label: "Correlations" },
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
            {subView === "sleep"        && <SleepScheduleView userId={userId} />}
            {subView === "routine"      && <RoutineView userId={userId} />}
            {subView === "anomalies"    && <AnomalyFeed userId={userId} />}
            {subView === "correlations" && <CorrelationsView userId={userId} />}
        </div>
    );
}
