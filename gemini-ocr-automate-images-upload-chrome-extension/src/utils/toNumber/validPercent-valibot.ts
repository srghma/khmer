import * as v from 'valibot'
import { number_isValidPercent, number_toValidPercent_unsafe } from './validPercent'

export const ValidPercentSchema = v.pipe(
  v.number('The value must be a number.'),
  v.finite('The number must be finite.'),
  v.minValue(0, 'The number must be non-negative.'),
  v.maxValue(100, 'The number must be at most 100.'),
  // v.check(number_isValidPercent, (input) => `Invalid percent: must be 0-100 with ≤10 digits after dot, got ${input.input}`),
  v.transform(number_toValidPercent_unsafe),
)
