export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false

  const keysA = Object.keys(a as Record<string, unknown>)
  const keysB = Object.keys(b as Record<string, unknown>)

  if (keysA.length !== keysB.length) return false

  return keysA.every(k => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

export type JSONItem = Record<string, unknown>

export const getConflictingFields = (a: JSONItem, b: JSONItem): string[] => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return Array.from(keys).filter(k => !deepEqual(a[k], b[k]))
}
