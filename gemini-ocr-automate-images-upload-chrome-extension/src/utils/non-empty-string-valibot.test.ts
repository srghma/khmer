import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { NonEmptyStringSchema } from './non-empty-string-valibot'

describe('NonEmptyStringSchema (Valibot)', () => {
  it('should accept valid non-empty strings', () => {
    expect(v.parse(NonEmptyStringSchema, 'hello')).toBe('hello')
    expect(v.parse(NonEmptyStringSchema, 'A')).toBe('A')
  })

  it('should accept strings with only whitespace (since it does not trim)', () => {
    // Spaces have length > 0, so they pass the nonEmpty() check
    expect(v.parse(NonEmptyStringSchema, '   ')).toBe('   ')
    expect(v.parse(NonEmptyStringSchema, '\n\t')).toBe('\n\t')
  })

  it('should reject empty strings', () => {
    const result = v.safeParse(NonEmptyStringSchema, '')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0].type).toBe('non_empty')
    }
  })

  it('should reject non-string types', () => {
    expect(v.safeParse(NonEmptyStringSchema, 123).success).toBe(false)
    expect(v.safeParse(NonEmptyStringSchema, null).success).toBe(false)
    expect(v.safeParse(NonEmptyStringSchema, undefined).success).toBe(false)
    expect(v.safeParse(NonEmptyStringSchema, {}).success).toBe(false)
  })
})
