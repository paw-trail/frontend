import { PawPrint, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { MY_PHOTO_KEY, petKey, useLocalPhoto, useLocalPhotos } from '@/features/pets/petPhotoStore';
import { useAuthMe, usePets, useProfile } from '@/features/auth/session';
import { BREED_SIZE_LABEL } from '@/lib/labels';
import { sizeFromWeight } from '@/features/pets/petRules';

/** 12~16장 위 프로필 카드 — 회원 · 대표 반려동물 · 방문 · 후기 · 즐겨찾기 수 */
export function ProfileCard() {
  const me = useAuthMe();
  const profile = useProfile();
  const photos = useLocalPhotos();
  const myPhoto = useLocalPhoto(MY_PHOTO_KEY, profile.data?.profileImageUrl);
  const pets = usePets();

  const list = pets.data ?? [];
  // user 가 반려동물 삭제 이벤트를 받지 않아 defaultPetId 가 지워진 아이를 가리킬 수 있다 (대조표 3/4 4-2)
  const pet = list.find((p) => p.petId === profile.data?.defaultPetId) ?? list[0] ?? null;
  // 숫자를 누르면 그 목록으로 간다
  const stats: [string, number | undefined, string][] = [
    ['방문한 장소', profile.data?.stats.visitCount, '/mypage/visited'],
    ['작성한 후기', profile.data?.stats.reviewCount ?? undefined, '/mypage/reviews'],
    ['즐겨찾기', profile.data?.stats.favoriteCount, '/mypage/favorites'],
  ];

  return (
    <section className="flex items-center gap-8 rounded-[1.25rem] bg-white px-8 py-6 shadow-card">
      <div className="flex min-w-0 items-center gap-5">
        {myPhoto ? (
          <img src={myPhoto} alt="" className="size-[5.5rem] shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-[5.5rem] shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
            <UserRound className="size-10" strokeWidth={1.5} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[1.625rem] font-bold tracking-[-0.01em] text-ink">{profile.data?.nickname ?? '회원'} 회원님</p>
          <p className="truncate text-[0.875rem] text-faint">{me.data?.email}</p>
        </div>
      </div>

      <span className="h-16 w-px shrink-0 bg-line" aria-hidden />

      {pet ? (
        <div className="flex w-[22rem] shrink-0 items-center gap-4 rounded-xl border border-brand/40 bg-[#edf1ec] px-5 py-3.5">
          {(photos[petKey(pet.petId)] ?? pet.photoUrl) ? (
            <img src={photos[petKey(pet.petId)] ?? pet.photoUrl ?? undefined} alt="" className="size-[4.25rem] shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid size-[4.25rem] shrink-0 place-items-center rounded-full bg-white text-brand-strong">
              <PawPrint className="size-7" aria-hidden />
            </span>
          )}
          <div className="min-w-0 text-[0.875rem]">
            <p className="truncate">
              <span className="text-[1.0625rem] font-bold text-brand-strong">{pet.name}</span>
              <span className="ml-1.5 text-[0.8125rem] text-sub">{pet.breedName}</span>
            </p>
            <p className="text-ink">
              몸무게: {pet.weightKg}kg ({BREED_SIZE_LABEL[pet.breedSize ?? sizeFromWeight(pet.weightKg)]})
            </p>
            {pet.note && <p className="truncate text-[0.8125rem] text-sub">• {pet.note}</p>}
          </div>
        </div>
      ) : (
        <p className="w-[22rem] shrink-0 rounded-xl border border-dashed border-line px-5 py-5 text-[0.875rem] text-sub">등록한 반려동물이 없습니다</p>
      )}

      <span className="h-16 w-px shrink-0 bg-line" aria-hidden />

      <dl className="grid flex-1 grid-cols-3 text-center">
        {stats.map(([label, value, to]) => (
          <div key={label}>
            <dt className="text-[0.875rem] text-sub">{label}</dt>
            <dd className="mt-1">
              <Link
                to={to}
                className="inline-block rounded-lg px-3 py-0.5 text-[2.25rem] font-bold leading-none text-brand-strong transition-colors hover:bg-brand-soft"
              >
                {value ?? '-'}
              </Link>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
