import { useEffect, useState } from 'react';
import type { Coords } from './LocationProvider';

/** 걷는 동안 위치를 계속 받는다 (11장) — 권한이 있을 때만 켠다 */
export function useWatchedCoords(initial: Coords | null, enabled: boolean): Coords | null {
  const [coords, setCoords] = useState<Coords | null>(null);
  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);
  return coords ?? initial;
}
