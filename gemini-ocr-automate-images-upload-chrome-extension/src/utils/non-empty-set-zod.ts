import * as z from 'zod/mini'
import { Set_toNonEmptySet_unsafe, type NonEmptySet } from './non-empty-set'

export const NonEmptySetSchema = <T extends z.core.SomeType>(parser: T) =>
  z.pipe(z.set(parser).check(z.minSize(1)), z.transform(Set_toNonEmptySet_unsafe))
