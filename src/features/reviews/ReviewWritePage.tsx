import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Lock, Plus, Star, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { commonMessage, isApiError } from '@/api/client';
import { qk } from '@/api/keys';
import { PhotoUploadError } from '@/api/pets';
import { placesApi } from '@/api/places';
import { reviewsApi, type ReviewUpdateBody } from '@/api/reviews';
import type { MyReview, PlaceReview } from '@/api/types';
import { PlaceImage } from '@/components/place/PlaceImage';
import { Button } from '@/components/ui/Button';
import { usePets, useProfile } from '@/features/auth/session';
import { formatDateWithWeekday, todayIso } from '@/lib/format';
import { REVIEW_PHOTO_MAX, REVIEW_PHOTO_TYPES, shrinkPhoto } from './photos';
import { REVIEW_TAGS } from './tags';

// 질문 부제는 그림의 자리 채움 문구를 바꾼 것 (대조표 3/4 1-1)
const QUESTIONS = [
  { key: 'facility', title: '시설이 작성된 것과 동일했나요?', sub: '편의시설 · 공간이 안내와 같았는지 알려 주세요' },
  { key: 'rule', title: '규정은 작성된 것과 동일했나요?', sub: '동반 조건 · 준비물 안내가 실제와 같았는지 알려 주세요' },
  { key: 'mood', title: '직원과 장소의 분위기가 생각과 같았나요?', sub: null },
] as const;
type ScoreKey = (typeof QUESTIONS)[number]['key'];

/** 후기 한 건에 고를 수 있는 반려동물 수 (서버 규칙) */
const MAX_PETS = 5;
/** 고칠 후기의 원본을 장소 후기 목록에서 찾을 때 훑는 범위 */
const LOOKUP_PAGES = 3;
const LOOKUP_SIZE = 100;

/** 화면에 걸린 사진 — 새로 고른 것은 file, 이미 올라간 것은 url 을 들고 있다 */
type PhotoItem = { key: string; preview: string; file?: File; url?: string };

function sameList(a: readonly string[], b: readonly string[] | null): boolean {
  return b !== null && a.length === b.length && a.every((v, i) => v === b[i]);
}

function messageFor(error: unknown): string {
  if (error instanceof PhotoUploadError) return '사진을 올리지 못했습니다. 사진을 빼고 저장하거나 잠시 후 다시 시도해 주세요.';
  if (isApiError(error, 'PET_NOT_OWNED')) return '본인의 반려동물로만 후기를 쓸 수 있습니다.';
  if (isApiError(error, 'PET_NOT_FOUND')) return '고른 반려동물을 찾지 못했습니다. 목록을 새로 고친 뒤 다시 골라 주세요.';
  if (isApiError(error, 'INVALID_REVIEW_SCORE')) return '별점은 1점부터 5점까지 고를 수 있습니다.';
  if (isApiError(error, 'INVALID_REVIEW_CONTENT')) return '후기는 1자 이상 1000자 이하로 적어 주세요.';
  if (isApiError(error, 'REVIEW_NOT_FOUND')) return '고칠 후기를 찾지 못했습니다. 이미 지워졌을 수 있습니다.';
  if (isApiError(error, 'REVIEW_ACCESS_DENIED')) return '이 후기를 고칠 권한이 없습니다.';
  if (isApiError(error, 'VALIDATION_FAILED')) return error.fieldErrors[0]?.message ?? '입력한 값을 다시 확인해 주세요.';
  return commonMessage(error);
}

/**
 * 명세서 9장 후기 작성 — review 서버에 쓴다.
 * ?edit={reviewId} 로 열면 16장의 수정 — 별점 · 글 · 사진 · 태그만 고치고 방문일 · 반려동물은 잠근다.
 *
 * 수정은 보낸 칸만 바뀌므로 건드린 칸만 보낸다.
 * 문항별 별점은 내 후기 목록에 없어서 그 장소의 후기 목록에서 찾아 채우고,
 * 못 찾으면 비워 둔 채로 두고 보내지 않는다 (그러면 지금 값이 그대로 남는다).
 */
