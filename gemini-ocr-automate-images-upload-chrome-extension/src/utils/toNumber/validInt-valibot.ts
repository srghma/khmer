import * as v from 'valibot'
import { number_isValidInt, number_toValidInt_unsafe } from './validInt'

export const ValidIntSchema = v.pipe(
  v.number('The value must be a number.'),
  v.safeInteger('The number must be an integer.'),
  // v.check(number_isValidInt, (input) => `Invalid integer: must be whole number with ≤20 digits before dot, got ${input.input}`),
  v.transform(number_toValidInt_unsafe),
)
