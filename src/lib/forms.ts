import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/api/client';

/** VALIDATION_FAILED 의 칸별 오류를 폼 칸에 꽂는다. 하나라도 꽂았으면 true. */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): boolean {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_FAILED') return false;
  let applied = false;
  for (const fe of error.fieldErrors) {
    if ((fields as readonly string[]).includes(fe.field)) {
      setError(fe.field as Path<T>, { type: 'server', message: fe.message });
      applied = true;
    }
  }
  return applied;
}
