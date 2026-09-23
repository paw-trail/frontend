import type { ReactNode } from 'react';
import illustration from '@/assets/illustrations/walk-illustration.jpg';

/** 명세서 2 · 4장 — 왼쪽 큰 문구와 산책 선화, 오른쪽 카드 */
export function AuthLayout({ children, cardOffset = '' }: { children: ReactNode; cardOffset?: string }) {
  return (
    <main className="min-h-screen bg-cream">
      <div className="shell grid min-h-screen grid-cols-[minmax(0,1fr)_34.75rem] content-center items-stretch gap-[2.5rem] py-12 pl-[5.5rem] pr-[5rem]">
        {/* 왼쪽 칸의 아래가 카드와 같은 줄에서 끝나도록 일러스트가 남은 높이를 채운다 */}
        <section className="flex min-h-0 flex-col">
          <h1 className="text-[3.25rem] font-extrabold leading-[1.28] tracking-[-0.02em] text-ink">
            오늘도 사랑하는 반려동물과
            <br />
            즐거운 하루를 즐겨보세요!
          </h1>
          <div className="mt-10 min-h-[12rem] flex-1 overflow-hidden rounded-2xl bg-[#f9f8f4] shadow-card">
            <img src={illustration} alt="공원에서 반려견과 산책하는 사람" className="size-full object-cover" />
          </div>
        </section>
        <section className={`flex flex-col ${cardOffset}`}>{children}</section>
      </div>
    </main>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return <div className="flex-1 rounded-[1.25rem] bg-white px-6 pb-7 pt-7 shadow-card">{children}</div>;
}

/** 코드를 보낸 뒤 뜨는 안내 상자 (4장 그림 문구 그대로) */
export function MailSentNotice({ showSocialHint = false }: { showSocialHint?: boolean }) {
  return (
    <div className="rounded-[0.625rem] bg-notice px-3.5 py-3 text-[0.75rem] leading-[1.7] text-sub">
      <p className="text-[0.8125rem] font-semibold text-ink">메일을 보냈습니다. 받은 편지함을 확인해주세요.</p>
      <p>메일이 오지 않는다면 스팸함을 확인해주세요.</p>
      {showSocialHint && <p>구글로 가입한 계정은 비밀번호를 사용하지 않습니다.</p>}
    </div>
  );
}
