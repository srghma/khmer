import * as v from 'valibot'
import { number_isValidNumber, number_toValidNumber_unsafe } from './validNumber'

export const ValidNumberSchema = v.pipe(
  v.number('The value must be a number.'),
  v.finite('The number must be finite.'),
  // v.check(number_isValidNumber, (input) => `Invalid number: must have ≤20 digits before and ≤10 digits after dot, got ${input.input}`),
  v.transform(number_toValidNumber_unsafe),
)
