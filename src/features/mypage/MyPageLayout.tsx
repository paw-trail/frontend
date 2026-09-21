import { ChevronRight } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { ProfileCard } from './ProfileCard';

// 12~16장 왼쪽 메뉴 8개 — 계정 관리 · 알림 설정 · 문의 내역은 그림이 없는 화면 (대조표 4/4)
const MENU: [string, string][] = [
  ['/mypage', '동반 기록'],
  ['/mypage/pets', '반려동물 정보 수정'],
  ['/mypage/recent', '최근 본 장소'],
  ['/mypage/visited', '방문한 장소'],
  ['/mypage/reviews', '작성한 후기'],
  ['/mypage/favorites', '즐겨찾기'],
  ['/mypage/account', '계정 관리'],
  ['/mypage/notifications', '알림 설정'],
  ['/mypage/inquiries', '문의 내역'],
];

/** 12~16장 공통 틀 — 위 프로필 카드 · 왼쪽 메뉴 · 가운데 내용 */
export function MyPageLayout() {
  return (
    <main className="px-16 pb-16 pt-8">
      <ProfileCard />
      <div className="mt-6 grid grid-cols-[15.5rem_minmax(0,1fr)] items-start gap-7">
        <nav aria-label="마이페이지" className="rounded-2xl bg-white py-2.5 shadow-card">
          {MENU.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `mx-2 flex items-center justify-between rounded-lg px-3.5 py-2.5 text-[0.9375rem] transition-colors ${
                  isActive ? 'bg-brand-soft font-semibold text-ink' : 'text-sub hover:bg-field hover:text-ink'
                }`
              }
            >
              {label}
              <ChevronRight className="size-4 text-faint" aria-hidden />
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
