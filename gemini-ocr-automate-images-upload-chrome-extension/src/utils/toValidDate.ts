// Copyright 2025 srghma

export type ValidDate = Date & { readonly __datebrand: 'ValidDate' }

export function parseStringOrNumberToValidDateOrUndefined(x: string | number): ValidDate | undefined {
  const parsed = new Date(x)
  return isValidDate(parsed) ? parsed : undefined
}

export function parseStringOrNumberToValidDateOrThrow(x: string | number): ValidDate {
  const x_ = parseStringOrNumberToValidDateOrUndefined(x)
  if (x_ === undefined) throw new Error(`'${x}' couldnt parse to a valid Date`)
  return x_
}

export function isValidDate(value: Date | unknown): value is ValidDate {
  return value instanceof Date && Number.isFinite(value.getTime())
}

export function assertIsDate(value: unknown): asserts value is ValidDate {
  if (!isValidDate(value)) throw new TypeError(`Expected a valid Date, got: ${String(value)}`)
}

// XXX: better use parseStringOrNumberOrDateToValidDateOrUndefined, bc it will swallow null and undefined
export function unknownToValidDateOrUndefined(x: Date | unknown): ValidDate | undefined {
  return isValidDate(x) ? x : undefined
}

// XXX: better use parseStringOrNumberOrDateToValidDateOrUndefined, bc it will swallow null and undefined
export function unknownToValidDateOrThrow(date: unknown): ValidDate {
  if (!isValidDate(date)) throw new Error(`'${date}' is not a valid Date`)
  return date
}

// NOTE: can replace `new Date` with `parseISO` for more consistency (e.g. some engines treat "YYYY-MM-DD" as UTC, others as local time)
// XXX: better use parseStringOrNumberOrDateToValidDateOrUndefined, bc it will swallow null and undefined
export function unknownDatelikeToValidDateOrThrow(value: Date | string | number | unknown): ValidDate {
  const date: Date | undefined =
    value instanceof Date ? value : typeof value === 'string' || typeof value === 'number' ? new Date(value) : undefined
  if (!date) throw new Error(`Value is not a date-like input: ${String(value)}`)

  return unknownToValidDateOrThrow(date)
}

export function parseDateToValidDateOrUndefined(x: Date): ValidDate | undefined {
  return isValidDate(x) ? x : undefined
}

export function parseStringOrNumberOrDateToValidDateOrUndefined(x: string | number | Date): ValidDate | undefined {
  const parsed = x instanceof Date ? x : new Date(x)
  return isValidDate(parsed) ? parsed : undefined
}

export function parseDateToValidDateOrThrow(x: Date): ValidDate {
  assertIsDate(x)
  return x
}

export function parseStringOrNumberOrDateToValidDateOrThrow(x: string | number | Date): ValidDate {
  const x_ = parseStringOrNumberOrDateToValidDateOrUndefined(x)
  if (x_ === undefined) throw new Error(`'${x}' couldnt parse to a valid Date`)
  return x_
}

export function parseStringOrNumberOrDateToValidDateOrThrow_nullableToUndefined(
  x: string | number | Date | null | undefined,
): ValidDate | undefined {
  return x === undefined || x === null ? undefined : parseStringOrNumberOrDateToValidDateOrThrow(x)
}

export function eqDates(a: ValidDate, b: ValidDate): boolean {
  return a.getTime() === b.getTime()
}

export function eqDates_inDDMMYYYY(a: ValidDate, b: ValidDate): boolean {
  // const s = 'dd/MM/yyyy'
  // return format(a, s) === format(b, s)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function makeEqNullable<T>(
  eq: (a: NonNullable<T>, b: NonNullable<T>) => boolean,
): (a: T | null | undefined, b: T | null | undefined) => boolean {
  return (a, b) => {
    if (a == null && b == null) return true // both nullish
    if (a == null || b == null) return false // one nullish, one not
    return eq(a, b) // both non-null
  }
}

export const eqDates_inDDMMYYYY_nullable = makeEqNullable(eqDates_inDDMMYYYY)

export function eqDateLikes(a: string | number | Date, b: string | number | Date): boolean {
  return eqDates(unknownToValidDateOrThrow(a), unknownToValidDateOrThrow(b))
}

/**
 * Parses a date string in "MM/DD/YYYY" format into a JavaScript Date object.
 *
 * @param {string | undefined} dateString - The date string to parse, expected in "MM/DD/YYYY" format.
 * @returns {Date | undefined} A Date object representing the parsed date, or undefined if the input is invalid or cannot be parsed.
 *
 * @example
 * parseDate("08/13/2025") // returns Date object for August 13, 2025
 * parseDate("13/08/2025") // returns undefined (invalid month)
 * parseDate(undefined)    // returns undefined
 */
export function parseMDYDate(dateString: string): ValidDate | undefined {
  const parts = dateString.split('/')
  if (parts.length !== 3) return undefined

  const [monthStr, dayStr, yearStr] = parts
  if (monthStr === undefined || dayStr === undefined || yearStr === undefined) {
    return undefined
  }

  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const year = parseInt(yearStr, 10)

  if (
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 || // optionally refine by month
    year < 1000 ||
    year > 9999
  ) {
    return undefined
  }

  const date = new Date(year, month - 1, day) // 1-based month numbering (user input) to 0-based JS Date months

  return isValidDate(date) ? date : undefined
}

export function maxDate_bIsNullable_orThrow(a: Date, b: Date | undefined): ValidDate {
  if (!isValidDate(a)) throw new Error(`a is invalid date ${a}`)
  if (!b) return a
  if (!isValidDate(b)) throw new Error(`a is invalid date ${b}`)
  return a.getTime() >= b.getTime() ? a : b
}

export function maxDate_orThrow(a: Date, b: Date): ValidDate {
  const da = unknownDatelikeToValidDateOrThrow(a)
  const db = unknownDatelikeToValidDateOrThrow(b)
  return da.getTime() >= db.getTime() ? da : db
}

export function minDate_orThrow(a: Date, b: Date): ValidDate {
  const da = unknownDatelikeToValidDateOrThrow(a)
  const db = unknownDatelikeToValidDateOrThrow(b)
  return da.getTime() <= db.getTime() ? da : db
}
