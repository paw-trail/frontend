import { Outlet, useLocation } from 'react-router';
import { BasisProvider } from '@/features/basis/BasisProvider';
import { WeatherBanner } from '@/features/main/WeatherBanner';
import { RegionProvider } from '@/features/region/RegionProvider';
import { Header } from './Header';

/** 날씨 띠를 띄우는 화면 — 장소를 찾고 다니는 화면에만 둔다 (마이페이지 · 알림 · 관리자에는 없음) */
const WEATHER_PATHS = ['/', '/search', '/places/', '/itinerary', '/recent'];

export function AppLayout() {
  const { pathname } = useLocation();
  const showWeather = WEATHER_PATHS.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)));

  return (
    <BasisProvider>
      <RegionProvider>
        <div className="flex min-h-screen flex-col bg-cream">
          <Header />
          {showWeather && (
            <div className="shell shrink-0">
              <WeatherBanner />
            </div>
          )}
          <div className="shell flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </RegionProvider>
    </BasisProvider>
  );
}
