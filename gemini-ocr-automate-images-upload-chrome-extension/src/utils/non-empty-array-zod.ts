import * as z from 'zod/mini'
import type { NonEmptyArray } from './non-empty-array'

const t = <X>(val: X[]) => val as any as NonEmptyArray<X>
export const NonEmptyArraySchema = <T extends z.core.SomeType>(parser: T) =>
  z.pipe(z.array(parser).check(z.minLength(1)), z.transform(t))
