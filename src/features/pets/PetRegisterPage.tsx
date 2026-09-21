import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CirclePlus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { commonMessage, isApiError } from '@/api/client';
import { qk } from '@/api/keys';
import { PhotoUploadError, petsApi } from '@/api/pets';
import type { BreedSize } from '@/api/types';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/Button';
import { ChoiceGroup, ToggleButton } from '@/components/ui/ChoiceGroup';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { useAuthMe, usePets, useProfile } from '@/features/auth/session';
import { applyFieldErrors } from '@/lib/forms';
import { BREED_SIZE_LABEL } from '@/lib/labels';
import { NicknameInline } from './NicknameInline';
import { PetSummary } from './PetSummary';
import { PhotoPicker } from './PhotoPicker';
import { petKey, saveLocalPhoto } from './petPhotoStore';
import { WEIGHT_PATTERN, sizeFromWeight } from './petRules';

type PetForm = {
  name: string;
  weightKg: string;
  breedCode: string;
  breedSize: BreedSize | '';
  vaccineCompleted: boolean | null;
  vaccineProofAvailable: boolean | null;
  hasCarrier: boolean;
  hasStroller: boolean;
};

const EMPTY: PetForm = {
  name: '',
  weightKg: '',
  breedCode: '',
  breedSize: '',
  vaccineCompleted: null,
  vaccineProofAvailable: null,
  hasCarrier: false,
  hasStroller: false,
};


/**
 * 명세서 5장 반려동물 정보 등록 (Step 2 of 2).
 * 왼쪽 양식으로 한 마리씩 등록하고, 오른쪽에 등록된 반려동물이 쌓인다.
 * 서버가 대표를 자동으로 정하지 않으므로, 대표가 비어 있으면 등록 직후 대표로 지정한다 (대조표 1/4 2-5).
 * 크기는 사용자가 드롭다운을 직접 바꿨을 때만 보낸다 — 안 바꿨으면 서버가 체중으로 정한다.
 */
