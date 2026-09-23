/*
 * 서버가 받아 주지 않던 동안 브라우저에 담아 두던 값을 지운다.
 *
 * 후기는 review 서버에, 사진은 S3 에 저장되므로 옛 저장분은 아무도 읽지 않는다.
 * 둘 다 사진이 data URL 로 들어 있어 자리만 차지하고, 개발자 도구에 없어진 기능의 잔재로 남는다.
 * 배포하고 한 번 돌고 나면 이 파일과 부르는 줄을 지운다.
 */
const LEGACY_KEYS = [
  'pawtrail.reviews.v1',
  // 사진 올리기가 막혀 있던 동안 담아 두던 반려동물 · 프로필 사진
  'pawtrail.localPhotos.v1',
];

export function cleanupLegacyStorage(): void {
  for (const key of LEGACY_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 저장소를 못 쓰는 브라우저면 그냥 넘어간다
    }
  }
}
