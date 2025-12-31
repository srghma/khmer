import * as z from 'zod/mini'
import type { NonEmptySet } from './non-empty-set'

const t = <X>(val: Set<X>) => val as any as NonEmptySet<X>
export const NonEmptySetSchema = <T extends z.core.SomeType>(parser: T) =>
  z.pipe(z.set(parser).check(z.minSize(1)), z.transform(t))
