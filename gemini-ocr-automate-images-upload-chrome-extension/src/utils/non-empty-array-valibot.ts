import * as v from 'valibot'
import { Array_toNonEmptyArray_unsafe } from './non-empty-array'

export const NonEmptyArraySchema = <T extends v.GenericSchema>(item: T) =>
  v.pipe(v.array(item), v.nonEmpty('Array must not be empty.'), v.transform(Array_toNonEmptyArray_unsafe))