export function ReviewWritePage() {
  const { placeId = '' } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const pets = usePets();
  const place = useQuery({ queryKey: ['place', placeId], queryFn: () => placesApi.detail(placeId), staleTime: 60_000 });

  const petList = pets.data ?? [];
  const editId = params.get('edit');
  /*
   * 목록에서 넘겨 준 값 — 있으면 기다리지 않고 바로 채운다.
   * 8장 후기 카드에서 왔으면 문항 점수까지 들어 있어 원본을 찾으러 가지 않아도 된다.
   */
  const passed = (location.state as { review?: MyReview | PlaceReview } | null)?.review;
  const passedFull = passed && 'facilityScore' in passed ? passed : null;

  const original = useQuery({
    queryKey: ['reviewOriginal', placeId, editId],
    enabled: Boolean(editId) && !passedFull,
    staleTime: 30_000,
    queryFn: async () => {
      for (let page = 0; page < LOOKUP_PAGES; page += 1) {
        const res = await reviewsApi.byPlace(placeId, { sort: 'recent', page, size: LOOKUP_SIZE });
        const found = res.content.find((r) => r.reviewId === editId);
        if (found) return found;
        if (page + 1 >= res.page.totalPages) break;
      }
      return null;
    },
  });

  const [visitedAt, setVisitedAt] = useState(() => {
    if (passed) return passed.visitedAt;
    const v = params.get('visitedAt');
    return v && v <= todayIso() ? v : todayIso();
  });
  // 대표 반려동물은 아래 effect 가 목록과 대조해 고른다 — 지워진 아이를 가리킬 수 있어 그대로 넣지 않는다
  const [petIds, setPetIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<ScoreKey, number>>(() =>
    passedFull ? { facility: passedFull.facilityScore, rule: passedFull.ruleScore, mood: passedFull.moodScore } : { facility: 0, rule: 0, mood: 0 },
  );
  const [rating, setRating] = useState(() => passed?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState(() => passed?.content ?? '');
  const [photos, setPhotos] = useState<PhotoItem[]>(() => (passed?.photos ?? []).map((url) => ({ key: url, preview: url, url })));
  const [tags, setTags] = useState<string[]>(() => passed?.tags ?? []);
  const [seeded, setSeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const tagList = useQuery({ queryKey: qk.reviewTags, queryFn: reviewsApi.tags, staleTime: 5 * 60_000 });
  // 목록을 못 받아도 태그를 고를 수는 있어야 한다 — 서버가 받을 때 한 번 더 거른다
  const tagOptions = tagList.data?.length ? tagList.data : [...REVIEW_TAGS];

  // 대표 반려동물 한 마리를 기본으로 (목록이 늦게 와도 한 번만)
  useEffect(() => {
    if (editId || petIds.length > 0 || petList.length === 0) return;
    const wanted = profile.data?.defaultPetId;
    setPetIds([wanted && petList.some((p) => p.petId === wanted) ? wanted : petList[0].petId]);
  }, [editId, petIds.length, petList, profile.data?.defaultPetId]);

  // 원본을 찾으면 화면을 채운다 (넘겨받은 값이 있으면 문항별 별점만)
  // 다시 받는 중에는 채우지 않는다 — 낡은 캐시 값으로 채우면 고치지 않은 칸이 PATCH 에 실린다
  useEffect(() => {
    if (!editId || seeded || original.isFetching) return;
    const found = original.data;
    if (!found) return;
    setScores({ facility: found.facilityScore, rule: found.ruleScore, mood: found.moodScore });
    if (!passed) {
      setRating(found.rating);
      setContent(found.content);
      setTags(found.tags);
      setVisitedAt(found.visitedAt);
      setPhotos(found.photos.map((url) => ({ key: url, preview: url, url })));
    }
    setSeeded(true);
  }, [editId, original.data, original.isFetching, passed, seeded]);

  const baseline = useMemo(() => {
    const found = original.data ?? passedFull;
    if (found) {
      return {
        rating: found.rating as number | null,
        facility: found.facilityScore as number | null,
        rule: found.ruleScore as number | null,
        mood: found.moodScore as number | null,
        content: found.content as string | null,
        photos: found.photos as string[] | null,
        tags: found.tags as string[] | null,
      };
    }
    if (passed) {
      return { rating: passed.rating, facility: null, rule: null, mood: null, content: passed.content, photos: passed.photos, tags: passed.tags };
    }
    return { rating: null, facility: null, rule: null, mood: null, content: null, photos: null, tags: null };
  }, [original.data, passed, passedFull]);

  const selectedPets = petIds.map((id) => petList.find((p) => p.petId === id)).filter((p) => p !== undefined);
  const lockedPets = (original.data?.pets ?? passed?.pets ?? []).map((p) => p.breedName ?? '견종 미등록').join(', ');
  // 8장에서 온 값에는 장소 이름이 없다 — 그 화면은 장소 상세를 이미 부르고 있어 제목은 그쪽에서 나온다
  const scoresUnknown = Boolean(editId) && baseline.facility === null;

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
      setPhotos((prev) =>
        [...prev, ...shrunk.map((file) => ({ key: crypto.randomUUID(), preview: URL.createObjectURL(file), file }))].slice(0, REVIEW_PHOTO_MAX),
      );
    } catch {
      setError('사진을 읽지 못했습니다. 다른 사진을 골라 주세요.');
    } finally {
      setBusy(false);
    }
  };

  /** 새로 고른 사진만 올리고, 이미 올라간 것은 받은 주소를 그대로 돌려준다 */
  const uploadAll = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const item of photos) {
      urls.push(item.file ? await reviewsApi.uploadPhoto(item.file) : (item.url ?? ''));
    }
    return urls.filter(Boolean);
  };

  const refresh = () => {
    // 고친 뒤 다시 열었을 때 옛 원본이 남아 있지 않게 아예 버린다
    queryClient.removeQueries({ queryKey: ['reviewOriginal', placeId] });
    void queryClient.invalidateQueries({ queryKey: qk.placeReviewsAll(placeId) });
    void queryClient.invalidateQueries({ queryKey: qk.myReviewsAll });
    void queryClient.invalidateQueries({ queryKey: qk.profile });
  };

  const save = useMutation({
    mutationFn: async () => {
      const urls = await uploadAll();
      if (editId) {
        const patch: ReviewUpdateBody = {};
        if (rating > 0 && rating !== baseline.rating) patch.rating = rating;
        if (scores.facility > 0 && scores.facility !== baseline.facility) patch.facilityScore = scores.facility;
        if (scores.rule > 0 && scores.rule !== baseline.rule) patch.ruleScore = scores.rule;
        if (scores.mood > 0 && scores.mood !== baseline.mood) patch.moodScore = scores.mood;
        const text = content.trim();
        if (text && text !== baseline.content) patch.content = text;
        if (!sameList(urls, baseline.photos)) patch.photos = urls;
        if (!sameList(tags, baseline.tags)) patch.tags = tags;
        if (Object.keys(patch).length > 0) await reviewsApi.update(editId, patch);
        return;
      }
      await reviewsApi.create(placeId, {
        petIds,
        visitedAt,
        rating,
        facilityScore: scores.facility,
        ruleScore: scores.rule,
        moodScore: scores.mood,
        content: content.trim(),
        photos: urls,
        tags,
      });
    },
    onSuccess: () => {
      refresh();
      navigate(editId ? '/mypage/reviews' : `/places/${placeId}#reviews`, { replace: true });
    },
    onError: (e) => setError(messageFor(e)),
  });

  const submit = () => {
    setError(null);
    if (!content.trim()) return setError('후기를 적어 주세요.');
    if (rating === 0) return setError('최종 별점을 골라 주세요.');
    if (editId) {
      if (!scoresUnknown && QUESTIONS.some((q) => scores[q.key] === 0)) return setError('질문 3개에 모두 답해 주세요.');
    } else {
      if (petIds.length === 0) return setError('함께 간 반려동물을 골라 주세요.');
      if (QUESTIONS.some((q) => scores[q.key] === 0)) return setError('질문 3개에 모두 답해 주세요.');
    }
    save.mutate();
  };

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
        "{place.data?.name ?? (passed && 'placeName' in passed ? passed.placeName : null) ?? '…'}" {editId ? '후기 고치기' : '후기 남기기'}
      </h1>
      <p className="mt-1 text-[1.0625rem] text-sub">{editId ? '평점 · 글 · 사진 · 태그를 고칠 수 있어요.' : '이번 여정은 어땠는지 기록해주세요.'}</p>

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
            <SelectBox label="방문 일자" icon={editId ? <Lock className="size-4" /> : <CalendarDays className="size-4" />}>
              {formatDateWithWeekday(visitedAt)}
              {!editId && (
                <input
                  type="date"
                  aria-label="방문 일자"
                  value={visitedAt}
                  max={todayIso()}
                  onChange={(e) => e.target.value && setVisitedAt(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              )}
            </SelectBox>
            <div>
              {editId ? (
                <SelectBox label="함께 간 반려동물" icon={<Lock className="size-4" />}>
                  {lockedPets || '기록 없음'}
                </SelectBox>
              ) : petList.length === 0 ? (
                <div>
                  <p className="mb-1.5 text-[0.8125rem] font-semibold text-sub">함께 간 반려동물</p>
                  <Link
                    to="/signup/pets"
                    className="flex h-11 items-center rounded-[0.625rem] border border-dashed border-line px-3 text-[0.875rem] font-semibold text-brand-strong"
                  >
                    반려동물을 등록해야 후기를 남길 수 있어요
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="mb-1.5 text-[0.8125rem] font-semibold text-sub">함께 간 반려동물</p>
                  <div className="flex flex-wrap gap-2">
                    {petList.map((p) => {
                      const order = petIds.indexOf(p.petId);
                      const on = order >= 0;
                      const full = !on && petIds.length >= MAX_PETS;
                      return (
                        <button
                          key={p.petId}
                          type="button"
                          aria-pressed={on}
                          disabled={full}
                          onClick={() =>
                            setPetIds((prev) => (prev.includes(p.petId) ? prev.filter((x) => x !== p.petId) : prev.length >= MAX_PETS ? prev : [...prev, p.petId]))
                          }
                          className={`flex h-11 items-center gap-1.5 rounded-[0.625rem] border px-3 text-[0.875rem] font-semibold transition-colors ${
                            on ? 'border-brand-strong bg-brand-strong text-white' : full ? 'border-line bg-white text-faint' : 'border-line bg-white text-ink hover:bg-field'
                          }`}
                        >
                          {on && (
                            <span className="grid size-[1.125rem] place-items-center rounded-full bg-white/25 text-[0.6875rem] tabular-nums" aria-hidden>
                              {order + 1}
                            </span>
                          )}
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="mt-1.5 text-[0.75rem] text-faint">
                {editId
                  ? '방문일과 함께 간 반려동물은 고칠 수 없습니다'
                  : selectedPets.length > 0
                    ? `${selectedPets.map((p) => `${p.name} · ${p.breedName} ${p.weightKg}kg`).join(', ')} 로 이 후기에 남습니다`
                    : `함께 간 아이를 골라 주세요 · ${MAX_PETS}마리까지 고를 수 있어요`}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {QUESTIONS.map((q) => (
              <Scale key={q.key} title={q.title} sub={q.sub} value={scores[q.key]} onChange={(v) => setScores((s) => ({ ...s, [q.key]: v }))} />
            ))}
            {scoresUnknown && !original.isPending && (
              <p className="border-t border-line pt-4 text-center text-[0.75rem] text-faint">
                이전에 매긴 문항 점수를 불러오지 못했습니다 · 고치지 않으면 그대로 둡니다
              </p>
            )}
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
              {photos.map((item, i) => (
                <div key={item.key} className="relative size-[4.125rem] overflow-hidden rounded-lg">
                  <img src={item.preview} alt={`고른 사진 ${i + 1}`} className="size-full object-cover" />
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
                <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className="flex items-center gap-3 text-left">
                  <span className="grid size-[4.125rem] place-items-center rounded-lg border border-line text-faint hover:bg-field">
                    <Plus className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[0.875rem] font-semibold text-ink">{busy ? '사진을 줄이는 중' : '사진 추가'}</span>
                    <span className="block text-[0.75rem] text-faint">{REVIEW_PHOTO_MAX}장까지 올릴 수 있습니다 · JPG, PNG</span>
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
              {tagOptions.map((t) => {
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
            <Button size="xl" onClick={submit} disabled={busy || save.isPending || (!editId && petList.length === 0)}>
              {save.isPending ? '저장하는 중' : editId ? '수정 완료' : '작성 완료'}
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
