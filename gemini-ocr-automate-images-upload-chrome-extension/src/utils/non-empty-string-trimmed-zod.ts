import * as z from 'zod/mini'
import { String_toNonEmptyStringTrimmed_unsafe, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'

export const NonEmptyStringTrimmedSchema = z.pipe(z.string().check(z.trim()).check(z.minLength(1)), z.transform(String_toNonEmptyStringTrimmed_unsafe))
