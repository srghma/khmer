import * as z from 'zod/mini'
import { Array_toNonEmptyArray_unsafe } from './non-empty-array'

export const NonEmptyArraySchema = <T extends z.core.SomeType>(parser: T) =>
  z.pipe(z.array(parser).check(z.minLength(1)), z.transform(Array_toNonEmptyArray_unsafe))
