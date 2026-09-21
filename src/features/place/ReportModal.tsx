import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { commonMessage, isApiError } from '@/api/client';
import { reportsApi, type ReportBody } from '@/api/reports';
import type { Reason, ReportType } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { todayIso } from '@/lib/format';
import { PLACE_FIELD_LABEL, REPORT_TYPE_LABEL } from '@/lib/labels';

type Rule = 'req' | 'opt';
// report-service ReportType 의 칸 규칙 그대로 — 적히지 않은 칸은 보내면 400
const RULES: Record<ReportType, Partial<Record<'fieldName' | 'reportedValue' | 'visitedAt' | 'targetReviewId', Rule>>> = {
  INFO_WRONG: { fieldName: 'req', reportedValue: 'opt', visitedAt: 'opt' },
  CONDITION_WRONG: { fieldName: 'opt', reportedValue: 'opt', visitedAt: 'opt' },
  PLACE_MERGED_WRONG: { reportedValue: 'req' },
  CLOSED: { visitedAt: 'opt' },
  REVIEW_ABUSE: { targetReviewId: 'req' },
};

const PLACE_TYPES: ReportType[] = ['INFO_WRONG', 'CONDITION_WRONG', 'PLACE_MERGED_WRONG', 'CLOSED'];

/** 조건 제보에서 항목마다 고를 수 있는 「맞는 값」 — 판정 줄의 항목 이름(verdict ConditionField)을 따른다 */
const CONDITION_VALUE_OPTIONS: Record<string, string[]> = {
  scope: ['전 구역 동반 가능', '일부 구역만 동반 가능', '동반 불가'],
  guideDogOnly: ['안내견만 가능', '일반 반려견도 가능'],
  petOnly: ['반려견 동반 전용 시설', '일반 시설'],
  indoorAllowed: ['실내 동반 가능', '실내 동반 불가'],
  outdoorAllowed: ['실외 동반 가능', '실외 동반 불가'],
  weightInclusive: ['기준 체중 포함 (이하)', '기준 체중 미포함 (미만)'],
  sizeRule: ['소형견만 가능', '중형견까지 가능', '대형견도 가능', '크기 제한 없음'],
  breedRule: ['견종 제한 없음', '맹견 입마개 착용 필수', '맹견 동반 불가'],
  carrierRequired: ['이동장 필요', '이동장 필요 없음'],
  leashRequired: ['목줄 필요', '목줄 필요 없음'],
  extraFeeUnit: ['1마리당', '1회당', '1박당'],
  vaccineProof: ['접종 증명서 필요', '접종 증명서 필요 없음'],
  advanceInquiry: ['사전 문의 필요', '사전 문의 필요 없음'],
};

/** 숫자로 받는 조건 — 보낼 때 단위를 붙인다 */
const CONDITION_NUMBER_UNIT: Record<string, string> = { maxWeightKg: 'kg', maxCount: '마리', extraFeeAmount: '원' };

// 정보 오류에서 고를 칸 — 값은 장소 응답의 칸 이름 (17장 · 문의 내역이 같은 표로 읽음)
const INFO_FIELDS = Object.entries(PLACE_FIELD_LABEL);

const PLACEHOLDER: Record<ReportType, string> = {
  INFO_WRONG: '무엇이 어떻게 다른지 적어 주세요. 예) 전화번호가 바뀌었습니다.',
  CONDITION_WRONG: '실제로 겪은 동반 조건을 적어 주세요. 예) 10kg 넘는 강아지도 들어갈 수 있었습니다.',
  PLACE_MERGED_WRONG: '어떤 장소와 잘못 합쳐졌는지 적어 주세요.',
  CLOSED: '폐업을 확인한 방법을 적어 주세요. 예) 현장에 가 보니 문을 닫았습니다.',
  REVIEW_ABUSE: '신고하는 까닭을 적어 주세요.',
};

type Props = {
  placeId: string;
  reasons?: readonly Reason[];
  review?: { reviewId: string; author: string };
  onClose: () => void;
};

