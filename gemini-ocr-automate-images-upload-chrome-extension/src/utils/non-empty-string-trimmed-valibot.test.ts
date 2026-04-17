import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { NonEmptyStringTrimmedSchema } from './non-empty-string-trimmed-valibot'
import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

describe('NonEmptyStringTrimmedSchema (Valibot)', () => {
  it('should accept and trim valid strings', () => {
    const output: NonEmptyStringTrimmed = v.parse(NonEmptyStringTrimmedSchema, 'hello')
    expect(output).toBe('hello')
    const output2: NonEmptyStringTrimmed = v.parse(NonEmptyStringTrimmedSchema, '  hello  ')
    expect(output2).toBe('hello')
    const output3: NonEmptyStringTrimmed = v.parse(NonEmptyStringTrimmedSchema, '\n\thello world\t\n')
    expect(output3).toBe('hello world')
  })

  it('should reject empty strings', () => {
    const result = v.safeParse(NonEmptyStringTrimmedSchema, '')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0].type).toBe('non_empty')
    }
  })

  it('should reject strings containing only whitespace', () => {
    // After trimming, "   " becomes "" and should fail the nonEmpty() check
    const result1 = v.safeParse(NonEmptyStringTrimmedSchema, '   ')
    expect(result1.success).toBe(false)

    const result2 = v.safeParse(NonEmptyStringTrimmedSchema, '\n\t ')
    expect(result2.success).toBe(false)
  })

  it('should reject non-string types', () => {
    expect(v.safeParse(NonEmptyStringTrimmedSchema, 123).success).toBe(false)
    expect(v.safeParse(NonEmptyStringTrimmedSchema, null).success).toBe(false)
    expect(v.safeParse(NonEmptyStringTrimmedSchema, undefined).success).toBe(false)
    expect(v.safeParse(NonEmptyStringTrimmedSchema, []).success).toBe(false)
  })
})
