import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: { fields?: Record<string, string[]> } & Record<string, unknown> };
}

export const errorBody = (err: unknown): ApiErrorBody['error'] =>
  (err as { response?: { data?: ApiErrorBody } })?.response?.data?.error;

export const errorCode = (err: unknown): string | undefined => errorBody(err)?.code;

export const errorMessage = (err: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  const body = errorBody(err);
  if (body?.message) {
    const fields = body.details?.fields;
    const first = fields ? Object.values(fields)[0]?.[0] : undefined;
    return first ? `${body.message}: ${first}` : body.message;
  }
  if ((err as { code?: string })?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
};

// Copies server-side validation messages onto the matching form fields. Returns true if any matched.
export const applyFieldErrors = <T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): boolean => {
  const fields = errorBody(err)?.details?.fields;
  if (!fields) return false;
  let matched = false;
  for (const [name, messages] of Object.entries(fields)) {
    setError(name as Path<T>, { type: 'server', message: messages[0] });
    matched = true;
  }
  return matched;
};
