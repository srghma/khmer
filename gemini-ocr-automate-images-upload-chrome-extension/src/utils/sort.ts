import { parseStringOrNumberOrDateToValidDateOrThrow } from '../utils/toValidDate'
import { unknownToNonNegativeIntOrThrow_strict } from '../utils/toNumber'

export async function waitMs(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(null)
    }, ms)
  })
}

type KeyValueQuery = {
  name: string
  value: string
}
export const isInQueryString = (searchQuery: string, params: KeyValueQuery[]): boolean => {
  const searchParams = new URLSearchParams(searchQuery)
  for (const param of params) {
    if (searchParams.get(param.name) != param.value) {
      return false
    }
  }
  return true
}

export function convertRemToPixels(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

export function reduceClassName(res: string, curr?: string | false) {
  if (curr) return `${res} ${curr}`
  return res
}

export const formatLabel = (word: string): string => {
  return word
    ?.split('_')
    .map(w => `${w[0]?.toUpperCase() ?? ''}${w.slice(1)}`)
    .join(' ')
}

export async function handlePromises(
  promises: Array<Promise<void>>,
  onReject: (index: number, reason: string) => void,
): Promise<void> {
  const results = await Promise.allSettled(promises)
  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      onReject(index, result.reason)
    }
  }
}

export const ascDate = (a: Date, b: Date): number => a.getTime() - b.getTime()
export const descDate = (a: Date, b: Date): number => b.getTime() - a.getTime()

export const ascNumber = (a: number, b: number) => a - b
export const descNumber = (a: number, b: number) => b - a
export const ascInt_withCheckOrThrow = (a: number, b: number) =>
  unknownToNonNegativeIntOrThrow_strict(a) - unknownToNonNegativeIntOrThrow_strict(b)
export const descInt_withCheckOrThrow = (a: number, b: number) =>
  unknownToNonNegativeIntOrThrow_strict(b) - unknownToNonNegativeIntOrThrow_strict(a)

export function compareNullable<T>(
  a: T | null | undefined,
  b: T | null | undefined,
  next: (a: T, b: T) => number,
  nullsLast: boolean = true, // asc - nulls last, desc - nulls first
): number {
  if (a == null && b == null) return 0
  if (a == null) return nullsLast ? 1 : -1
  if (b == null) return nullsLast ? -1 : 1
  return next(a, b)
}

export const ascString = (a: string, b: string) => a.localeCompare(b)
export const descString = (a: string, b: string) => b.localeCompare(a)

const dateLike = (a: number | string | Date) =>
  typeof a === 'number' || typeof a === 'string' ? parseStringOrNumberOrDateToValidDateOrThrow(a) : a

export const ascDateLike = (a: number | string | Date, b: number | string | Date): number =>
  dateLike(a).getTime() - dateLike(b).getTime()

export const descDateLike = (a: number | string | Date, b: number | string | Date): number =>
  dateLike(b).getTime() - dateLike(a).getTime()

// export const date = (value: string): string => format(parseISO(value), DATE_FORMAT)

export const sortBy_mutating = <A, B>(xs: Array<A>, byF: (a: A) => B, sorter: (a: B, b: B) => number): A[] =>
  xs.sort((a, b) => sorter(byF(a), byF(b)))

export const sortBy_immutable = <A, B>(xs: Iterable<A>, byF: (a: A) => B, sorter: (a: B, b: B) => number): A[] =>
  sortBy_mutating(Array.from(xs), byF, sorter)

export const sortBy_immutable_cached = <A, B>(xs: A[], byF: (a: A) => B, sorter: (a: B, b: B) => number): A[] => {
  return xs
    .map(value => ({ value, key: byF(value) }))
    .sort((a, b) => sorter(a.key, b.key))
    .map(x => x.value)
}

/////////

export const ErrorMessageOneOf = (label: string, values: string[]) =>
  `${label} must be one of the following values: ${values.map(el => el.replaceAll('_', ' ')).join(',')}`

export function setCSSVariables(variables: Record<string, string>) {
  for (const [key, v] of Object.entries(variables)) {
    document.documentElement.style?.setProperty(`--${key}`, v)
  }
}
// export function daysRemaining(projectEnd: Date, projectStart: Date) {
//   const differenceStartNow = differenceInCalendarDays(projectStart, new Date())
//   if (differenceStartNow > 0) {
//     return `Project will start in ${differenceStartNow} ${differenceStartNow == 1 ? 'day' : 'days'}`
//   } else {
//     const differenceEndNow = differenceInCalendarDays(projectEnd, new Date())
//     if (differenceEndNow > 0) {
//       return `${differenceEndNow}`
//     } else {
//       return `Project ended ${differenceEndNow * -1} ${differenceEndNow * -1 == 1 ? 'day' : 'days'} ago`
//     }
//   }
// }

export function formatNumber(value?: number): string {
  return value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') ?? '0'
}
export default function fixStartValue(startValue: number, currentValue: number): number {
  while (startValue < currentValue) {
    startValue *= 2
  }

  return startValue
}
