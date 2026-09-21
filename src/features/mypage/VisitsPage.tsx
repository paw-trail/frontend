import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, PawPrint, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { commonMessage, isApiError } from '@/api/client';
import { qk } from '@/api/keys';
import type { VisitCard } from '@/api/types';
import { visitsApi } from '@/api/visits';
import { VerdictBadge } from '@/components/place/VerdictBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useRatingAverages } from '@/features/reviews/reviewStore';
import { SortChips, type SortKey } from './SortChips';

type Group = { date: string; visits: VisitCard[]; summary: string | null; avg: number | null };

const SUMMARY_ERRORS: Record<string, string> = {
  SUMMARY_COOLDOWN: '조금 전에 만들었어요. 1분 뒤에 다시 눌러 주세요.',
  SUMMARY_DAILY_LIMIT: '오늘 만들 수 있는 요약을 모두 만들었어요. 내일 다시 눌러 주세요.',
  SUMMARY_GENERATION_FAILED: '요약을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
};

// 그날 요약은 하루 한 카드에만 실려 온다 — 날짜로 묶은 뒤 실린 카드에서 꺼낸다 (대조표 3/4 4-1)
function groupByDate(visits: VisitCard[], ratings: Map<string, number>, sort: SortKey): Group[] {
  const byDate = new Map<string, VisitCard[]>();
  for (const v of visits) {
    const date = v.visitedAt.slice(0, 10);
    byDate.set(date, [...(byDate.get(date) ?? []), v]);
  }
  const groups = [...byDate].map(([date, list]) => {
    const sorted = [...list].sort((a, b) => a.visitedAt.localeCompare(b.visitedAt));
    const rs = sorted.map((v) => ratings.get(v.placeId)).filter((n): n is number => n !== undefined);
    return {
      date,
      visits: sorted,
      summary: sorted.find((v) => v.summary)?.summary ?? null,
      avg: rs.length ? rs.reduce((s, n) => s + n, 0) / rs.length : null,
    };
  });
  const byRating = (dir: 1 | -1) => (a: Group, b: Group) =>
    a.avg === null ? 1 : b.avg === null ? -1 : dir * (a.avg - b.avg) || b.date.localeCompare(a.date);
  return groups.sort(
    sort === 'oldest' ? (a, b) => a.date.localeCompare(b.date)
    : sort === 'high' ? byRating(-1)
    : sort === 'low' ? byRating(1)
    : (a, b) => b.date.localeCompare(a.date),
  );
}

