import { React } from "@webpack/common";

interface SparkLineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
}

export function SparkLine({ data, width = 60, height = 20, color = "#43b581" }: SparkLineProps) {
    if (data.length < 2) return null;

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width={width} height={height} style={{ display: "inline-block", verticalAlign: "middle" }}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}
