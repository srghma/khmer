import { assertIsDefinedAndReturn } from './asserts'
import type { NonEmptyArray } from './non-empty-array'
import type { NonEmptyMap } from './non-empty-map'
import type { NonEmptySet } from './non-empty-set'
import { Record_entriesToArray } from './record'
import { Option_none, Option_some, type Option, identityFn } from './types'

export type NonEmptyRecord<K extends PropertyKey, V> = Record<K, V> & {
  readonly _nonEmptyRecordBrand: 'NonEmptyRecord'
}

/* ---------------------------------- */
/* Conversions                         */
/* ---------------------------------- */

export function Record_toNonEmptyRecord<K extends PropertyKey, V>(
  record: Readonly<Record<K, V>>,
): Option<NonEmptyRecord<K, V>> {
  if (Record_isNonEmptyRecord(record)) return Option_some(record)
  return Option_none
}

export const Record_toNonEmptyRecord_unsafe = identityFn as <K extends PropertyKey, V>(
  record: Readonly<Record<K, V>>,
) => NonEmptyRecord<K, V>

export function Record_toNonEmptyRecord_orUndefined<K extends PropertyKey, V>(
  record: Readonly<Record<K, V>>,
): NonEmptyRecord<K, V> | undefined {
  if (Record_isNonEmptyRecord(record)) return record
  return undefined
}

export function Record_toNonEmptyRecord_orThrow<K extends PropertyKey, V>(
  record: Readonly<Record<K, V>>,
): NonEmptyRecord<K, V> {
  Record_assertNonEmptyRecord(record)
  return record
}

/* ---------------------------------- */
/* Guards / assertions                 */
/* ---------------------------------- */

export function Record_isNonEmptyRecord<K extends PropertyKey, V>(
  record: Readonly<Record<K, V>>,
): record is NonEmptyRecord<K, V> {
  // Object.keys is safe here; symbols are rare but can be added if needed
  return Object.keys(record).length !== 0
}

export function Record_assertNonEmptyRecord<K extends PropertyKey, V>(
  record: Readonly<Record<K, V>>,
): asserts record is NonEmptyRecord<K, V> {
  if (!Record_isNonEmptyRecord(record)) {
    throw new Error('record should be non-empty')
  }
}

/* ---------------------------------- */
/* Value validation variants           */
/* ---------------------------------- */

export function Record_valuesMaybeUndefined_ifAllNonUndefined_toNonEmptyRecord_orUndefined<K extends PropertyKey, V>(
  record: Readonly<Record<K, V | null | undefined>>,
): NonEmptyRecord<K, V> | undefined {
  const keys = Object.keys(record) as K[]

  if (keys.length === 0) return undefined

  for (const k of keys) {
    const v = record[k]
    if (v === undefined || v === null) return undefined
  }

  return record as NonEmptyRecord<K, V>
}

export function Record_valuesMaybeUndefined_ifAllNonUndefined_assertNonEmptyRecord<K extends PropertyKey, V>(
  record: Readonly<Record<K, V | null | undefined>>,
): asserts record is NonEmptyRecord<K, V> {
  const record_ = Record_valuesMaybeUndefined_ifAllNonUndefined_toNonEmptyRecord_orUndefined(record)

  if (record_ === undefined) {
    throw new Error('record should be non-empty and all values should not be undefined or null')
  }
}

export function NonEmptyRecord_keys<K extends PropertyKey, V>(r: NonEmptyRecord<K, V>): NonEmptyArray<K> {
  return Object.keys(r) as unknown as NonEmptyArray<K>
}

export function NonEmptyRecord_keysSet<K extends PropertyKey, V>(r: NonEmptyRecord<K, V>): NonEmptySet<K> {
  return new Set(Object.keys(r)) as unknown as NonEmptySet<K>
}

export function NonEmptyRecord_toMap_getOrderFromSet<K extends PropertyKey, V>(
  set: NonEmptySet<K> | NonEmptyArray<K>,
  r: NonEmptyRecord<K, V>,
): NonEmptyMap<K, V> {
  const m = new Map<K, V>()
  for (const key of set) m.set(key, assertIsDefinedAndReturn(r[key]))
  return m as any
}

export const NonEmptyRecord_entriesToArray = Record_entriesToArray as unknown as <K extends PropertyKey, V, R>(
  record: NonEmptyRecord<K, V>,
  fn: (key: K, value: V, index: number) => R,
) => NonEmptyArray<R>

// example:
// const record = { a: 1, b: 2 }
// const record_ = Record_toNonEmptyRecord_addKeysIfKeyIsNotPresentAlready(record, ['a', 'b', 'c'], 999)
// console.log(record_) // { a: 1, b: 2, c: 999 }
export function Record_toNonEmptyRecord_addKeysIfKeyIsNotPresentAlready_withUndefined<K extends PropertyKey, V>(
  record: {
    readonly [P in K]?: V;
  },
  keys: NonEmptyArray<K>,
): NonEmptyRecord<K, V | undefined> {
  const result: {
    [P in K]: V | undefined;
  } = { ...record } as any
  for (const key of keys) {
    if (Object.hasOwn(result, key)) continue
    result[key] = undefined
  }
  return result as NonEmptyRecord<K, V | undefined>
}

export function Record_toNonEmptyRecord_addKeysIfKeyIsNotPresentAlready_mutating<K extends PropertyKey, V>(
  record: Record<K, V>,
  keys: NonEmptyArray<K>,
  defaultValue: V,
): NonEmptyRecord<K, V> {
  for (const key of keys) {
    if (Object.hasOwn(record, key)) continue
    record[key] = defaultValue
  }
  return record as NonEmptyRecord<K, V>
}
