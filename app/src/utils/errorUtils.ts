import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  error?: { message?: string };
}

export function getErrorMessage(err: Error, fallback: string): string {
  const axiosErr = err as AxiosError<ApiErrorResponse>;
  return axiosErr.response?.data?.error?.message ?? fallback;
}
