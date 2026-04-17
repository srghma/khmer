import * as v from 'valibot'
import { Set_toNonEmptySet_unsafe } from './non-empty-set'

export const NonEmptySetSchema = <T extends v.GenericSchema>(item: T) =>
  v.pipe(v.set(item), v.minSize(1, 'Set must contain at least 1 item.'), v.transform(Set_toNonEmptySet_unsafe))
