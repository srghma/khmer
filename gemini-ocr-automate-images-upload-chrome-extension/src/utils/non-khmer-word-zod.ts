import * as z from 'zod/mini'
import { TypedNonKhmer_REGEX, type TypedNonKhmer } from './non-khmer-word'

export const TypedNonKhmerSchema = z.custom<TypedNonKhmer>((val: unknown) => {
  return typeof val === 'string' ? TypedNonKhmer_REGEX.test(val) : false
}, 'String must not contain Khmer characters')
