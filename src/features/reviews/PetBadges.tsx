import type { MyReviewPet, ReviewPet } from '@/api/types';
import { BREED_SIZE_LABEL } from '@/lib/labels';

/** 배지에 한 줄로 보일 아이 (장소 후기는 견종 · 체중, 내 후기는 견종 · 크기) */
function label(pet: ReviewPet | MyReviewPet): string {
  const breed = pet.breedName ?? '견종 미등록';
  const weight = 'weightKg' in pet && pet.weightKg !== null ? ` · ${pet.weightKg}kg` : '';
  const size = !('weightKg' in pet) && pet.breedSize ? ` · ${BREED_SIZE_LABEL[pet.breedSize]}` : '';
  return `${breed}${weight}${size}`;
}

/** 배지로 보여 줄 마릿수 — 넘치면 뒤를 「외 N마리」로 줄인다 */
const SHOWN = 2;

/**
 * 후기에 남은 반려동물 배지.
 *
 * 순서는 후기를 쓸 때 고른 순서 그대로다 (서버가 그 순서로 내려 준다).
 * 자리를 재서 줄이지 않고 마릿수로 자르는 까닭은 창 폭 · 닉네임 길이에 따라
 * 같은 화면이 매번 다르게 보이지 않게 하기 위함이다.
 */
export function PetBadges({ pets, className = '' }: { pets: readonly (ReviewPet | MyReviewPet)[]; className?: string }) {
  if (pets.length === 0) return null;
  const shown = pets.slice(0, SHOWN);
  const rest = pets.length - shown.length;
  return (
    <>
      {shown.map((pet, i) => (
        <span key={i} className={`rounded-md bg-brand-soft px-2 py-0.5 text-[0.75rem] font-semibold text-brand-strong ${className}`}>
          {label(pet)}
        </span>
      ))}
      {rest > 0 && (
        <span
          title={pets.map(label).join(', ')}
          className={`rounded-md bg-[#f1efe9] px-2 py-0.5 text-[0.75rem] font-semibold text-sub ${className}`}
        >
          외 {rest}마리
        </span>
      )}
    </>
  );
}
