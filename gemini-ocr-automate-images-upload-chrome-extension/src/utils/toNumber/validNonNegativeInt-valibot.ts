import * as v from 'valibot'
import {
  number_isValidNonNegativeInt,
  number_toValidNonNegativeInt_unsafe,
} from './validNonNegativeInt'

export const ValidNonNegativeIntSchema = v.pipe(
  v.number('The value must be a number.'),
  v.safeInteger('The number must be an integer.'),
  v.minValue(0, 'The number must be non-negative.'),
  // v.check(number_isValidNonNegativeInt, (input) => `Invalid non-negative integer: got ${input.input}`),
  v.transform(number_toValidNonNegativeInt_unsafe),
)
