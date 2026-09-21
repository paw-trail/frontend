import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, Lock, Plus, Star, X } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { placesApi } from '@/api/places';
import { PlaceImage } from '@/components/place/PlaceImage';
import { Button } from '@/components/ui/Button';
import { useAuthMe, usePets, useProfile } from '@/features/auth/session';
import { sizeFromWeight } from '@/features/pets/petRules';
import { formatDateWithWeekday, todayIso } from '@/lib/format';
import { REVIEW_PHOTO_MAX, REVIEW_PHOTO_TYPES, shrinkPhoto } from './photos';
import { reviewStore, useStoredReviews } from './reviewStore';
import { REVIEW_TAGS } from './tags';

// 질문 부제는 그림의 자리 채움 문구를 바꾼 것 (대조표 3/4 1-1)
const QUESTIONS = [
  { key: 'facility', title: '시설이 작성된 것과 동일했나요?', sub: '편의시설 · 공간이 안내와 같았는지 알려 주세요' },
  { key: 'rule', title: '규정은 작성된 것과 동일했나요?', sub: '동반 조건 · 준비물 안내가 실제와 같았는지 알려 주세요' },
  { key: 'mood', title: '직원과 장소의 분위기가 생각과 같았나요?', sub: null },
] as const;
type ScoreKey = (typeof QUESTIONS)[number]['key'];

/**
 * 명세서 9장 후기 작성 — 브라우저 저장소에 담는다 (review 서버 없음).
 * ?edit={reviewId} 로 열면 16장의 수정 — 평점 · 글 · 사진 · 태그만 고치고 방문일 · 반려동물은 잠근다 (명세서 16장 ④).
 */