export function PetRegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useAuthMe();
  const profile = useProfile();
  const pets = usePets();
  const breeds = useQuery({ queryKey: qk.breeds, queryFn: petsApi.breeds, staleTime: Infinity });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const nameInput = useRef<HTMLInputElement | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PetForm>({ defaultValues: EMPTY });

  const weight = watch('weightKg');
  const breedCode = watch('breedCode');
  const breedSize = watch('breedSize');
  const vaccineCompleted = watch('vaccineCompleted');
  const hasCarrier = watch('hasCarrier');
  const hasStroller = watch('hasStroller');

  // 크기는 몸무게로 자동으로 고르되, 사용자가 한 번 바꾸면 그 값을 둔다
  useEffect(() => {
    if (!WEIGHT_PATTERN.test(weight.trim())) return;
    const w = Number(weight);
    if (w > 0) setValue('breedSize', sizeFromWeight(w));
  }, [weight, setValue]);

  const breedOptions = useMemo(
    () => (breeds.data ?? []).map((b) => ({ value: b.code, label: b.nameKo })),
    [breeds.data],
  );

  const petList = pets.data ?? [];
  const hasDefault = Boolean(profile.data?.defaultPetId);

  const clearForm = () => {
    reset(EMPTY);
    setPhoto(null);
    setPhotoError(null);
    setFormError(null);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setNotice(null);
    const needsDefault = !profile.data?.defaultPetId;
    try {
      // S3 로 못 올리면 사진만 이 브라우저에 담아 두고 나머지는 그대로 저장한다
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
        name: values.name.trim(),
        breedCode: values.breedCode,
        weightKg: Number(values.weightKg),
        // 크기는 보내지 않는다 — 서버가 몸무게로 정한다 (화면은 같은 규칙으로 미리 보여 줌)
        hasCarrier: values.hasCarrier,
        hasStroller: values.hasStroller,
        vaccineCompleted: values.vaccineCompleted === true,
        vaccineProofAvailable: values.vaccineProofAvailable === true,
        photoUrl,
      });

      if (keepLocally) await saveLocalPhoto(petKey(created.petId), keepLocally);

      let defaultError: string | null = null;
      if (needsDefault) {
        try {
          await usersApi.setDefaultPet(created.petId);
        } catch (e) {
          defaultError = isApiError(e, 'PET_NOT_FOUND')
            ? '등록한 반려동물을 찾지 못해 대표로 지정하지 못했습니다. 마이페이지에서 다시 지정해 주세요.'
            : '대표 반려동물 지정이 지금은 되지 않습니다. 마이페이지에서 다시 지정해 주세요.';
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.pets }),
        queryClient.invalidateQueries({ queryKey: qk.profile }),
      ]);
      clearForm();
      setNotice(`${created.name} 등록을 마쳤습니다.`);
      if (defaultError) setFormError(defaultError);
    } catch (error) {
      if (error instanceof PhotoUploadError) {
        setPhotoError('사진을 올리지 못했습니다. 사진을 빼고 등록하거나 잠시 후 다시 시도해 주세요.');
      } else if (!applyFieldErrors(error, setError, ['name', 'breedCode', 'weightKg'])) {
        setFormError(commonMessage(error));
      }
    }
  });

  const nameField = register('name', {
    validate: (v) => {
      const t = v.trim();
      if (!t) return '이름을 입력해 주세요.';
      return t.length <= 30 || '이름은 30자를 넘을 수 없습니다.';
    },
  });

  const guardian = me.data
    ? profile.data?.nickname
      ? `${profile.data.nickname} (${me.data.email})`
      : me.data.email
    : '';

  return (
    <main className="px-16 pb-16 pt-7">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[1.375rem] font-bold tracking-[-0.01em] text-brand-title">반려동물 정보 등록</h1>
        <span className="text-[1.0625rem] font-semibold text-brand">Step 2 of 2</span>
      </div>
      <div className="mt-3.5 h-[0.4375rem] overflow-hidden rounded-full bg-[#e8e1d4]" aria-hidden>
        <div className="h-full w-1/2 rounded-full bg-brand" />
      </div>

      <div className="mt-8 grid grid-cols-2 items-start gap-6">
        <form onSubmit={onSubmit} noValidate className="rounded-[1.25rem] bg-white px-8 pb-8 pt-7 shadow-card">
          <h2 className="text-[1.25rem] font-bold text-ink">{profile.isSuccess && !hasDefault ? '우리아이 기본정보(대표)' : '우리아이 기본정보'}</h2>

          {notice && (
            <p role="status" className="mt-4 rounded-[0.625rem] bg-brand-soft px-3.5 py-2.5 text-[0.8125rem] text-brand-strong">
              {notice}
            </p>
          )}

          <div className="mt-5 grid grid-cols-[12.25rem_minmax(0,1fr)] gap-6">
            <PhotoPicker file={photo} onChange={setPhoto} error={photoError} onError={setPhotoError} />
            <div className="space-y-2.5">
              <TextField
                label="반려동물 이름"
                size="lg"
                placeholder="예) 초코, 뭉치"
                maxLength={30}
                error={errors.name?.message}
                {...nameField}
                ref={(el) => {
                  nameField.ref(el);
                  nameInput.current = el;
                }}
              />
              <TextField
                label="몸무게 (kg)"
                size="lg"
                inputMode="decimal"
                placeholder="예) 5.4"
                error={errors.weightKg?.message}
                {...register('weightKg', {
                  validate: (v) => {
                    const t = v.trim();
                    if (!t) return '몸무게를 입력해 주세요.';
                    const n = Number(t);
                    return (WEIGHT_PATTERN.test(t) && n > 0 && n <= 200) || '0보다 크고 200 이하로, 소수 첫째 자리까지 적어 주세요.';
                  },
                })}
              />
            </div>
          </div>

          <SelectField
            className="mt-7"
            label="종"
            placeholder="예) 말티즈"
            current={breedCode}
            options={breedOptions}
            error={errors.breedCode?.message ?? (breeds.isError ? '견종 목록을 불러오지 못했습니다.' : undefined)}
            {...register('breedCode', { required: '종을 골라 주세요.' })}
          />

          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <p className="mb-1.5 text-[0.875rem] font-semibold text-ink">크기</p>
              <div className="flex h-11 items-center rounded-[0.625rem] border border-line bg-field px-3.5 text-[0.9375rem] text-ink">
                {breedSize ? BREED_SIZE_LABEL[breedSize] : '몸무게를 넣으면 정해집니다'}
              </div>
              <p className="mt-1 text-[0.8125rem] text-faint">몸무게에 따라 자동으로 정해집니다</p>
            </div>
            <Controller
              name="vaccineCompleted"
              control={control}
              rules={{ validate: (v) => v !== null || '접종 여부를 골라 주세요.' }}
              render={({ field, fieldState }) => (
                <ChoiceGroup
                  label="접종 여부"
                  value={field.value}
                  options={[
                    { value: false, label: '미접종' },
                    { value: true, label: '접종 완료' },
                  ]}
                  error={fieldState.error?.message}
                  onChange={(v) => {
                    field.onChange(v);
                    // 미접종이면 증명서도 없다 · 접종 완료로 바꾸면 다시 고르게 한다
                    setValue('vaccineProofAvailable', v ? null : false, { shouldValidate: false });
                  }}
                />
              )}
            />
            <Controller
              name="vaccineProofAvailable"
              control={control}
              rules={{
                validate: (v, all) => all.vaccineCompleted === false || v !== null || '증명서 보유 여부를 골라 주세요.',
              }}
              render={({ field, fieldState }) => (
                <ChoiceGroup
                  label="접종 증명서를 가지고 있나요?"
                  value={field.value}
                  options={[
                    { value: false, label: '없음' },
                    { value: true, label: '있음' },
                  ]}
                  disabled={vaccineCompleted === false}
                  hint="파일은 받지 않고 보유 여부만 저장합니다"
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                />
              )}
            />
            <div aria-hidden />
            <div>
              <p className="mb-1.5 text-[0.875rem] font-semibold text-ink">동반 장비</p>
              <div className="grid grid-cols-2 gap-2.5">
                <ToggleButton pressed={hasCarrier} onClick={() => setValue('hasCarrier', !hasCarrier)}>
                  이동장 있음
                </ToggleButton>
                <ToggleButton pressed={hasStroller} onClick={() => setValue('hasStroller', !hasStroller)}>
                  유모차 있음
                </ToggleButton>
              </div>
              <p className="mt-1.5 text-[0.75rem] text-faint">목줄로는 못 들어가고 이동장이 있어야만 되는 곳이 있습니다</p>
            </div>
          </div>

          {formError && (
            <p role="alert" className="mt-5 rounded-[0.625rem] bg-alert-soft px-3.5 py-2.5 text-[0.8125rem] text-alert">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-7 w-full" disabled={isSubmitting}>
            {isSubmitting ? '등록하는 중' : '등록'}
          </Button>
        </form>

        <div className="space-y-6">
          <section className="rounded-[1.25rem] bg-white px-6 pb-5 pt-6 shadow-card">
            {profile.isSuccess && profile.data.nickname === null && me.data ? (
              <NicknameInline email={me.data.email} />
            ) : (
              <p className="border-b border-line pb-3.5 text-[1.0625rem] font-bold text-ink">보호자 정보:&nbsp; {guardian}</p>
            )}
          </section>

          <section className="rounded-[1.25rem] bg-white px-8 pb-8 pt-7 shadow-card">
            <h2 className="text-[1.0625rem] font-semibold text-ink">등록된 우리아이들 정보</h2>
            <div className="mt-5 space-y-6">
              {pets.isPending ? (
                <p className="text-[0.875rem] text-faint">불러오는 중</p>
              ) : pets.isError ? (
                <p className="text-[0.875rem] text-alert">반려동물 목록을 불러오지 못했습니다.</p>
              ) : petList.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[0.875rem] text-sub">
                  왼쪽에서 등록하면 여기에 보입니다.
                </p>
              ) : (
                petList.map((pet) => (
                  <PetSummary key={pet.petId} pet={pet} isDefault={pet.petId === profile.data?.defaultPetId} />
                ))
              )}
            </div>
          </section>

          <div className="grid grid-cols-[28fr_32.5fr] gap-4">
            <Button
              variant="line"
              size="xl"
              onClick={() => {
                clearForm();
                setNotice(null);
                nameInput.current?.focus();
              }}
            >
              <CirclePlus className="size-5" strokeWidth={1.8} aria-hidden />
              반려동물 추가
            </Button>
            <Button size="xl" onClick={() => navigate('/', { replace: true })}>
              가입 완료하고 시작하기
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
