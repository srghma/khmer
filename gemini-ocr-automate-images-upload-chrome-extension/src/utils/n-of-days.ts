import {
  number_isValidNonNegativeInt,
  number_throwIfNotValidNonNegativeInt,
  type ValidNonNegativeInt,
} from './toNumber'

export type NOfDays = ValidNonNegativeInt & { readonly __NOfDaysBrand: 'NOfDays' }

export function number_isNOfDays_unsafe(num: number): num is NOfDays {
  return number_isValidNonNegativeInt(num)
}

export function number_throwIfNotNOfDays(num: number): asserts num is NOfDays {
  number_throwIfNotValidNonNegativeInt(num)
}

export function numberToNOfDays_orThrow_mk(num: number): NOfDays {
  number_throwIfNotValidNonNegativeInt(num)

  return num as NOfDays
}
