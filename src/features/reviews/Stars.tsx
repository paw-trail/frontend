import { Star } from 'lucide-react';

/** 별 다섯 — 채운 별을 점수 비율만큼 덮어 소수점도 보인다 */
export function Stars({ value, size = 'size-5' }: { value: number; size?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (filled: boolean) =>
    [0, 1, 2, 3, 4].map((i) => (
      <Star key={i} className={`${size} shrink-0 ${filled ? 'fill-current' : ''}`} strokeWidth={1.6} aria-hidden />
    ));
  return (
    <span className="relative inline-flex text-[#e2b33c]" role="img" aria-label={`5점 만점에 ${value.toFixed(1)}점`}>
      <span className="flex gap-0.5">{row(false)}</span>
      <span className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden" style={{ width: `${pct}%` }}>
        {row(true)}
      </span>
    </span>
  );
}
