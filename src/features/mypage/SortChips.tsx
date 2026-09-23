export type SortKey = 'all' | 'oldest' | 'high' | 'low';

// 그림의 5개 중 「전체」 와 「최근순」 이 같은 순서라 하나로 (대조표 3/4 안 11)
const SORTS: [SortKey, string][] = [
  ['all', '전체'],
  ['oldest', '오래된 순'],
  ['high', '높은 평점순'],
  ['low', '낮은 평점순'],
];

/** 12 · 16장 정렬 칩 */
export function SortChips({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <div className="flex gap-2">
      {SORTS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`h-10 rounded-xl border px-5 text-[0.9375rem] font-semibold transition-colors ${
            value === key ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white text-ink hover:bg-field'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