/** 명세서 12장 마이페이지 — 동반 기록 */
export function VisitsPage() {
  const queryClient = useQueryClient();
  const visits = useQuery({ queryKey: ['visits'], queryFn: visitsApi.list, staleTime: 15_000 });
  const ratings = useRatingAverages();
  const [sort, setSort] = useState<SortKey>('all');
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<VisitCard | null>(null);
  const [notice, setNotice] = useState<{ date: string; text: string } | null>(null);

  const groups = useMemo(() => groupByDate(visits.data ?? [], ratings, sort), [visits.data, ratings, sort]);

  const summarize = useMutation({
    mutationFn: (date: string) => visitsApi.summarize(date),
    onMutate: () => setNotice(null),
    onSuccess: (res) => {
      // 새 요약을 그날 첫 카드에 붙여 바로 보이게 한다
      queryClient.setQueryData<VisitCard[]>(['visits'], (old) => {
        if (!old) return old;
        let placed = false;
        return old.map((v) => {
          if (v.visitedAt.slice(0, 10) !== res.visitDate) return v;
          if (!placed) {
            placed = true;
            return { ...v, summary: res.summary };
          }
          return { ...v, summary: null };
        });
      });
    },
    onError: (e, date) =>
      setNotice({ date, text: (isApiError(e) && SUMMARY_ERRORS[e.code]) || commonMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: (visitId: string) => visitsApi.remove(visitId),
    onSuccess: () => {
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ['visits'] });
      void queryClient.invalidateQueries({ queryKey: qk.profile });
    },
  });

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">동반 기록</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">우리가 함께한 추억들이에요.</p>
      <div className="mt-5">
        <SortChips value={sort} onChange={setSort} />
      </div>

      <div className="mt-5 space-y-4">
        {visits.isPending ? (
          [0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#efe9dd]" />)
        ) : visits.isError ? (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-6 py-8">
            <p className="text-[0.9375rem] text-sub">동반 기록을 불러오지 못했습니다.</p>
            <Button variant="outline" onClick={() => void visits.refetch()}>
              다시 불러오기
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 shadow-card">
            <span className="grid size-16 place-items-center rounded-full bg-[#eef1ec]">
              <PawPrint className="size-7 text-brand-strong" aria-hidden />
            </span>
            <p className="mt-4 text-[1.125rem] font-bold text-ink">아직 여행을 떠나지 않았어요</p>
            <p className="mt-1 text-[0.875rem] text-sub">일정에서 [다녀왔어요] 를 누르면 여기에 쌓입니다.</p>
          </div>
        ) : (
          groups.map((g, i) => {
            const open = toggled[g.date] ?? i === 0;
            const pending = summarize.isPending && summarize.variables === g.date;
            return (
              <article key={g.date} className="rounded-2xl bg-white shadow-card">
                <header className="flex items-start justify-between gap-4 px-6 py-5">
                  <div className="min-w-0">
                    <h2 className="truncate text-[1.125rem] font-bold text-ink">
                      {g.date.replace(/-/g, '.')} ({g.visits[0].name})
                    </h2>
                    <p className={`mt-1 text-[0.875rem] leading-relaxed ${g.summary ? 'text-ink' : 'text-faint'}`}>
                      {g.summary ?? '아직 요약이 없어요. 버튼을 누르면 그날 기록을 한 줄로 정리합니다.'}
                    </p>
                    {notice?.date === g.date && <p className="mt-1 text-[0.8125rem] text-alert">{notice.text}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => summarize.mutate(g.date)}
                      className="h-8 rounded-full border border-line bg-white px-3.5 text-[0.8125rem] font-semibold text-ink hover:bg-field disabled:text-faint"
                    >
                      {pending ? '요약하는 중' : g.summary ? '갱신하기' : 'AI 요약하기'}
                    </button>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-label={open ? '접기' : '펼치기'}
                      onClick={() => setToggled((t) => ({ ...t, [g.date]: !open }))}
                      className="grid size-8 place-items-center rounded-full text-sub hover:bg-field"
                    >
                      <ChevronDown className={`size-5 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </header>
                {open && (
                  <ul className="space-y-2 border-t border-line px-6 py-4">
                    {g.visits.map((v) => {
                      const rating = ratings.get(v.placeId);
                      return (
                        <li key={v.visitId} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                          <Link to={`/places/${v.placeId}`} className="min-w-0 truncate text-[1rem] font-semibold text-ink hover:underline">
                            {v.name}({v.visitedAt.slice(11, 16)})
                          </Link>
                          <div className="flex shrink-0 items-center gap-3">
                            {rating !== undefined && (
                              <span className="flex items-center gap-1 text-[0.9375rem] font-semibold text-ink">
                                <Star className="size-4 text-[#e2b33c]" aria-hidden />
                                {rating.toFixed(1)}
                              </span>
                            )}
                            {v.verdictAtVisit && <VerdictBadge verdict={v.verdictAtVisit} />}
                            <button
                              type="button"
                              onClick={() => setDeleting(v)}
                              className="h-7 rounded-full border border-[#f0d6d3] px-2.5 text-[0.75rem] font-semibold text-alert hover:bg-alert-soft"
                            >
                              삭제
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            );
          })
        )}
      </div>

      {deleting && (
        <Modal
          title="동반 기록을 지울까요?"
          onClose={() => setDeleting(null)}
          actions={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>
                취소
              </Button>
              <Button variant="strong" disabled={remove.isPending} onClick={() => remove.mutate(deleting.visitId)}>
                지우기
              </Button>
            </>
          }
        >
          {deleting.visitedAt.slice(0, 10).replace(/-/g, '.')} · {deleting.name}
          {remove.isError && <p className="mt-2 text-alert">{commonMessage(remove.error)}</p>}
        </Modal>
      )}
    </section>
  );
}
