import type { Pet } from '@/api/types';
import { BREED_SIZE_LABEL } from '@/lib/labels';
import { petKey, useLocalPhoto } from './petPhotoStore';
import { formatWeight, sizeFromWeight } from './petRules';

/** 5장 오른쪽 「등록된 우리아이들 정보」 한 마리 */
export function PetSummary({ pet, isDefault }: { pet: Pet; isDefault: boolean }) {
  const size = pet.breedSize ?? sizeFromWeight(pet.weightKg);
  const photo = useLocalPhoto(petKey(pet.petId), pet.photoUrl);
  const info = [
    pet.vaccineCompleted ? '접종 완료' : '미접종',
    pet.vaccineProofAvailable ? '증명서 있음' : null,
    pet.hasCarrier ? '이동장' : null,
    pet.hasStroller ? '유모차' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <p className="flex items-center gap-2 text-[1.25rem] font-bold text-ink">
        {pet.name}
        {isDefault && (
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.75rem] font-semibold text-brand-strong">대표</span>
        )}
      </p>
      <div className="mt-2.5 grid grid-cols-[7.125rem_minmax(0,1fr)] gap-2">
        <div className="flex h-[4.625rem] items-center justify-center overflow-hidden rounded-xl border border-brand/45 bg-brand-soft text-[0.9375rem] font-semibold text-brand-strong">
          {photo ? <img src={photo} alt={`${pet.name} 사진`} className="size-full object-cover" /> : '사진'}
        </div>
        <dl className="grid grid-cols-[2.25rem_minmax(0,1fr)] content-center gap-x-2 rounded-xl border border-line px-4 py-2 text-[0.8125rem] leading-[1.5]">
          <dt className="text-sub">종</dt>
          <dd className="truncate text-ink">{pet.breedName}</dd>
          <dt className="text-sub">무게</dt>
          <dd className="text-ink">
            {formatWeight(pet.weightKg)} · {BREED_SIZE_LABEL[size]}
          </dd>
          <dt className="text-sub">정보</dt>
          <dd className="truncate text-ink">{info}</dd>
        </dl>
      </div>
    </div>
  );
}
