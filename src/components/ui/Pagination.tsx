/** 페이지 번호 — 검색 결과처럼 쪽으로 나뉜 목록에 쓴다 */
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  // 현재 쪽을 가운데 두고 최대 7개만 보인다
  const window = 7;
  const start = Math.max(1, Math.min(page - Math.floor(window / 2), totalPages - window + 1));
  const numbers = Array.from({ length: Math.min(window, totalPages) }, (_, i) => start + i);

  const box = 'grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-[0.875rem] font-semibold transition-colors';

  return (
    <nav aria-label="쪽 이동" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${box} border border-line text-sub hover:bg-field disabled:opacity-40 disabled:hover:bg-transparent`}
      >
        이전
      </button>

      {start > 1 && <span className="px-1 text-faint">…</span>}

      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
          className={`${box} ${n === page ? 'bg-brand text-white' : 'border border-line text-ink hover:bg-field'}`}
        >
          {n}
        </button>
      ))}

      {start + numbers.length - 1 < totalPages && <span className="px-1 text-faint">…</span>}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={`${box} border border-line text-sub hover:bg-field disabled:opacity-40 disabled:hover:bg-transparent`}
      >
        다음
      </button>
    </nav>
  );
}
