// Copyright 2023 srghma

export function Record_filterTrueKeys<T extends PropertyKey>(obj: Record<T, boolean>): T[] {
  return Object.entries(obj)
    .filter(([_, v]) => v)
    .map(([k]) => k as T)
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
    if (value == null) {
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
