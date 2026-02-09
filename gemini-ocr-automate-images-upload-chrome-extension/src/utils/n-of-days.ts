import {
  number_isValidNonNegativeNumber,
  number_throwIfNotValidNonNegativeNumber,
  type ValidNonNegativeNumber,
} from './toNumber'

export type NOfDays = ValidNonNegativeNumber & { readonly __NOfDaysBrand: 'NOfDays' }

export function number_isNOfDays_unsafe(num: number): num is NOfDays {
  return number_isValidNonNegativeNumber(num)
}

export function number_throwIfNotNOfDays(num: number): asserts num is NOfDays {
  number_throwIfNotValidNonNegativeNumber(num)
}

export function numberToNOfDays_orThrow_mk(num: number): NOfDays {
  number_throwIfNotValidNonNegativeNumber(num)

  return num as NOfDays
}
