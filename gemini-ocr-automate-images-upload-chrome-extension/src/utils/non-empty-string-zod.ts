import * as z from 'zod/mini'
import type { NonEmptyString } from './non-empty-string'

const t = (val: string) => val as any as NonEmptyString

export const NonEmptyStringSchema = z.pipe(z.string().check(z.minLength(1)), z.transform(t))
