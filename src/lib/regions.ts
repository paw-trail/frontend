// 시도 이름을 칩에 쓰는 짧은 이름으로 — 앞 두 글자로 자르면 충청북도가 「충청」 이 되어 표를 둔다
const SHORT_BY_NAME: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천', 광주광역시: '광주',
  대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종', 경기도: '경기',
  강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남',
  전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주특별자치도: '제주', 제주도: '제주',
};

// 지역 목록을 받기 전에 쓸 이름 (법정동 시도 코드)
const SHORT_BY_CODE: Record<string, string> = {
  '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산',
  '36': '세종', '41': '경기', '42': '강원', '51': '강원', '43': '충북', '44': '충남', '45': '전북',
  '52': '전북', '46': '전남', '47': '경북', '48': '경남', '50': '제주',
};

export function sidoShort(sidoName: string | undefined, sidoCode?: string): string {
  if (sidoName && SHORT_BY_NAME[sidoName]) return SHORT_BY_NAME[sidoName];
  if (sidoCode && SHORT_BY_CODE[sidoCode]) return SHORT_BY_CODE[sidoCode];
  return sidoName ?? '';
}

/** 메인 인기 지역 칩 — 그림의 5개 (대조표 2/4 안 A). 지역 목록에 있는 것만 보인다 */
export const POPULAR_REGION_LABELS = ['양평', '가평', '남양주', '춘천', '강릉'] as const;
