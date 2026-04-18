import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { ValidNonNegativeIntSchema } from './validNonNegativeInt-valibot'
import { validNonNegativeIntCases } from './test-data'

describe('ValidNonNegativeIntSchema', () => {
  it('should correctly validate non-negative integers (synchronized)', () => {
    for (const [input, expected] of validNonNegativeIntCases) {
      if (expected) {
        expect(v.parse(ValidNonNegativeIntSchema, input)).toBe(input)
      } else {
        expect(() => v.parse(ValidNonNegativeIntSchema, input)).toThrow()
      }
    }
  })

  it('should fail for non-number types', () => {
    expect(() => v.parse(ValidNonNegativeIntSchema, '42')).toThrow('The value must be a number.')
  })
})
