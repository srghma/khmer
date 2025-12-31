// Copyright 2021 srghma

import { type Option, Option_isNone } from './types.js'

export type LoadingOrErrorOrSuccess<T> = { t: 'loading' } | { t: 'error'; error: string } | { t: 'success'; v: T }

export const LoadingOrErrorOrSuccess_getValue = <T>(x: LoadingOrErrorOrSuccess<T>): T | undefined =>
  x?.t === 'success' ? x.v : undefined

export const LoadingOrErrorOrSuccess_Option_getValue = <T>(x: Option<LoadingOrErrorOrSuccess<T>>): T | undefined =>
  Option_isNone(x) ? undefined : LoadingOrErrorOrSuccess_getValue(x.v)

// --- Constructors ---
export const LoadingOrErrorOrSuccess_loading = <T>(): LoadingOrErrorOrSuccess<T> => ({
  t: 'loading',
})

export const LoadingOrErrorOrSuccess_error = <T>(error: string): LoadingOrErrorOrSuccess<T> => ({
  t: 'error',
  error,
})

export const LoadingOrErrorOrSuccess_success = <T>(v: T): LoadingOrErrorOrSuccess<T> => ({
  t: 'success',
  v,
})
