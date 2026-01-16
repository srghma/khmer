// Copyright 2025 srghma

export function isEnumValue<T extends string>(value: string, validValues: readonly T[]): value is T {
  return validValues.includes(value as T)
}

export function stringToEnumOrUndefined<T extends string>(value: string, validValues: readonly T[]): T | undefined {
  return isEnumValue(value, validValues) ? (value as T) : undefined
}

export function stringToEnumOrThrow<T extends string>(value: string, validValues: readonly T[], label: string): T {
  const result = stringToEnumOrUndefined(value, validValues)
  if (result === undefined) {
    throw new Error(`'${value}' is not a valid ${label}`)
  }
  return result
}

///////

export function stringToEnumOrUndefinedUsingCustomChecker<T extends string>(
  value: string,
  isValid: (str: string) => str is T,
): T | undefined {
  return isValid(value) ? value : undefined
}

export function stringToEnumOrThrowUsingCustomChecker<T extends string>(
  value: string,
  isValid: (str: string) => str is T,
  label: string,
): T {
  if (isValid(value)) {
    return value
  }
  throw new Error(`'${value}' is not a valid ${label}`)
}
