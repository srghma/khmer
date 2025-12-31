import * as z from 'zod/mini'
import type { NonEmptyMap } from './non-empty-map'

const t = <KK, VV>(val: Map<KK, VV>) => val as any as NonEmptyMap<KK, VV>

export const NonEmptySetSchema = <K extends z.core.SomeType, V extends z.core.SomeType>(kp: K, kv: V) =>
  z.pipe(z.map(kp, kv).check(z.minSize(1)), z.transform(t))
