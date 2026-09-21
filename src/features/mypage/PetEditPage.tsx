import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { commonMessage, isApiError } from '@/api/client';
import { qk } from '@/api/keys';
import { PhotoUploadError, petsApi, type PetUpdateBody } from '@/api/pets';
import type { BreedSize, Pet } from '@/api/types';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/Button';
import { ChoiceGroup, ToggleButton } from '@/components/ui/ChoiceGroup';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { usePets, useProfile } from '@/features/auth/session';
import { PhotoPicker } from '@/features/pets/PhotoPicker';
import { petKey, removeLocalPhoto, saveLocalPhoto, useLocalPhoto } from '@/features/pets/petPhotoStore';
import { WEIGHT_PATTERN, sizeFromWeight } from '@/features/pets/petRules';
import { withJosa } from '@/lib/format';
import { applyFieldErrors } from '@/lib/forms';
import { BREED_SIZE_LABEL } from '@/lib/labels';

type Form = {
  name: string;
  weightKg: string;
  breedCode: string;
  breedSize: BreedSize | '';
  vaccineCompleted: boolean | null;
  vaccineProofAvailable: boolean | null;
  hasCarrier: boolean;
  hasStroller: boolean;
  note: string;
};

const EMPTY: Form = {
  name: '',
  weightKg: '',
  breedCode: '',
  breedSize: '',
  vaccineCompleted: null,
  vaccineProofAvailable: null,
  hasCarrier: false,
  hasStroller: false,
  note: '',
};

const toForm = (p: Pet | null): Form =>
  p
    ? {
        name: p.name,
        weightKg: String(p.weightKg),
        breedCode: p.breedCode,
        breedSize: p.breedSize ?? sizeFromWeight(p.weightKg),
        vaccineCompleted: p.vaccineCompleted,
        vaccineProofAvailable: p.vaccineProofAvailable,
        hasCarrier: p.hasCarrier,
        hasStroller: p.hasStroller,
        note: p.note ?? '',
      }
    : EMPTY;


/**
 * 명세서 13장 반려동물 정보 수정.
 * 저장은 바뀐 칸만 보낸다 (PATCH 는 보낸 칸만 바꾸고 사진 · 메모만 null 로 지움).
 * user 가 반려동물 삭제 이벤트를 받지 않아, 대표를 지우면 화면이 대표를 다시 정한다 (대조표 3/4 4-2).
 */
