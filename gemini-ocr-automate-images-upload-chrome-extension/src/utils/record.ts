export function Record_filterTrueKeys<K extends PropertyKey>(obj: Record<K, boolean>): K[] {
  const result: K[] = []

  for (const key in obj) {
    // Ensure we only check own properties, not inherited ones
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key]) {
      result.push(key as K)
    }
  }

  return result
}

export function Record_stripNullValuesOrThrow<K extends PropertyKey, T extends Record<K, unknown>>(
  record: { [K in keyof T]: T[K] | null | undefined },
  options?: {
    label?: string
  },
): T {
  const out: Partial<T> = {}
  const nullKeys: (keyof T)[] = []

  for (const key in record) {
    const value = record[key]
    if (value === null || value === undefined) {
      nullKeys.push(key)
    } else {
      out[key] = value
    }
  }

  if (nullKeys.length > 0) {
    const label = options?.label ?? 'Record_stripNullValuesOrThrow'
    throw new Error(`${label}: encountered null/undefined values for keys: ${nullKeys.join(', ')}`)
  }

  return out as T
}

export function Record_invertValuesToKeys_preferSmallestValue<K extends string, V extends string>(
  record: Record<K, V>,
): Record<V, K> {
  const result = {} as Record<V, K>
  const keys = Object.keys(record) as K[]
  const size = keys.length

  for (let i = 0; i < size; i++) {
    const key = keys[i]!
    const val = record[key]

    const existingKey = result[val]

    // 1. If we haven't seen this value before, assign it.
    // 2. If we have, but the current key is lexicographically smaller, overwrite it.
    if (existingKey === undefined || key < existingKey) {
      result[val] = key
    }
  }

  return result
}

export function Record_entriesToArray<K extends PropertyKey, V, R>(
  record: Record<K, V>,
  fn: (key: K, value: V, index: number) => R,
): R[] {
  const keys = Object.keys(record) as (keyof typeof record)[]
  const size = keys.length
  const result = new Array<R>(size) // Pre-allocate memory for performance

  for (let i = 0; i < size; i++) {
    const key = keys[i]!
    // Fetching the value directly from the record using the key
    // is faster than creating [key, value] tuples for every iteration.
    result[i] = fn(key as K, record[key], i)
  }

  return result
}
