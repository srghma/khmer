/**
 * Checks if a key exists in the map based on a normalization function.
 */
export function Map_hasKeyUsingNormalizer<K, V>(map: ReadonlyMap<K, V>, key: K, normalizer: (val: K) => any): boolean {
  const normKey = normalizer(key)
  for (const k of map.keys()) if (normalizer(k) === normKey) return true
  return false
}

/**
 * Returns the value associated with the key that matches after normalization.
 */
export function Map_getValueUsingNormalizer<K, V>(
  map: ReadonlyMap<K, V>,
  key: K,
  normalizer: (val: K) => any,
): V | undefined {
  const normKey = normalizer(key)
  for (const [k, v] of map) if (normalizer(k) === normKey) return v
  return undefined
}

/**
 * Returns the *original* key stored in the map that matches the input after normalization.
 * Useful if you want to know the specific casing or diacritics of the stored key.
 */
export function Map_getOriginalKeyUsingNormalizer<K, V>(
  map: ReadonlyMap<K, V>,
  key: K,
  normalizer: (val: K) => any,
): K | undefined {
  const normKey = normalizer(key)
  for (const k of map.keys()) if (normalizer(k) === normKey) return k
  return undefined
}

/**
 * If a normalized version of the key exists, updates that existing entry's value.
 * Otherwise, adds the new key-value pair.
 */
export function Map_set_updateExistingNormalized<K, V>(
  map: Map<K, V>,
  key: K,
  value: V,
  normalizer: (val: K) => any,
): Map<K, V> {
  const normKey = normalizer(key)
  for (const k of map.keys()) {
    if (normalizer(k) === normKey) {
      map.set(k, value) // Update the original key's value
      return map
    }
  }
  map.set(key, value) // New key entirely
  return map
}

/**
 * Deletes an entry from the map using normalized key comparison.
 */
export function Map_deleteUsingNormalizer<K, V>(map: Map<K, V>, key: K, normalizer: (val: K) => any): boolean {
  const normKey = normalizer(key)
  for (const k of map.keys()) {
    if (normalizer(k) === normKey) return map.delete(k)
  }
  return false
}
