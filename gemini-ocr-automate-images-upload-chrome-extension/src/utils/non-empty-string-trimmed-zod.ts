import * as z from 'zod/mini'
import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

const t = (val: string) => val as any as NonEmptyStringTrimmed
export const NonEmptyStringTrimmedSchema = z.pipe(z.string().check(z.trim()).check(z.minLength(1)), z.transform(t))
