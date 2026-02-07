import { assertIsDefinedAndReturn } from './asserts'
import type { NonEmptyArray } from './non-empty-array'
import type { NonEmptyMap } from './non-empty-map'
import type { NonEmptySet } from './non-empty-set'
import { Option_none, Option_some, type Option } from './types'

export type NonEmptyRecord<K extends PropertyKey, V> = Readonly<Record<K, V>> & {
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

export function Record_toNonEmptyRecord_unsafe<K extends PropertyKey, V>(
  record: Readonly<Record<K, V>>,
): NonEmptyRecord<K, V> {
  return record as NonEmptyRecord<K, V>
}

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

export function NonEmptyRecord_toMap_fromSetToGetOrderFromSet<K extends PropertyKey, V>(
  set: NonEmptySet<K> | NonEmptyArray<K>,
  r: NonEmptyRecord<K, V>,
): NonEmptyMap<K, V> {
  const m = new Map<K, V>()
  for (const key of set) m.set(key, assertIsDefinedAndReturn(r[key]))
  return m as any
}
