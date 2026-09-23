// 화면 상태를 탭 안에서만 기억한다 (새로 고쳐도 유지 · 로그아웃하면 지움)
const KEYS = ['pawtrail.basis', 'pawtrail.region', 'pawtrail.weather.dismissed', 'pawtrail.search.cardCoords'] as const;
export type SessionKey = (typeof KEYS)[number];

export function readSession<T>(key: SessionKey): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession(key: SessionKey, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 기억한다
  }
}

export function clearSessionPrefs() {
  for (const key of KEYS) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // 무시
    }
  }
}
