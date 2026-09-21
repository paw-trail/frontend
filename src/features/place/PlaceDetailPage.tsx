import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { isApiError } from '@/api/client';
import { placesApi } from '@/api/places';
import { PlaceImage } from '@/components/place/PlaceImage';
import { VerdictBadge } from '@/components/place/VerdictBadge';
import { Button } from '@/components/ui/Button';
import { useBasis } from '@/features/basis/BasisProvider';
import { ReviewSection } from '@/features/reviews/ReviewSection';
import { useStoredReviews } from '@/features/reviews/reviewStore';
import { formatPhone } from '@/lib/format';
import { DocumentsModal } from './DocumentsModal';
import { FacilitySection } from './FacilitySection';
import { ItineraryCard } from './ItineraryCard';
import { MapCard } from './MapCard';
import { ReportModal } from './ReportModal';
import { RulesSection } from './RulesSection';
import { useRecordView } from './useRecordView';

type Tab = 'facility' | 'rules' | 'reviews';

const scrollTo = (id: Tab) => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};

/** 명세서 8장 장소 상세 */
export function PlaceDetailPage() {
  const { placeId = '' } = useParams();
  const navigate = useNavigate();
  const basis = useBasis();
  const [tab, setTab] = useState<Tab>('facility');
  const [docsOpen, setDocsOpen] = useState(false);
  const [report, setReport] = useState<null | { review?: { reviewId: string; author: string } }>(null);
  const [photoFailed, setPhotoFailed] = useState(false);

  const place = useQuery({ queryKey: ['place', placeId], queryFn: () => placesApi.detail(placeId), staleTime: 60_000 });
  const verdict = useQuery({
    queryKey: ['placeVerdict', placeId, basis.petIds],
    queryFn: () => placesApi.verdict(placeId, basis.petIds),
    enabled: place.isSuccess && basis.petIds.length > 0,
    staleTime: 60_000,
  });
  const conflicts = useQuery({
    queryKey: ['placeConflicts', placeId],
    queryFn: () => placesApi.conflicts(placeId),
    enabled: verdict.data?.hasConflict === true,
    staleTime: 5 * 60_000,
  });
  const reviewCount = useStoredReviews().filter((r) => r.placeId === placeId).length;
  useRecordView(place.isSuccess ? placeId : undefined);

  // 후기를 쓰고 돌아오면 후기 구역으로 (9장 → /places/{id}#reviews)
  const { hash } = useLocation();
  useEffect(() => {
    if (place.isSuccess && hash === '#reviews') {
      setTab('reviews');
      window.setTimeout(() => scrollTo('reviews'), 50);
    }
  }, [place.isSuccess, hash]);

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  if (place.isPending) {
    return (
      <main className="px-16 pb-16 pt-4">
        <div className="mt-8 h-[17.8rem] animate-pulse rounded-2xl bg-[#efe9dd]" />
        <div className="mt-8 h-10 w-1/3 animate-pulse rounded bg-[#efe9dd]" />
      </main>
    );
  }
  if (place.isError) {
    const missing = isApiError(place.error, 'PLACE_NOT_FOUND');
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-16 text-center">
        <p className="text-[1.25rem] font-bold text-ink">{missing ? '찾을 수 없는 장소입니다' : '장소 정보를 불러오지 못했습니다'}</p>
        <p className="text-[0.9375rem] text-sub">{missing ? '사라졌거나 다른 장소와 합쳐졌을 수 있습니다.' : '잠시 후 다시 시도해 주세요.'}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goBack}>
            돌아가기
          </Button>
          {!missing && <Button onClick={() => void place.refetch()}>다시 불러오기</Button>}
        </div>
      </main>
    );
  }

  const p = place.data;
  const selected = basis.selected;
  const tabs: [Tab, string][] = [
    ['facility', '시설 안내'],
    ['rules', '규정'],
    ['reviews', `방문 후기(${reviewCount}개)`],
  ];

  return (
    <main className="px-16 pb-16 pt-4">
      <button type="button" onClick={goBack} className="flex items-center gap-0.5 text-[0.875rem] text-sub hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden />
        돌아가기
      </button>

      <div className="relative mt-3 h-[17.8rem] overflow-hidden rounded-2xl">
        <PlaceImage src={p.imageUrl} placeType={p.placeType} alt={p.name} className="size-full" onPhotoError={() => setPhotoFailed(true)} />
        {p.imageUrl && !photoFailed && (
          <span className="absolute bottom-3 right-4 rounded-full bg-black/30 px-3 py-1 text-[0.75rem] text-white/90 backdrop-blur-sm">
            사진 출처: ⓒ한국관광공사
          </span>
        )}
        {p.status === 'CLOSED' && (
          <p className="absolute inset-x-0 top-0 bg-no/90 px-5 py-2.5 text-[0.9375rem] font-semibold text-white">폐업으로 확인된 장소입니다</p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)_26.25rem] items-start gap-[1.375rem]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[1.875rem] font-bold tracking-[-0.02em] text-ink">{p.name}</h1>
              <p className="mt-1 text-[1rem] text-sub">{[p.address, p.tel && formatPhone(p.tel)].filter(Boolean).join(' · ')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {selected.length === 0 ? (
                  <span className="text-[0.8125rem] text-faint">반려동물을 등록하면 동반 가능 여부가 보입니다</span>
                ) : verdict.isPending ? (
                  <span className="h-7 w-32 animate-pulse rounded-md bg-[#efe9dd]" />
                ) : (
                  verdict.data && (
                    <>
                      {selected.map((pet) => {
                        const v = verdict.data.verdicts.find((x) => x.petId === pet.petId);
                        return v ? <VerdictBadge key={pet.petId} verdict={v.verdict} prefix={pet.name} size="md" /> : null;
                      })}
                      {verdict.data.requiredItems.map((it) => (
                        <span key={it} className="inline-flex h-7 items-center rounded-md bg-brand-soft px-2.5 text-[0.8125rem] font-semibold text-brand-strong">
                          {it}
                        </span>
                      ))}
                      {verdict.data.hasConflict && (
                        <button
                          type="button"
                          onClick={() => {
                            setTab('rules');
                            scrollTo('rules');
                          }}
                          className="inline-flex h-7 items-center rounded-md bg-cond-soft px-2.5 text-[0.8125rem] font-semibold text-cond"
                        >
                          출처끼리 다른 정보가 있어요
                        </button>
                      )}
                    </>
                  )
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReport({})}
              className="h-8 shrink-0 rounded-full border border-line bg-white px-3.5 text-[0.8125rem] text-sub hover:text-ink"
            >
              정보가 틀렸어요
            </button>
          </div>

          <nav aria-label="상세 구역" className="mt-7 flex gap-8 border-b border-line">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-current={tab === id ? 'true' : undefined}
                onClick={() => {
                  setTab(id);
                  scrollTo(id);
                }}
                className={`-mb-px border-b-2 pb-3 text-[1.25rem] transition-colors ${
                  tab === id ? 'border-ink font-bold text-ink' : 'border-transparent text-sub hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-6">
            <FacilitySection place={p} verdict={verdict.data} verdictStatus={verdict.status} pets={selected} onOpenDocuments={() => setDocsOpen(true)} />
          </div>
          <RulesSection verdict={verdict.data} pets={selected} conflicts={conflicts.data} conflictsStatus={conflicts.status} />
          <ReviewSection placeId={p.placeId} onReport={(review) => setReport({ review })} />
        </div>

        <aside className="sticky top-[6rem] space-y-5">
          <ItineraryCard placeId={p.placeId} pets={basis.pets} initialPetId={selected[0]?.petId ?? null} />
          <MapCard place={p} />
        </aside>
      </div>

      {docsOpen && <DocumentsModal placeId={p.placeId} onClose={() => setDocsOpen(false)} />}
      {report && (
        <ReportModal
          placeId={p.placeId}
          reasons={verdict.data?.verdicts[0]?.reasons ?? []}
          review={report.review}
          onClose={() => setReport(null)}
        />
      )}
    </main>
  );
}
