// Copyright 2025 srghma

export function checkDuplicatesInEntries<K, V>(entries: readonly (readonly [K, V])[]): void {
  const seen = new Set<K>()
  const duplicates = new Set<K>()

  for (const [key] of entries) {
    if (seen.has(key)) {
      duplicates.add(key)
    } else {
      seen.add(key)
    }
  }

  if (duplicates.size > 0) {
    const dupList = [...duplicates].map(k => String(k)).join(', ')
    throw new Error(`Duplicate key(s) found: ${dupList}`)
  }
}
