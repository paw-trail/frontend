import { PawPrint } from 'lucide-react';
import logoFull from '@/assets/brand/logo-full.png';

// 명세서 1장 — 바탕에 흩어진 발자국 넷과 점 네 개
const PAWS = [
  { left: '9%', top: '18%', rotate: -18 },
  { left: '88%', top: '23%', rotate: 16 },
  { left: '17%', top: '73%', rotate: 12 },
  { left: '80%', top: '80%', rotate: -10 },
];
const DOTS = ['#5e8676', '#7f9f8f', '#a2b8ab', '#d3ddd6'];

export function SplashScreen({
  failed = false,
  message,
  onRetry,
  retryLabel = '다시 시도',
  secondary,
}: {
  failed?: boolean;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** 다시 시도로도 풀리지 않을 때의 두 번째 길 */
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream">
      {PAWS.map((p) => (
        <PawPrint
          key={`${p.left}-${p.top}`}
          aria-hidden
          strokeWidth={1.6}
          className="absolute size-9 text-[#dccfbc]"
          style={{ left: p.left, top: p.top, transform: `rotate(${p.rotate}deg)` }}
        />
      ))}

      <div className="flex flex-col items-center text-center">
        <img src={logoFull} alt="함께하개" className="w-[11.625rem]" />
        <p className="mt-5 text-[1.0625rem] font-medium text-sub">반려동물과 함께하는 장소 탐험</p>

        <div className="mt-6 flex gap-2" aria-hidden>
          {DOTS.map((color, i) => (
            <span
              key={color}
              className="motion-dot size-2.5 rounded-full"
              style={{
                backgroundColor: color,
                animation: failed ? 'none' : `paw-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>

        <p className="mt-4 text-[0.8125rem] text-faint" role="status">
          {message ?? (failed ? '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' : '가까운 장소를 탐색하고 있어요...')}
        </p>

        {failed && (onRetry || secondary) && (
          <div className="mt-5 flex items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="h-10 rounded-[0.625rem] bg-brand px-5 text-[0.875rem] font-semibold text-white hover:bg-brand-strong"
              >
                {retryLabel}
              </button>
            )}
            {secondary && (
              <button
                type="button"
                onClick={secondary.onClick}
                className="h-10 rounded-[0.625rem] border border-line bg-white px-5 text-[0.875rem] font-semibold text-ink hover:bg-field"
              >
                {secondary.label}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
