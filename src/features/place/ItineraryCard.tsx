import { useMutation } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, Clock, PawPrint } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { commonMessage, isApiError } from '@/api/client';
import { itinerariesApi } from '@/api/itineraries';
import type { Pet } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { formatDateWithWeekday, formatTimeKo, todayIso } from '@/lib/format';

/** 8장 오른쪽 「일정 추가」 — POST /itineraries (visitAt 은 시간대 없이) */
export function ItineraryCard({ placeId, pets, initialPetId }: { placeId: string; pets: Pet[]; initialPetId: string | null }) {
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('13:00');
  const [petId, setPetId] = useState(initialPetId ?? pets[0]?.petId ?? '');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const add = useMutation({
    mutationFn: () => itinerariesApi.add({ placeId, visitAt: `${date}T${time}:00`, petId: petId || undefined }),
    onSuccess: () => setMessage({ ok: true, text: '내 일정에 추가했습니다.' }),
    onError: (e) =>
      setMessage({
        ok: false,
        text: isApiError(e, 'ITINERARY_DUPLICATE')
          ? '같은 시각에 이미 담아 둔 장소입니다.'
          : isApiError(e, 'PET_NOT_FOUND')
            ? '반려동물 정보를 다시 불러와 주세요.'
            : commonMessage(e),
      }),
  });

  return (
    <section className="rounded-2xl bg-white p-6 shadow-card">
      <h2 className="text-[1.25rem] font-bold text-ink">일정 추가</h2>

      <Field label="방문 예정 일자" icon={<CalendarDays className="size-[1.1rem]" />}>
        {formatDateWithWeekday(date)}
        <input
          type="date"
          aria-label="방문 예정 일자"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          onClick={(e) => e.currentTarget.showPicker?.()}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </Field>
      <Field label="방문 예상 시간" icon={<Clock className="size-[1.1rem]" />}>
        {formatTimeKo(time)}
        <input
          type="time"
          aria-label="방문 예상 시간"
          value={time}
          step={600}
          onChange={(e) => e.target.value && setTime(e.target.value)}
          onClick={(e) => e.currentTarget.showPicker?.()}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </Field>
      {pets.length > 0 && (
        <Field label="방문 예정 동물" icon={<PawPrint className="size-[1.1rem]" />} trailing={<ChevronDown className="size-4 text-sub" />}>
          {(() => {
            const p = pets.find((x) => x.petId === petId);
            return p ? `${p.breedName} ${p.name} (${p.weightKg}kg)` : '반려동물 고르기';
          })()}
          <select
            aria-label="방문 예정 동물"
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {pets.map((p) => (
              <option key={p.petId} value={p.petId}>
                {p.breedName} {p.name} ({p.weightKg}kg)
              </option>
            ))}
          </select>
        </Field>
      )}

      <Button size="lg" className="mt-6 w-full" disabled={add.isPending} onClick={() => add.mutate()}>
        {add.isPending ? '추가하는 중' : '내 일정에 추가하기'}
      </Button>
      {message && (
        <p role="status" className={`mt-3 text-[0.8125rem] ${message.ok ? 'text-ok' : 'text-alert'}`}>
          {message.text}
          {message.ok && (
            <Link to="/itinerary" className="ml-2 font-semibold text-brand-strong underline underline-offset-2">
              일정 보기
            </Link>
          )}
        </p>
      )}
    </section>
  );
}

function Field({ label, icon, trailing, children }: { label: string; icon: ReactNode; trailing?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-1.5 text-[0.875rem] font-bold text-ink">{label}</p>
      <div className="relative flex h-12 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 text-[0.9375rem] text-ink focus-within:border-brand">
        <span className="text-sub">{icon}</span>
        <span className="flex-1">{children}</span>
        {trailing}
      </div>
    </div>
  );
}
