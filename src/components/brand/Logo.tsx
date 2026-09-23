import mark from '@/assets/brand/logo-mark.png';
import wordmark from '@/assets/brand/logo-wordmark.png';

/** 헤더 로고 — 사용자가 준 원본 PNG 에서 핀 표지와 글자를 잘라 가로로 놓았다 */
export function HeaderLogo() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <img src={mark} alt="" className="h-8 w-auto" />
      <img src={wordmark} alt="함께하개" className="h-[1.375rem] w-auto" />
    </span>
  );
}
