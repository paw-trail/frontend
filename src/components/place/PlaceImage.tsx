import { useState } from 'react';
import type { PlaceType } from '@/api/types';
import camping from '@/assets/placeholders/place-camping.jpg';
import cafe from '@/assets/placeholders/place-cafe.jpg';
import culture from '@/assets/placeholders/place-culture.jpg';
import etc from '@/assets/placeholders/place-etc.jpg';
import leisure from '@/assets/placeholders/place-leisure.jpg';
import park from '@/assets/placeholders/place-park.jpg';
import restaurant from '@/assets/placeholders/place-restaurant.jpg';
import stay from '@/assets/placeholders/place-stay.jpg';
import vet from '@/assets/placeholders/place-vet.jpg';

// 사진은 관광공사 · 고캠핑 두 소스에서만 온다 — 장소의 약 16% 만 있고 나머지는 종류별 그림이 채운다
const PLACEHOLDER: Record<PlaceType, string> = {
  CAFE: cafe,
  RESTAURANT: restaurant,
  PARK: park,
  STAY: stay,
  CAMPING: camping,
  VET: vet,
  LEISURE: leisure,
  CULTURE: culture,
  ETC: etc,
};

export function placeholderOf(placeType: PlaceType | string | null | undefined): string {
  return PLACEHOLDER[(placeType ?? 'ETC') as PlaceType] ?? etc;
}

type Props = {
  src: string | null | undefined;
  placeType: PlaceType | string | null | undefined;
  alt: string;
  className?: string;
  /** 실제 사진을 못 불러와 기본 그림으로 바꿨을 때 */
  onPhotoError?: () => void;
};

// 같은 종류가 나란히 오면 같은 그림이 여러 장 붙어 보인다 — 이름으로 골라 조금씩 달리 보이게 한다
const VARIANTS = ['', 'scale-x-[-1]', 'hue-rotate-[10deg] saturate-[1.06]', 'scale-x-[-1] hue-rotate-[-8deg] brightness-[1.04]'];

function variantOf(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum = (sum * 31 + seed.charCodeAt(i)) % 9973;
  return VARIANTS[sum % VARIANTS.length];
}

/** 장소 사진 — 없거나 못 불러오면 종류별 기본 그림 */
export function PlaceImage({ src, placeType, alt, className = '', onPhotoError }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = src && src !== failedSrc ? src : null;
  const variant = usable ? '' : variantOf(alt || String(placeType ?? ''));
  return (
    <img
      src={usable ?? placeholderOf(placeType)}
      alt={usable ? alt : ''}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (usable) {
          setFailedSrc(usable);
          onPhotoError?.();
        }
      }}
      className={`object-cover ${variant} ${className}`}
    />
  );
}
