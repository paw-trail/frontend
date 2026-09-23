import { RecentList } from './RecentList';

/** 6장 「최근 확인해본 동반 장소」 의 전체보기 — 서버 상한 20곳 (대조표 2/4 안 5) */
export function RecentPage() {
  return (
    <main className="px-20 pb-16 pt-9">
      <h1 className="text-[1.5rem] font-bold tracking-[-0.01em] text-ink">최근 확인해본 동반 장소</h1>
      <p className="mt-1 text-[0.9375rem] text-sub">최근에 열어 본 장소를 20곳까지 보여 드립니다. 판정은 대표 반려동물 기준입니다.</p>
      <div className="mt-6">
        <RecentList />
      </div>
    </main>
  );
}
