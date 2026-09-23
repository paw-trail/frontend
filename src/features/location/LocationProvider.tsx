import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type Coords = { lat: number; lon: number };

export type LocationState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'granted'; coords: Coords }
  | { status: 'denied' }
  | { status: 'unavailable' };

type LocationContextValue = { state: LocationState; request: () => void };

const LocationContext = createContext<LocationContextValue | null>(null);

/**
 * 브라우저 위치. 스플래시에서 한 번 묻는다.
 * 거부하면 서비스가 정한 고정 지역(env.fallbackRegion)을 쓴다 — 사용자 지역을 저장하는 칸은 서버에 없다.
 */
export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationState>({ status: 'idle' });
  const started = useRef(false);

  const request = useCallback(() => {
    if (started.current) return;
    started.current = true;
    if (!('geolocation' in navigator)) {
      setState({ status: 'unavailable' });
      return;
    }
    setState({ status: 'pending' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ status: 'granted', coords: { lat: pos.coords.latitude, lon: pos.coords.longitude } }),
      (err) => setState({ status: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  }, []);

  const value = useMemo(() => ({ state, request }), [state, request]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationState(): LocationContextValue {
  const value = useContext(LocationContext);
  if (!value) throw new Error('LocationProvider 안에서만 쓸 수 있습니다.');
  return value;
}
