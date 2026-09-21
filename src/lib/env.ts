// 빌드 때 들어가는 환경 값. 없으면 기본값을 쓴다.
export const env = {
  kakaoMapKey: import.meta.env.VITE_KAKAO_MAP_JS_KEY ?? '',
  reviewMode: import.meta.env.VITE_REVIEW_MODE === 'remote' ? 'remote' : 'local',
  fallbackRegion: {
    sidoCode: import.meta.env.VITE_FALLBACK_SIDO_CODE || '11',
    sigunguName: import.meta.env.VITE_FALLBACK_SIGUNGU_NAME || '마포구',
  },
} as const;
