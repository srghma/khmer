import { Option_none, Option_some, type Option } from './types'

export type NonEmptyMap<K, V> = Map<K, V> & {
  readonly _nonEmptyMapBrand: 'NonEmptyMap'
}

export function Map_toNonEmptyMap<K, V>(map: ReadonlyMap<K, V>): Option<NonEmptyMap<K, V>> {
  if (Map_isNonEmptyMap(map)) return Option_some(map)
  return Option_none
}

export function Map_toNonEmptyMap_orUndefined<K, V>(map: ReadonlyMap<K, V>): NonEmptyMap<K, V> | undefined {
  if (Map_isNonEmptyMap(map)) return map
  return undefined
}

export function Map_toNonEmptyMap_orThrow<K, V>(map: ReadonlyMap<K, V>): NonEmptyMap<K, V> {
  Map_assertNonEmptyMap(map)
  return map
}

export function Map_isNonEmptyMap<K, V>(map: ReadonlyMap<K, V>): map is NonEmptyMap<K, V> {
  return map.size !== 0
}

export function Map_assertNonEmptyMap<K, V>(map: ReadonlyMap<K, V>): asserts map is NonEmptyMap<K, V> {
  if (!Map_isNonEmptyMap(map)) throw new Error('map should be non-empty')
}

export function Map_valuesMaybeUndefined_ifAllNonUndefined_toNonEmptyMap_orUndefined<K, V>(
  map: ReadonlyMap<K, V | null | undefined>,
): NonEmptyMap<K, V> | undefined {
  for (const [, v] of map) {
    if (v === undefined || v === null) return undefined
  }
  if (map.size === 0) return undefined
  return map as NonEmptyMap<K, V>
}

export function Map_valuesMaybeUndefined_ifAllNonUndefined_assertNonEmptyMap<K, V>(
  map: ReadonlyMap<K, V | null | undefined>,
): asserts map is NonEmptyMap<K, V> {
  const map_ = Map_valuesMaybeUndefined_ifAllNonUndefined_toNonEmptyMap_orUndefined(map)

  if (map_ === undefined) throw new Error('map should be non-empty and all values should not be undefined or null')
}
