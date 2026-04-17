import * as z from 'zod/mini'
import { Map_toNonEmptyMap_unsafe, type NonEmptyMap } from './non-empty-map'

export const NonEmptyMapSchema = <K extends z.core.SomeType, V extends z.core.SomeType>(kp: K, kv: V) =>
  z.pipe(z.map(kp, kv).check(z.minSize(1)), z.transform(Map_toNonEmptyMap_unsafe))
