// Copyright 2023 srghma

import { Option_none, Option_some, type Option } from './types.js'

export type NonEmptyArray<T> = T[] & { readonly __NonEmptyArrayBrand: 'NonEmptyArray' }

export function Array_toNonEmptyArray<T>(arr: readonly T[]): Option<NonEmptyArray<T>> {
  if (arr.length === 0) return Option_none
  return Option_some(arr as NonEmptyArray<T>)
}
