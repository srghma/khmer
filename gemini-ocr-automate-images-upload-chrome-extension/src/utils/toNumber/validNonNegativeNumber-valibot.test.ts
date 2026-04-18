import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { ValidNonNegativeNumberSchema } from './validNonNegativeNumber-valibot'
import { validNonNegativeNumberCases } from './test-data'

describe('ValidNonNegativeNumberSchema', () => {
  it('should correctly validate non-negative numbers (synchronized)', () => {
    for (const [input, expected] of validNonNegativeNumberCases) {
      if (expected) {
        expect(v.parse(ValidNonNegativeNumberSchema, input)).toBe(input)
      } else {
        expect(() => v.parse(ValidNonNegativeNumberSchema, input)).toThrow()
      }
    }
  })

  it('should fail for non-number types', () => {
    expect(() => v.parse(ValidNonNegativeNumberSchema, '42')).toThrow('The value must be a number.')
  })
})
