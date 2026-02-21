// allows to implement case-insensitive has
export function Set_hasUsingNormalizer<T>(set: ReadonlySet<T>, value: T, normalizer: (val: T) => any): boolean {
  const normValue = normalizer(value)
  for (const item of set) if (normalizer(item) === normValue) return true
  return false
}

export function Set_getUsingNormalizer<T>(set: ReadonlySet<T>, value: T, normalizer: (val: T) => any): T | undefined {
  const normValue = normalizer(value)
  for (const item of set) {
    if (normalizer(item) === normValue) return item
  }
  return undefined
}

export function Set_add_unlessHasAlreadyNormalized<T>(set: Set<T>, value: T, normalizer: (val: T) => any): Set<T> {
  if (!Set_hasUsingNormalizer(set, value, normalizer)) set.add(value)
  return set
}
