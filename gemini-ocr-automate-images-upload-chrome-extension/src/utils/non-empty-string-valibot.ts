import * as v from 'valibot'
import { String_toNonEmptyString_unsafe, type NonEmptyString } from './non-empty-string'

export const NonEmptyStringSchema = v.pipe(v.string(), v.nonEmpty('String must not be empty.'), v.transform(String_toNonEmptyString_unsafe))

