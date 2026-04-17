import * as v from 'valibot'
import { Map_toNonEmptyMap_unsafe } from './non-empty-map'

export const NonEmptyMapSchema = <K extends v.GenericSchema, V extends v.GenericSchema>(keyItem: K, valueItem: V) =>
  v.pipe(v.map(keyItem, valueItem), v.minSize(1, 'Map must contain at least 1 item.'), v.transform(Map_toNonEmptyMap_unsafe))
