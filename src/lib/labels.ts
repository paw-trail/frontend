/*
 * 서버 코드값을 화면 문구로. 근거는 API 대조표 1-8.
 * 그림에 적힌 문구가 있으면 그것을, 서버 라벨이 있으면 그것을 쓴다.
 */
import type {
  BreedSize,
  FacilityCode,
  NotifType,
  PlaceType,
  ReasonStatus,
  ReportStatus,
  ReportType,
  Verdict,
} from '@/api/types';

export const PLACE_TYPE_LABEL: Record<PlaceType, string> = {
  CAFE: '카페',
  RESTAURANT: '음식점',
  PARK: '공원',
  STAY: '숙소',
  CAMPING: '캠핑장',
  VET: '동물병원',
  LEISURE: '레저 · 체험',
  CULTURE: '문화시설',
  ETC: '관광지',
};

/** 메인의 카테고리 일곱 — 종류 9개를 빠짐없이 덮는다 */
export const PLACE_CATEGORIES: readonly { key: string; label: string; types: readonly PlaceType[] }[] = [
  { key: 'cafe', label: '카페', types: ['CAFE'] },
  { key: 'restaurant', label: '음식점', types: ['RESTAURANT'] },
  { key: 'park', label: '공원', types: ['PARK'] },
  { key: 'stay', label: '숙소/캠핑', types: ['STAY', 'CAMPING'] },
  { key: 'vet', label: '병원', types: ['VET'] },
  { key: 'leisure', label: '레저/체험/문화', types: ['LEISURE', 'CULTURE'] },
  { key: 'etc', label: '기타', types: ['ETC'] },
];

export const VERDICT_LABEL: Record<Verdict, string> = {
  ALLOWED: '동반 가능',
  CONDITIONAL: '조건부 가능',
  NOT_ALLOWED: '동반 불가',
  UNKNOWN: '확인 필요',
};

export const REASON_STATUS_MARK: Record<ReasonStatus, string> = {
  NOT_MET: '✗',
  MISSING: '?',
  CONDITION: '!',
  MET: '✓',
  INFO: 'i',
};

export const BREED_SIZE_LABEL: Record<BreedSize, string> = {
  SMALL: '소형견',
  MEDIUM: '중형견',
  LARGE: '대형견',
};

export const FACILITY_LABEL: Record<FacilityCode, string> = {
  PLAYGROUND: '전용 놀이 공간',
  PARKING: '주차 편의성',
  WALKING_TRAIL: '산책로',
  RESERVATION: '예약 가능',
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  INFO_WRONG: '정보 오류',
  CONDITION_WRONG: '조건 오류',
  PLACE_MERGED_WRONG: '잘못 병합됨',
  CLOSED: '폐업',
  REVIEW_ABUSE: '후기 신고',
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: '접수됨',
  ACCEPTED: '처리됨',
  REJECTED: '반려됨',
};

export const NOTIF_TYPE_LABEL: Record<NotifType, string> = {
  POLICY_CHANGED: '조건 변경',
  REPORT_RESOLVED: '제보 결과',
};

/** 판정 근거의 읽은 방식 (verdict evidence.extractionMethod) */
export const EXTRACTION_LABEL: Record<string, string> = {
  RULE: '공공데이터 항목',
  LLM: '안내문을 AI 가 읽음',
  MANUAL: '관리자 확인',
  MIXED: '공공데이터 항목 · 안내문',
};

/** 소스 코드 → 이름 (공공 소스 넷은 place 서버 라벨과 같게) */
/**
 * 원문 칸 이름 → 화면 문구 (ingest 의 DisplayBodyAssembler 가 쓰는 이름 그대로).
 * 문화정보원 CSV 처럼 칸 이름이 이미 한국어인 소스는 그대로 통과한다.
 */