export function ReviewWritePage() {
  const { placeId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const me = useAuthMe();
  const profile = useProfile();
  const pets = usePets();
  const place = useQuery({ queryKey: ['place', placeId], queryFn: () => placesApi.detail(placeId), staleTime: 60_000 });

  const petList = pets.data ?? [];
  const stored = useStoredReviews();
  const editId = params.get('edit');
  const editing = editId ? (stored.find((r) => r.reviewId === editId && r.accountId === me.data?.accountId) ?? null) : null;
  const [visitedAt, setVisitedAt] = useState(() => {
    if (editing) return editing.visitedAt;
    const v = params.get('visitedAt');
    return v && v <= todayIso() ? v : todayIso();
  });
  const [petId, setPetId] = useState(() => editing?.petId ?? params.get('petId') ?? profile.data?.defaultPetId ?? petList[0]?.petId ?? '');
  const [scores, setScores] = useState<Record<ScoreKey, number>>(() =>
    editing ? { facility: editing.facilityScore, rule: editing.ruleScore, mood: editing.moodScore } : { facility: 0, rule: 0, mood: 0 },
  );
  const [rating, setRating] = useState(() => editing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState(() => editing?.content ?? '');
  const [photos, setPhotos] = useState<string[]>(() => editing?.photos ?? []);
  const [tags, setTags] = useState<string[]>(() => editing?.tags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const room = REVIEW_PHOTO_MAX - photos.length;
    const picked = Array.from(files).slice(0, Math.max(room, 0));
    if (Array.from(files).some((f) => !(REVIEW_PHOTO_TYPES as readonly string[]).includes(f.type))) {
      setError('JPG, PNG 사진만 올릴 수 있습니다.');
      return;
    }
    if (files.length > room) setError(`사진은 ${REVIEW_PHOTO_MAX}장까지 올릴 수 있습니다.`);
    setBusy(true);
    try {
      const shrunk = await Promise.all(picked.map(shrinkPhoto));
      setPhotos((prev) => [...prev, ...shrunk].slice(0, REVIEW_PHOTO_MAX));
    } catch {
      setError('사진을 읽지 못했습니다. 다른 사진을 골라 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    setError(null);
    if (editing) {
      if (QUESTIONS.some((q) => scores[q.key] === 0)) return setError('질문 3개에 모두 답해 주세요.');
      if (rating === 0) return setError('최종 별점을 골라 주세요.');
      if (!content.trim()) return setError('후기를 적어 주세요.');
      const ok = reviewStore.update(editing.reviewId, {
        rating,
        facilityScore: scores.facility,
        ruleScore: scores.rule,
        moodScore: scores.mood,
        content: content.trim(),
        photos,
        tags,
      });
      if (!ok) return setError('저장 공간이 부족합니다. 사진을 줄이거나 빼 주세요.');
      navigate('/mypage/reviews', { replace: true });
      return;
    }
    const pet = petList.find((p) => p.petId === petId);
    if (!pet) return setError('함께 간 반려동물을 골라 주세요.');
    if (QUESTIONS.some((q) => scores[q.key] === 0)) return setError('질문 3개에 모두 답해 주세요.');
    if (rating === 0) return setError('최종 별점을 골라 주세요.');
    if (!content.trim()) return setError('후기를 적어 주세요.');
    if (!me.data || !place.data) return;

    const saved = reviewStore.add({
      reviewId: crypto.randomUUID(),
      placeId,
      placeName: place.data.name,
      placeType: place.data.placeType,
      accountId: me.data.accountId,
      rating,
      facilityScore: scores.facility,
      ruleScore: scores.rule,
      moodScore: scores.mood,
      content: content.trim(),
      photos,
      tags,
      likedBy: [],
      visitedAt,
      createdAt: new Date().toISOString(),
      petId: pet.petId,
      author: { nickname: profile.data?.nickname ?? '반려인', profileImageUrl: null },
      petSummary: { breedName: pet.breedName, weightKg: pet.weightKg, breedSize: pet.breedSize ?? sizeFromWeight(pet.weightKg) },
    });
    if (!saved) return setError('저장 공간이 부족합니다. 사진을 줄이거나 빼 주세요.');
    navigate(`/places/${placeId}#reviews`, { replace: true });
  };

  if (editId && !editing) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-[1.25rem] font-bold text-ink">고칠 후기를 찾지 못했습니다</p>
        <p className="text-[0.9375rem] text-sub">이미 지웠거나 다른 계정의 후기일 수 있습니다.</p>
        <Button variant="outline" onClick={() => navigate('/mypage/reviews')}>
          작성한 후기로
        </Button>
      </main>
    );
  }

  if (place.isError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-[1.25rem] font-bold text-ink">장소 정보를 불러오지 못했습니다</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          돌아가기
        </Button>
      </main>
    );
  }

  return (
    <main className="px-16 pb-16 pt-9">
      <h1 className="text-[2.25rem] font-extrabold tracking-[-0.02em] text-ink">
        "{place.data?.name ?? editing?.placeName ?? '…'}" {editing ? '후기 고치기' : '후기 남기기'}
      </h1>
      <p className="mt-1 text-[1.0625rem] text-sub">{editing ? '평점 · 글 · 사진 · 태그를 고칠 수 있어요.' : '이번 여정은 어땠는지 기록해주세요.'}</p>

      <div className="mt-7 grid grid-cols-2 items-start gap-[1.625rem]">
        <section className="rounded-[1.25rem] bg-white px-8 pb-4 pt-7 shadow-card">
          <div className="h-[6.25rem] overflow-hidden rounded-xl">
            {place.data ? (
              <PlaceImage src={place.data.imageUrl} placeType={place.data.placeType} alt={place.data.name} className="size-full" />
            ) : (
              <div className="size-full animate-pulse bg-[#efe9dd]" />
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <SelectBox label="방문 일자" icon={editing ? <Lock className="size-4" /> : <CalendarDays className="size-4" />}>
              {formatDateWithWeekday(visitedAt)}
              {!editing && <input
                type="date"
                aria-label="방문 일자"
                value={visitedAt}
                max={todayIso()}
                onChange={(e) => e.target.value && setVisitedAt(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="absolute inset-0 cursor-pointer opacity-0"
              />}
            </SelectBox>
            <div>
              {editing ? (
                <SelectBox label="함께 간 반려동물" icon={<Lock className="size-4" />}>
                  {editing.petSummary ? `${editing.petSummary.breedName} (${editing.petSummary.weightKg}kg)` : '기록 없음'}
                </SelectBox>
              ) : petList.length === 0 ? (
                <div>
                  <p className="mb-1.5 text-[0.8125rem] font-semibold text-sub">함께 간 반려동물</p>
                  <Link to="/signup/pets" className="flex h-11 items-center rounded-[0.625rem] border border-dashed border-line px-3 text-[0.875rem] font-semibold text-brand-strong">
                    반려동물을 등록해야 후기를 남길 수 있어요
                  </Link>
                </div>
              ) : (
                <SelectBox label="함께 간 반려동물" trailing={<ChevronDown className="size-4 text-sub" />}>
                  {(() => {
                    const p = petList.find((x) => x.petId === petId);
                    return p ? `${p.breedName} ${p.name} (${p.weightKg}kg)` : '반려동물 고르기';
                  })()}
                  <select aria-label="함께 간 반려동물" value={petId} onChange={(e) => setPetId(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
                    <option value="" disabled>
                      반려동물 고르기
                    </option>
                    {petList.map((p) => (
                      <option key={p.petId} value={p.petId}>
                        {p.breedName} {p.name} ({p.weightKg}kg)
                      </option>
                    ))}
                  </select>
                </SelectBox>
              )}
              <p className="mt-1.5 text-[0.75rem] text-faint">
                {editing ? '방문일과 함께 간 반려동물은 고칠 수 없습니다' : '선택한 아이의 견종과 체중이 이 후기에 그대로 남습니다'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {QUESTIONS.map((q) => (
              <Scale
                key={q.key}
                title={q.title}
                sub={q.sub}
                value={scores[q.key]}
                onChange={(v) => setScores((s) => ({ ...s, [q.key]: v }))}
              />
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-[1.25rem] bg-white px-8 py-7 shadow-card">
            <h2 className="text-center text-[1.25rem] font-bold text-ink">후기 작성</h2>
            <textarea
              value={content}
              maxLength={1000}
              rows={4}
              onChange={(e) => setContent(e.target.value)}
              aria-label="후기"
              placeholder="이번 방문은 어땠나요? 다음 사람에게 도움이 될 이야기를 남겨주세요."
              className="mt-4 w-full resize-none bg-transparent text-[0.9375rem] leading-[1.7] text-ink outline-none placeholder:text-faint focus-visible:outline-none"
            />
            <p className="text-right text-[0.75rem] text-faint">{content.length} / 1000</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {photos.map((src, i) => (
                <div key={i} className="relative size-[4.125rem] overflow-hidden rounded-lg">
                  <img src={src} alt={`고른 사진 ${i + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label={`사진 ${i + 1} 빼기`}
                    onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-white"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {photos.length < REVIEW_PHOTO_MAX && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={busy}
                  className="flex items-center gap-3 text-left"
                >
                  <span className="grid size-[4.125rem] place-items-center rounded-lg border border-line text-faint hover:bg-field">
                    <Plus className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[0.875rem] font-semibold text-ink">{busy ? '사진을 줄이는 중' : '사진 추가'}</span>
                    <span className="block text-[0.75rem] text-faint">
                      {REVIEW_PHOTO_MAX}장까지 올릴 수 있습니다 · JPG, PNG
                    </span>
                  </span>
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={REVIEW_PHOTO_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  void addPhotos(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
          </section>

          <section className="rounded-[1.25rem] bg-white px-8 py-7 shadow-card">
            <h2 className="text-center text-[1.25rem] font-bold text-ink">추천 태그</h2>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {REVIEW_TAGS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTags((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                    className={`h-9 rounded-lg px-3.5 text-[0.875rem] font-semibold transition-colors ${
                      on ? 'bg-brand-strong text-white' : 'bg-[#e9efe9] text-brand-strong hover:bg-[#dde7df]'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[1.25rem] bg-white px-8 py-7 shadow-card">
            <h2 className="text-center text-[1.25rem] font-bold text-ink">최종 별점</h2>
            <div className="mt-4 flex justify-center gap-6" role="radiogroup" aria-label="최종 별점" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => {
                const lit = (hover || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n}점`}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setRating(n)}
                  >
                    <Star className={`size-[2.1rem] text-[#e2b33c] transition-transform ${lit ? 'scale-105 fill-[#e2b33c]' : ''}`} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </section>

          {error && (
            <p role="alert" className="rounded-[0.625rem] bg-alert-soft px-4 py-3 text-[0.875rem] text-alert">
              {error}
            </p>
          )}

          <div className="grid grid-cols-[22fr_25.5fr] gap-4">
            <Button variant="line" size="xl" onClick={() => navigate(-1)}>
              취소
            </Button>
            <Button size="xl" onClick={submit} disabled={busy || (!editing && petList.length === 0)}>
              {editing ? '수정 완료' : '작성 완료'}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function SelectBox({ label, icon, trailing, children }: { label: string; icon?: ReactNode; trailing?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[0.8125rem] font-semibold text-sub">{label}</p>
      <div className="relative flex h-11 items-center gap-2 rounded-[0.625rem] border border-line bg-white px-3 text-[0.875rem] text-ink focus-within:border-brand">
        {icon && <span className="text-sub">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {trailing}
      </div>
    </div>
  );
}

/** 5칸 선택 — 양 끝에 「매우 달라요」 · 「똑같아요」 */
function Scale({ title, sub, value, onChange }: { title: string; sub: string | null; value: number; onChange: (v: number) => void }) {
  return (
    <div className="border-t border-line py-6 text-center first:border-t-0 first:pt-2">
      <p className="text-[1.0625rem] font-bold text-ink">{title}</p>
      {sub && <p className="mt-0.5 text-[0.875rem] text-sub">{sub}</p>}
      <div role="radiogroup" aria-label={title} className="mx-auto mt-4 grid w-[18rem] grid-cols-5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex flex-col items-center">
            <button
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n}점`}
              onClick={() => onChange(n)}
              className="grid size-[1.375rem] place-items-center rounded-full border-2 border-ink"
            >
              <span className={`size-[0.625rem] rounded-full bg-ink transition-opacity ${value === n ? 'opacity-100' : 'opacity-0'}`} />
            </button>
            <span className="mt-1.5 h-4 whitespace-nowrap text-[0.75rem] text-sub">{n === 1 ? '매우 달라요' : n === 5 ? '똑같아요' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
