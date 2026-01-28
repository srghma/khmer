// Copyright 2025 srghma

export function unknownToBooleanOrUndefined(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase()
    if (lower === 'true' || lower === 'yes') return true
    if (lower === 'false' || lower === 'no') return false
  }
  return undefined
}

// Returns boolean or throws if invalid input
export function unknownToBooleanOrThrow(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase()
    if (lower === 'true' || lower === 'yes') return true
    if (lower === 'false' || lower === 'no') return false
    throw new TypeError(`Invalid boolean string: "${value}"`)
  }
  throw new TypeError(`Value is not a boolean or boolean string: ${String(value)}`)
}

// Returns boolean or undefined (only accepts exact 'true' or 'false' strings)
export function strToBooleanOrUndefined(value: string): boolean | undefined {
  const lower = value.trim().toLowerCase()
  if (lower === 'true' || lower === 'yes') return true
  if (lower === 'false' || lower === 'no') return false
  return undefined
}

// Returns boolean or throws (only accepts exact 'true' or 'false' strings)
export function strToBooleanOrThrow(value: string): boolean {
  if (typeof value !== 'string') {
    throw new Error(`Invalid input type: ${typeof value}. Expected a string.`)
  }
  const lower = value.trim().toLowerCase()
  if (lower === 'true' || lower === 'yes') return true
  if (lower === 'false' || lower === 'no') return false
  throw new TypeError(`Invalid boolean string: "${value}"`)
}
