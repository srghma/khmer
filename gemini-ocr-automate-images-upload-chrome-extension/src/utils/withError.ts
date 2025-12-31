// Copyright 2021 srghma

export type WithError<T> = { v: T; error: string }

// Generic type guard for WithError<T>
export function isWithError<T>(isV: (x: unknown) => x is T, obj: unknown): obj is WithError<T> {
  if (typeof obj !== 'object' || obj === null) return false
  return 'v' in obj && 'error' in obj && isV(obj.v) && typeof obj.error === 'string'
}

export const withError = <T>(v: T) => ({ v, error: '' })
export const withError_error = <T>(v: T, error: string) => ({ v, error })
