import { useQuery } from '@tanstack/react-query';
import { CircleX, Cloud, CloudRain, CloudSun, Sun } from 'lucide-react';
import { useState } from 'react';
import { qk } from '@/api/keys';
import type { PrecipitationType, SkyCondition } from '@/api/types';
import { weatherApi, type WeatherQuery } from '@/api/weather';
import { useRegion } from '@/features/region/RegionProvider';
import { hourLabel } from '@/lib/format';
import { sidoShort } from '@/lib/regions';
import { readSession, writeSession } from '@/lib/storage';

const PTY_LABEL: Record<PrecipitationType, string> = {
  NONE: '',
  RAIN: '비',
  RAIN_SNOW: '비나 눈',
  SNOW: '눈',
  SHOWER: '소나기',
};

const SKY_LABEL: Record<SkyCondition, string> = { CLEAR: '맑음', MOSTLY_CLOUDY: '구름 많음', CLOUDY: '흐림' };
const SKY_ICON = { CLEAR: Sun, MOSTLY_CLOUDY: CloudSun, CLOUDY: Cloud };

const today = () => new Date().toISOString().slice(0, 10);

/**
 * 6장 날씨 띠 — 지금 지역 날씨를 늘 보여 준다.
 * 오늘 남은 시간에 비 · 눈 예보가 있으면 경고 색으로 바꾸고 닫을 수 있게 한다.
 * 그림은 「이번 주말」 이지만 날씨 서버는 오늘 하루만 준다.
 */
export function WeatherBanner() {
  const { region } = useRegion();
  const [dismissed, setDismissed] = useState(() => readSession<string>('pawtrail.weather.dismissed') === today());

  /*
   * 늘 검색하는 지역과 같은 기준으로 묻는다 — 지역을 바꾸면 날씨도 그 지역 것으로 바뀐다.
   * 좌표로 물으면 응답에 지역 이름이 없을 때가 있어 「지금 23°C」 처럼 어디 날씨인지 모르게 된다.
   */
  const query: WeatherQuery = region.sigunguName
    ? { sidoCode: region.sidoCode, sigunguName: region.sigunguName }
    : { sidoCode: region.sidoCode };

  const weather = useQuery({
    queryKey: qk.weather(query),
    queryFn: () => weatherApi.get(query),
    staleTime: 10 * 60_000,
    retry: false,
  });

  const w = weather.data;
  const rain = w?.rainToday && w.rainToday.type !== 'NONE' ? w.rainToday : null;
  if (!w) return null;

  // 서버가 맞춰 준 이름이 있으면 그것을, 없으면 고른 지역 이름을 쓴다
  const where = w.region?.sigunguName ?? query.sigunguName ?? sidoShort(undefined, query.sidoCode);

  // 비 · 눈 예보 — 닫아 두면 그날은 다시 띄우지 않는다
  if (rain && !dismissed) {
    return (
      <div role="status" className="flex h-[3.25rem] items-center justify-between bg-alert-soft px-16 text-alert">
        <p className="flex items-center gap-2.5 text-[0.9375rem] font-semibold">
          <CloudRain className="size-5" aria-hidden />
          {where ? `${where} ` : ''}오늘 {hourLabel(rain.firstAt)}부터 {PTY_LABEL[rain.type]} 예보 — 실내 동반 가능한 곳 미리 확인하세요!
        </p>
        <button
          type="button"
          aria-label="날씨 알림 닫기"
          onClick={() => {
            setDismissed(true);
            writeSession('pawtrail.weather.dismissed', today());
          }}
          className="rounded-full text-alert/80 hover:text-alert"
        >
          <CircleX className="size-5" />
        </button>
      </div>
    );
  }

  // 그 밖의 날 — 지금 기온과 하늘 상태를 차분히 적는다
  const Icon = w.sky ? SKY_ICON[w.sky] : CloudSun;
  const bits = [
    w.tmp !== null ? `${Math.round(w.tmp)}°C` : null,
    w.sky ? SKY_LABEL[w.sky] : null,
    w.pop !== null ? `강수확률 ${w.pop}%` : null,
    w.at ? `${hourLabel(w.at)} 기준` : null,
  ].filter(Boolean);
  if (bits.length === 0) return null;

  return (
    <div role="status" className="flex h-[3.25rem] items-center gap-2.5 bg-[#eef2ec] px-16 text-brand-strong">
      <Icon className="size-5" aria-hidden />
      <p className="text-[0.9375rem] font-semibold">
        {where ? `${where} 지금 ` : '지금 '}
        {bits.join(' · ')}
        {rain ? ` — 이따 ${hourLabel(rain.firstAt)}부터 ${PTY_LABEL[rain.type]} 예보` : ''}
      </p>
      {w.stale && <span className="text-[0.75rem] font-medium text-sub">갱신이 조금 늦어지고 있어요</span>}
    </div>
  );
}