/** [정보가 틀렸어요] · 후기 [신고] — POST /reports */
export function ReportModal({ placeId, reasons = [], review, onClose }: Props) {
  const [type, setType] = useState<ReportType>(review ? 'REVIEW_ABUSE' : 'INFO_WRONG');
  const [fieldName, setFieldName] = useState('');
  const [reportedValue, setReportedValue] = useState('');
  const [visitedAt, setVisitedAt] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rule = RULES[type];

  const send = useMutation({
    mutationFn: (body: ReportBody) => reportsApi.create(body),
    onError: (e) => {
      if (isApiError(e, 'REPORT_ALREADY_PENDING')) setError('같은 내용으로 보낸 제보가 아직 처리 중입니다.');
      else if (isApiError(e, 'REPORT_DAILY_LIMIT')) setError('오늘 보낼 수 있는 제보를 모두 보냈습니다. 내일 다시 보내 주세요.');
      else if (isApiError(e, 'VALIDATION_FAILED')) setError(e.fieldErrors[0]?.message ?? '적은 내용을 다시 확인해 주세요.');
      else setError(commonMessage(e));
    },
  });

  const submit = () => {
    setError(null);
    if (!content.trim()) return setError('내용을 적어 주세요.');
    if (rule.fieldName === 'req' && !fieldName) return setError('틀린 항목을 골라 주세요.');
    if (rule.reportedValue === 'req' && !reportedValue.trim()) return setError('잘못 합쳐진 장소를 적어 주세요.');
    const body: ReportBody = { placeId, reportType: type, content: content.trim() };
    if (rule.fieldName && fieldName) body.fieldName = fieldName;
    if (rule.reportedValue && reportedValue.trim()) {
      const unit = type === 'CONDITION_WRONG' ? CONDITION_NUMBER_UNIT[fieldName] : undefined;
      body.reportedValue = unit ? `${reportedValue.trim()}${unit}` : reportedValue.trim();
    }
    if (rule.visitedAt && visitedAt) body.visitedAt = visitedAt;
    if (rule.targetReviewId && review) body.targetReviewId = review.reviewId;
    send.mutate(body);
  };

  if (send.isSuccess) {
    return (
      <Modal title="제보를 보냈습니다" onClose={onClose} actions={<Button onClick={onClose}>확인</Button>}>
        관리자가 확인한 뒤 처리 결과를 알림으로 알려 드립니다.
      </Modal>
    );
  }

  const input = 'h-11 w-full rounded-[0.625rem] border border-line bg-field px-3.5 text-[0.9375rem] text-ink outline-none focus:border-brand focus-visible:outline-none';

  return (
    <Modal
      title={review ? '후기 신고' : '정보가 틀렸어요'}
      size="md"
      onClose={onClose}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={submit} disabled={send.isPending}>
            {send.isPending ? '보내는 중' : '제보 보내기'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pt-2 text-ink">
        {review ? (
          <p className="text-[0.875rem] text-sub">{review.author} 님의 후기를 신고합니다.</p>
        ) : (
          <div>
            <p className="mb-1.5 text-[0.875rem] font-semibold">무엇이 틀렸나요?</p>
            <div className="grid grid-cols-4 gap-2">
              {PLACE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={type === t}
                  onClick={() => {
                    setType(t);
                    setFieldName('');
                  }}
                  className={`h-10 rounded-[0.625rem] border text-[0.875rem] font-semibold ${
                    type === t ? 'border-brand-strong bg-brand-strong text-white' : 'border-line bg-white hover:bg-field'
                  }`}
                >
                  {REPORT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        {rule.fieldName && (
          <label className="block">
            <span className="mb-1.5 block text-[0.875rem] font-semibold">
              {type === 'INFO_WRONG' ? '틀린 항목' : '틀린 조건 (선택)'}
            </span>
            <select
              value={fieldName}
              onChange={(e) => {
                setFieldName(e.target.value);
                setReportedValue('');
              }}
              className={input}
            >
              <option value="">{type === 'INFO_WRONG' ? '항목을 골라 주세요' : '조건을 고르지 않음'}</option>
              {(type === 'INFO_WRONG' ? INFO_FIELDS : reasons.map((r) => [r.field, r.label] as [string, string])).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        )}
        {rule.reportedValue && (
          <label className="block">
            <span className="mb-1.5 block text-[0.875rem] font-semibold">
              {type === 'PLACE_MERGED_WRONG' ? '잘못 합쳐진 장소' : '맞는 값 (선택)'}
            </span>
            {type === 'CONDITION_WRONG' && CONDITION_VALUE_OPTIONS[fieldName] ? (
              <select value={reportedValue} onChange={(e) => setReportedValue(e.target.value)} className={input}>
                <option value="">값을 고르지 않음</option>
                {CONDITION_VALUE_OPTIONS[fieldName].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : type === 'CONDITION_WRONG' && CONDITION_NUMBER_UNIT[fieldName] ? (
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={reportedValue}
                  onChange={(e) => setReportedValue(e.target.value)}
                  className={input}
                  placeholder="숫자만 입력"
                />
                <span className="shrink-0 text-[0.875rem] text-sub">{CONDITION_NUMBER_UNIT[fieldName]}</span>
              </span>
            ) : (
              <input
                value={reportedValue}
                maxLength={500}
                onChange={(e) => setReportedValue(e.target.value)}
                className={input}
                placeholder={type === 'CONDITION_WRONG' && fieldName ? '예) 실내 전시관은 동반 불가' : undefined}
              />
            )}
          </label>
        )}
        {rule.visitedAt && (
          <label className="block">
            <span className="mb-1.5 block text-[0.875rem] font-semibold">방문한 날 (선택)</span>
            <input type="date" value={visitedAt} max={todayIso()} onChange={(e) => setVisitedAt(e.target.value)} className={input} />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-[0.875rem] font-semibold">내용</span>
          <textarea
            value={content}
            maxLength={1000}
            rows={4}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER[type]}
            className="w-full resize-none rounded-[0.625rem] border border-line bg-field px-3.5 py-3 text-[0.9375rem] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-brand focus-visible:outline-none"
          />
          <span className="mt-1 block text-right text-[0.75rem] text-faint">{content.length} / 1000</span>
        </label>
        {error && (
          <p role="alert" className="rounded-[0.625rem] bg-alert-soft px-3.5 py-2.5 text-[0.8125rem] text-alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
