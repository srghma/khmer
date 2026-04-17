import * as z from 'zod/mini'
import { String_toNonEmptyString_unsafe, type NonEmptyString } from './non-empty-string'

export const NonEmptyStringSchema = z.pipe(z.string().check(z.minLength(1)), z.transform(String_toNonEmptyString_unsafe))
