import * as v from 'valibot'
import { String_toNonEmptyStringTrimmed_unsafe } from './non-empty-string-trimmed'

export const NonEmptyStringTrimmedSchema = v.pipe(v.string(), v.trim(), v.nonEmpty(), v.transform(String_toNonEmptyStringTrimmed_unsafe))
