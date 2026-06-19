export function Progress({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-reelflow-border"
    >
      <div
        className="h-full bg-reelflow-accent transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
