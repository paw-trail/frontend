import { useQuery } from '@tanstack/react-query';
import { placesApi } from '@/api/places';
import type { PlaceDocument } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateKo } from '@/lib/format';
import { SOURCE_DATASET, SOURCE_LABEL } from '@/lib/labels';

/**
 * 원문은 소스마다 「[라벨] 값」 줄과 「- 항목」 줄, 그리고 줄글이 섞여 온다.
 * 그대로 뿌리면 읽기 어려워 라벨 · 값 · 항목 · 줄글로 갈라 그린다.
 */
type Block = { kind: 'field'; label: string; value: string; items: string[] } | { kind: 'text'; text: string };

function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  // 관광공사 소개 칸(주차 · 이용 시간 등)에는 <br> 태그가 섞여 온다 — 줄바꿈으로 읽는다
  const text = body.replace(/<br\s*\/?>/gi, '\n');
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    const field = /^\[([^\]]+)]\s*(.*)$/.exec(line);
    if (field) {
      blocks.push({ kind: 'field', label: field[1], value: field[2], items: [] });
      continue;
    }

    const bullet = /^[-·•]\s*(.+)$/.exec(line);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last && last.kind === 'field') last.items.push(bullet[1]);
      else blocks.push({ kind: 'text', text: bullet[1] });
      continue;
    }

    const last = blocks[blocks.length - 1];
    if (last && last.kind === 'text') last.text = `${last.text} ${line}`;
    else blocks.push({ kind: 'text', text: line });
  }
  return blocks;
}

function dateLine(d: PlaceDocument): string {
  const parts: string[] = [];
  if (d.sourceModifiedAt) parts.push(`원문 수정 ${formatDateKo(d.sourceModifiedAt)}`);
  if (d.fetchedAt) parts.push(`가져온 날 ${formatDateKo(d.fetchedAt)}`);
  return parts.join(' · ');
}

function Document({ doc }: { doc: PlaceDocument }) {
  const blocks = parseBody(doc.body ?? '');
  const dates = dateLine(doc);

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-field px-5 py-3">
        <p className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[0.75rem] font-bold text-brand-strong">
            {SOURCE_LABEL[doc.source] ?? doc.sourceLabel}
          </span>
          {SOURCE_DATASET[doc.source] && <span className="shrink-0 text-[0.75rem] text-sub">{SOURCE_DATASET[doc.source]}</span>}
          {doc.title && <span className="truncate text-[0.875rem] font-semibold text-ink">{doc.title}</span>}
        </p>
        {dates && <span className="shrink-0 text-[0.75rem] text-faint">{dates}</span>}
      </header>

      {blocks.length === 0 ? (
        <p className="px-5 py-6 text-center text-[0.875rem] text-faint">본문이 비어 있습니다.</p>
      ) : (
        <dl className="space-y-3 px-5 py-4">
          {blocks.map((b, i) =>
            b.kind === 'field' && !b.value && b.items.length === 0 ? (
              // 값 없이 제목만 있는 항목 (개요 등) — 다음 줄글의 머리로 쓴다
              <p key={i} className="pt-2 text-[0.8125rem] font-bold text-ink">{b.label}</p>
            ) : b.kind === 'field' ? (
              <div key={i} className="grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-x-4">
                <dt className="text-[0.8125rem] text-sub">{b.label}</dt>
                <dd className="text-[0.875rem] leading-[1.6] text-ink">
                  {b.value || (b.items.length ? '' : '—')}
                  {b.items.length > 0 && (
                    <ul className={b.value ? 'mt-1.5 space-y-1' : 'space-y-1'}>
                      {b.items.map((it, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="text-faint">·</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            ) : (
              <p key={i} className="whitespace-pre-line pt-1 text-[0.875rem] leading-[1.8] text-sub">
                {b.text}
              </p>
            ),
          )}
        </dl>
      )}
    </article>
  );
}

/** [근거 원문 전체 보기] — 판정에 쓴 소스별 원문 (GET /places/{id}/documents) */
export function DocumentsModal({ placeId, onClose }: { placeId: string; onClose: () => void }) {
  const docs = useQuery({ queryKey: ['placeDocuments', placeId], queryFn: () => placesApi.documents(placeId), staleTime: 5 * 60_000 });

  return (
    <Modal title="근거 원문" size="lg" onClose={onClose} actions={<Button variant="outline" onClick={onClose}>닫기</Button>}>
      {docs.isPending ? (
        <p className="py-10 text-center text-faint">불러오는 중</p>
      ) : docs.isError ? (
        <p className="py-10 text-center text-alert">원문을 불러오지 못했습니다.</p>
      ) : docs.data.documents.length === 0 ? (
        <p className="py-10 text-center">이 장소에 남아 있는 원문이 없습니다.</p>
      ) : (
        <div className="space-y-4 pt-2">
          <p className="text-[0.8125rem] text-sub">판정에 쓴 자료를 소스별로 그대로 보여 드립니다. 값은 공공데이터에 적힌 그대로입니다.</p>
          {docs.data.documents.map((d, i) => (
            <Document key={`${d.source}-${i}`} doc={d} />
          ))}
        </div>
      )}
    </Modal>
  );
}