export function PetEditPage() {
  const queryClient = useQueryClient();
  const profile = useProfile();
  const pets = usePets();
  const breeds = useQuery({ queryKey: qk.breeds, queryFn: petsApi.breeds, staleTime: Infinity });

  const list = useMemo(() => pets.data ?? [], [pets.data]);
  const defaultPet = list.find((p) => p.petId === profile.data?.defaultPetId) ?? list[0] ?? null;
  const tabs = defaultPet ? [defaultPet, ...list.filter((p) => p.petId !== defaultPet.petId)] : list;

  const [selected, setSelected] = useState<string | 'new' | null>(null);
  const current = selected === 'new' ? null : (list.find((p) => p.petId === selected) ?? defaultPet);
  const isNew = current === null;

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);

  const { register, control, handleSubmit, setValue, watch, reset, setError, formState: { errors, isSubmitting } } = useForm<Form>({
    defaultValues: toForm(current),
  });

  // 탭을 바꾸면 양식을 그 아이의 값으로 다시 채운다
  useEffect(() => {
    reset(toForm(current));
    setPhoto(null);
    setPhotoRemoved(false);
    setPhotoError(null);
  }, [current?.petId, isNew, reset]);

  const weight = watch('weightKg');
  const breedCode = watch('breedCode');
  const breedSize = watch('breedSize');
  const vaccineCompleted = watch('vaccineCompleted');
  const hasCarrier = watch('hasCarrier');
  const hasStroller = watch('hasStroller');
  const note = watch('note');
  const localOrServerPhoto = useLocalPhoto(petKey(current?.petId ?? ''), current?.photoUrl);

  useEffect(() => {
    if (!WEIGHT_PATTERN.test(weight.trim())) return;
    const w = Number(weight);
    if (w > 0) setValue('breedSize', sizeFromWeight(w));
  }, [weight, setValue]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.pets }),
      queryClient.invalidateQueries({ queryKey: qk.profile }),
    ]);
  };

  const onSubmit = handleSubmit(async (v) => {
    setMessage(null);
    setPhotoError(null);
    try {
      if (isNew) {
        let photoUrl: string | undefined;
        let keepLocally: File | null = null;
        if (photo) {
          try {
            photoUrl = await petsApi.uploadPhoto(photo);
          } catch (e) {
            if (!(e instanceof PhotoUploadError)) throw e;
            keepLocally = photo;
          }
        }
        const created = await petsApi.create({
          name: v.name.trim(),
          breedCode: v.breedCode,
          weightKg: Number(v.weightKg),
          // 크기는 보내지 않는다 — 서버가 몸무게로 정한다
          hasCarrier: v.hasCarrier,
          hasStroller: v.hasStroller,
          vaccineCompleted: v.vaccineCompleted === true,
          vaccineProofAvailable: v.vaccineProofAvailable === true,
          photoUrl,
          note: v.note.trim() || undefined,
        });
        if (keepLocally) await saveLocalPhoto(petKey(created.petId), keepLocally);
        const defaultMissing = !profile.data?.defaultPetId || !list.some((p) => p.petId === profile.data?.defaultPetId);
        if (defaultMissing) await usersApi.setDefaultPet(created.petId).catch(() => undefined);
        await refresh();
        setSelected(created.petId);
        setMessage({ ok: true, text: `${created.name} 등록을 마쳤습니다.` });
        return;
      }

      const before = toForm(current);
      const body: PetUpdateBody = {};
      if (v.name.trim() !== before.name) body.name = v.name.trim();
      if (v.breedCode !== before.breedCode) body.breedCode = v.breedCode;
      if (Number(v.weightKg) !== Number(before.weightKg)) body.weightKg = Number(v.weightKg);
      // 크기는 보내지 않는다 — 몸무게가 바뀌면 서버가 다시 정한다
      if (v.hasCarrier !== before.hasCarrier) body.hasCarrier = v.hasCarrier;
      if (v.hasStroller !== before.hasStroller) body.hasStroller = v.hasStroller;
      if (v.vaccineCompleted !== before.vaccineCompleted) body.vaccineCompleted = v.vaccineCompleted === true;
      if (v.vaccineProofAvailable !== before.vaccineProofAvailable) body.vaccineProofAvailable = v.vaccineProofAvailable === true;
      let photoKeptLocally = false;
      if (photo) {
        try {
          body.photoUrl = await petsApi.uploadPhoto(photo);
          removeLocalPhoto(petKey(current.petId));
        } catch (e) {
          if (!(e instanceof PhotoUploadError)) throw e;
          await saveLocalPhoto(petKey(current.petId), photo);
          photoKeptLocally = true;
        }
      } else if (photoRemoved) {
        if (current.photoUrl) body.photoUrl = null;
        removeLocalPhoto(petKey(current.petId));
      }
      const nextNote = v.note.trim();
      if (nextNote !== before.note.trim()) body.note = nextNote === '' ? null : nextNote;

      if (Object.keys(body).length === 0) {
        // 사진만 바꿨는데 저장소로 못 올려 이 브라우저에 담은 경우도 바뀐 것이다
        setMessage({ ok: true, text: photoKeptLocally ? '사진을 바꿨습니다.' : '바뀐 내용이 없습니다.' });
        if (photoKeptLocally) setPhoto(null);
        return;
      }
      await petsApi.update(current.petId, body);
      await refresh();
      setPhoto(null);
      setPhotoRemoved(false);
      setMessage({ ok: true, text: '저장했습니다.' });
    } catch (error) {
      if (error instanceof PhotoUploadError) setPhotoError('사진을 올리지 못했습니다. 사진을 빼고 저장하거나 잠시 후 다시 시도해 주세요.');
      else if (isApiError(error, 'PET_NOT_FOUND')) setMessage({ ok: false, text: '이미 지워진 반려동물입니다. 목록을 새로 불러왔습니다.' });
      else if (!applyFieldErrors(error, setError, ['name', 'breedCode', 'weightKg', 'note'])) setMessage({ ok: false, text: commonMessage(error) });
      if (isApiError(error, 'PET_NOT_FOUND')) await refresh();
    }
  });

  const makeDefault = async () => {
    if (!current) return;
    setWorking(true);
    setMessage(null);
    try {
      await usersApi.setDefaultPet(current.petId);
      await refresh();
      setMessage({ ok: true, text: `${withJosa(current.name, '를', '을')} 대표로 지정했습니다.` });
    } catch (e) {
      setMessage({ ok: false, text: commonMessage(e) });
    } finally {
      setWorking(false);
    }
  };

  const removePet = async () => {
    if (!current) return;
    setWorking(true);
    setMessage(null);
    try {
      await petsApi.remove(current.petId);
      if (current.petId === defaultPet?.petId) {
        const next = list.find((p) => p.petId !== current.petId);
        await usersApi.setDefaultPet(next?.petId ?? null).catch(() => undefined);
      }
      await refresh();
      setSelected(null);
      setConfirmDelete(false);
      setMessage({ ok: true, text: `${current.name}의 정보를 지웠습니다.` });
    } catch (e) {
      setConfirmDelete(false);
      setMessage({ ok: false, text: commonMessage(e) });
    } finally {
      setWorking(false);
    }
  };

  const breedOptions = (breeds.data ?? []).map((b) => ({ value: b.code, label: b.nameKo }));

  return (
    <section>
      <h1 className="text-[1.875rem] font-bold tracking-[-0.01em] text-ink">반려동물 정보 수정</h1>

      <div className="mt-4 flex flex-wrap gap-2 rounded-xl bg-[#eef1ec] p-2">
        {tabs.map((p) => {
          const on = !isNew && current?.petId === p.petId;
          return (
            <button
              key={p.petId}
              type="button"
              aria-pressed={on}
              onClick={() => setSelected(p.petId)}
              className={`h-10 rounded-lg px-4 text-[0.9375rem] font-semibold transition-colors ${
                on ? 'bg-brand-strong text-white' : 'border border-line bg-white text-ink hover:bg-field'
              }`}
            >
              {p.petId === defaultPet?.petId ? `[대표] ${p.name}` : p.name}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={isNew}
          onClick={() => setSelected('new')}
          className={`flex h-10 items-center gap-1 rounded-lg border px-4 text-[0.9375rem] font-semibold transition-colors ${
            isNew ? 'border-brand-strong bg-brand-strong text-white' : 'border-brand bg-white text-brand-strong hover:bg-brand-soft'
          }`}
        >
          <Plus className="size-4" aria-hidden />
          추가
        </button>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-5 rounded-[1.25rem] bg-white px-8 py-7 shadow-card">
        <h2 className="text-[1.375rem] font-bold text-ink">{isNew ? '새 반려동물 등록' : '우리아이 기본정보'}</h2>

        <div className="mt-5 grid grid-cols-2 gap-x-8">
          <div>
            <div className="h-[15.5rem]">
              <PhotoPicker
                file={photo}
                onChange={setPhoto}
                error={photoError}
                onError={setPhotoError}
                existingUrl={!isNew && !photoRemoved ? localOrServerPhoto : null}
                onRemoveExisting={() => setPhotoRemoved(true)}
              />
            </div>
            <SelectField
              className="mt-8"
              label="종"
              placeholder="예) 말티즈"
              current={breedCode}
              options={breedOptions}
              error={errors.breedCode?.message ?? (breeds.isError ? '견종 목록을 불러오지 못했습니다.' : undefined)}
              {...register('breedCode', { required: '종을 골라 주세요.' })}
            />
          </div>

          <div className="space-y-3.5">
            <TextField
              label="반려동물 이름"
              size="lg"
              placeholder="예) 초코, 뭉치"
              maxLength={30}
              error={errors.name?.message}
              {...register('name', {
                validate: (x) => (x.trim() ? x.trim().length <= 30 || '이름은 30자를 넘을 수 없습니다.' : '이름을 입력해 주세요.'),
              })}
            />
            <TextField
              label="몸무게 (kg)"
              size="lg"
              inputMode="decimal"
              placeholder="예) 5.4"
              error={errors.weightKg?.message}
              {...register('weightKg', {
                validate: (x) => {
                  const t = x.trim();
                  if (!t) return '몸무게를 입력해 주세요.';
                  const n = Number(t);
                  return (WEIGHT_PATTERN.test(t) && n > 0 && n <= 200) || '0보다 크고 200 이하로, 소수 첫째 자리까지 적어 주세요.';
                },
              })}
            />
            <Controller
              name="vaccineCompleted"
              control={control}
              rules={{ validate: (x) => x !== null || '접종 여부를 골라 주세요.' }}
              render={({ field, fieldState }) => (
                <ChoiceGroup
                  label="접종 여부"
                  value={field.value}
                  options={[
                    { value: false, label: '미접종' },
                    { value: true, label: '접종 완료' },
                  ]}
                  error={fieldState.error?.message}
                  onChange={(x) => {
                    field.onChange(x);
                    setValue('vaccineProofAvailable', x ? null : false);
                  }}
                />
              )}
            />
            <Controller
              name="vaccineProofAvailable"
              control={control}
              rules={{ validate: (x, all) => all.vaccineCompleted === false || x !== null || '증명서 보유 여부를 골라 주세요.' }}
              render={({ field, fieldState }) => (
                <ChoiceGroup
                  label="접종 증명서를 가지고 있나요?"
                  value={field.value}
                  options={[
                    { value: false, label: '없음' },
                    { value: true, label: '있음' },
                  ]}
                  disabled={vaccineCompleted === false}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                />
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1.5 text-[0.8125rem] font-semibold text-ink">크기</p>
                <div className="flex h-11 items-center rounded-[0.625rem] border border-line bg-field px-3.5 text-[0.9375rem] text-ink">
                  {breedSize ? BREED_SIZE_LABEL[breedSize] : '몸무게를 넣으면 정해집니다'}
                </div>
                <p className="mt-1 text-[0.8125rem] text-faint">몸무게에 따라 자동으로 정해집니다</p>
              </div>
              <div>
                <p className="mb-1.5 text-[0.8125rem] font-semibold text-ink">동반 장비</p>
                <div className="grid grid-cols-2 gap-2">
                  <ToggleButton pressed={hasCarrier} onClick={() => setValue('hasCarrier', !hasCarrier)}>
                    이동장
                  </ToggleButton>
                  <ToggleButton pressed={hasStroller} onClick={() => setValue('hasStroller', !hasStroller)}>
                    유모차
                  </ToggleButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-[0.875rem] font-semibold text-ink">특이사항 / 알레르기 정보</span>
          <textarea
            maxLength={200}
            rows={3}
            placeholder="예) 닭고기 알레르기가 있어요, 낯선 사람을 보면 잘 짖어요."
            className={`w-full resize-none rounded-[0.625rem] border bg-field px-3.5 py-3 text-[0.9375rem] leading-relaxed text-ink outline-none placeholder:text-faint focus-visible:outline-none ${
              errors.note ? 'border-alert' : 'border-line focus:border-brand'
            }`}
            {...register('note')}
          />
          <span className="mt-1 flex justify-between text-[0.75rem]">
            <span className="text-alert">{errors.note?.message}</span>
            <span className="text-faint">{note.length} / 200</span>
          </span>
        </label>

        {message && (
          <p
            role={message.ok ? 'status' : 'alert'}
            className={`mt-4 rounded-[0.625rem] px-3.5 py-2.5 text-[0.8125rem] ${message.ok ? 'bg-brand-soft text-brand-strong' : 'bg-alert-soft text-alert'}`}
          >
            {message.text}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {!isNew && (
              <>
                <Button variant="outline" disabled={working || current?.petId === defaultPet?.petId} onClick={makeDefault}>
                  {current?.petId === defaultPet?.petId ? '대표 반려동물' : '대표로 지정'}
                </Button>
                <Button variant="outline" className="text-alert" disabled={working} onClick={() => setConfirmDelete(true)}>
                  삭제
                </Button>
              </>
            )}
          </div>
          <Button type="submit" variant="strong" size="lg" className="w-[10rem]" disabled={isSubmitting}>
            {isSubmitting ? '저장하는 중' : isNew ? '등록' : '저장'}
          </Button>
        </div>
      </form>

      {confirmDelete && current && (
        <Modal
          title={`${current.name}의 정보를 지울까요?`}
          onClose={() => setConfirmDelete(false)}
          actions={
            <>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                취소
              </Button>
              <Button variant="strong" disabled={working} onClick={removePet}>
                지우기
              </Button>
            </>
          }
        >
          지운 정보는 되돌릴 수 없습니다.
          {current.petId === defaultPet?.petId && list.length > 1 && ' 대표 반려동물은 남은 아이 중 첫째로 바뀝니다.'}
        </Modal>
      )}
    </section>
  );
}
