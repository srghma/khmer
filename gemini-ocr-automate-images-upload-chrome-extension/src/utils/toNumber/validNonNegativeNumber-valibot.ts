import * as v from 'valibot'
import {
  number_isValidNonNegativeNumber,
  number_toValidNonNegativeNumber_unsafe,
} from './validNonNegativeNumber'

export const ValidNonNegativeNumberSchema = v.pipe(
  v.number('The value must be a number.'),
  v.finite('The number must be finite.'),
  v.minValue(0, 'The number must be non-negative.'),
  // v.check(number_isValidNonNegativeNumber, (input) => `Invalid non-negative number: got ${input.input}`),
  v.transform(number_toValidNonNegativeNumber_unsafe),
)
