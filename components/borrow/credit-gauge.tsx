export function CreditGauge({ score }: { score: number }) {
  const radius = 58;
  const circ = 2 * Math.PI * radius;
  const progress = Math.min(score, 850) / 850;
  const dash = circ * progress;
  const tone = score >= 740 ? "#FBBF24" : score >= 670 ? "#D97706" : "#F59E0B";

  return (
    <div className="relative mx-auto grid size-40 place-items-center">
      <svg viewBox="0 0 140 140" className="size-40 -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-semibold tabular-nums">{score}</p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Score</p>
      </div>
    </div>
  );
}
