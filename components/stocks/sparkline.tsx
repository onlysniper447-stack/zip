import { cn } from "@/lib/utils";

export function Sparkline({
  points,
  up,
  className,
  height = 56,
}: {
  points: number[];
  up: boolean;
  className?: string;
  height?: number;
}) {
  const width = 280;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height - ((point - min) / span) * (height - 4) - 2;
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const color = up ? "#FBBF24" : "#F87171";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("w-full", className)} aria-hidden>
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
