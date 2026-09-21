import { RecentList } from '@/features/recent/RecentList';

/** 마이페이지 안에서 보는 최근 본 장소 */
export function MyRecentPage() {
  return (
    <section>
      <h2 className="text-[1.5rem] font-bold tracking-[-0.01em] text-ink">최근 본 장소</h2>
      <p className="mt-1 text-[0.9375rem] text-sub">최근에 열어 본 장소를 20곳까지 보여 드립니다.</p>
      <div className="mt-5">
        <RecentList />
      </div>
    </section>
  );
}