export const ORIGIN_FIELD_LABEL: Record<string, string> = {
  // 한국관광공사 반려동물 동반여행
  acmpyTypeCd: '동반 유형',
  acmpyPsblCpam: '동반 가능 반려동물',
  acmpyNeedMtr: '동반 필수 준비물',
  etcAcmpyInfo: '기타 동반 안내',
  relaAcdntRiskMtr: '관련 사고 대비사항',
  relaPosesFclty: '관련 보유 시설',
  relaFrnshPrdlst: '비치 품목',
  relaPurcPrdlst: '구매 가능 품목',
  relaRntlPrdlst: '대여 가능 품목',
  overview: '개요',
  // 한국관광공사 고캠핑
  animalCmgCl: '반려동물 동반',
  lineIntro: '한 줄 소개',
  intro: '소개',
  tooltip: '안내',
  sbrsCl: '부대시설',
  posblFcltyCl: '주변 이용시설',
  // 관광공사 공통 소개 칸 가운데 자주 쓰이는 것
  chkpet: '반려동물 동반',
  chkpetculture: '반려동물 동반',
  chkpetleports: '반려동물 동반',
  chkpetshopping: '반려동물 동반',
};

/** 소스별 실제 자료 — 원문 화면과 근거 줄에서 「어느 자료인지」를 밝힌다 */
export const SOURCE_DATASET: Record<string, string> = {
  PET_TOUR: '반려동물 동반여행 API',
  GOCAMPING: '고캠핑 API',
  CULTURE_CSV: '반려동물 동반 가능 문화시설 CSV',
  MOIS_VET: '지방행정인허가 동물병원 CSV',
  MANUAL: '관리자가 확인해 고친 값',
  OWNER: '업장이 확인해 준 값',
};

/**
 * 출처 이름. 공모전 규정상 공사 명칭은 데이터 출처를 밝힐 때만 쓸 수 있고,
 * 그 형태는 「출처: ⓒ한국관광공사」 여야 한다 (API 서비스명만 단독으로 쓰지 않음 · 로고 이미지 금지).
 */
export const SOURCE_LABEL: Record<string, string> = {
  PET_TOUR: 'ⓒ한국관광공사',
  GOCAMPING: 'ⓒ한국관광공사',
  CULTURE_CSV: '한국문화정보원',
  MOIS_VET: '행정안전부 동물병원 인허가',
  MANUAL: '관리자 확인',
  OWNER: '업장 확인',
};

/** 제보 CONDITION_WRONG 의 fieldName (판정 줄의 항목 이름 · verdict ConditionField) → 화면 문구 */
export const CONDITION_FIELD_LABEL: Record<string, string> = {
  scope: '동반 범위',
  guideDogOnly: '안내견 한정',
  petOnly: '반려견 동반 전용',
  indoorAllowed: '실내 동반',
  outdoorAllowed: '실외 동반',
  maxWeightKg: '체중 제한',
  weightInclusive: '체중 기준',
  maxCount: '마릿수 제한',
  sizeRule: '크기 제한',
  breedRule: '견종 제한',
  carrierRequired: '이동장',
  leashRequired: '목줄',
  excludedZones: '동반 불가 구역',
  allowedZonesOnly: '동반 가능 구역',
  excludedDays: '동반 불가일',
  extraFeeAmount: '추가 요금',
  extraFeeUnit: '요금 기준',
  requiredItems: '준비물',
  vaccineProof: '접종 증명',
  advanceInquiry: '사전 문의',
};

/** 제보의 fieldName 을 화면 문구로 — 장소 정보 칸과 조건 항목을 모두 안다 */
export function reportFieldLabel(fieldName: string): string {
  return PLACE_FIELD_LABEL[fieldName] ?? CONDITION_FIELD_LABEL[fieldName] ?? fieldName;
}

/** 제보 INFO_WRONG 의 fieldName (장소 응답의 칸 이름) → 화면 문구 */
export const PLACE_FIELD_LABEL: Record<string, string> = {
  name: '장소 이름',
  address: '주소',
  tel: '전화번호',
  businessHours: '영업시간',
  closedDays: '휴무일',
  homepage: '홈페이지',
  overview: '장소 소개',
  imageUrl: '사진',
};
