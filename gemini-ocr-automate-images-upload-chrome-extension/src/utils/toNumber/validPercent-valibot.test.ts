import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { ValidPercentSchema } from './validPercent-valibot'
import { validPercentCases } from './test-data'

describe('ValidPercentSchema', () => {
  it('should correctly validate percents (synchronized)', () => {
    for (const [input, expected] of validPercentCases) {
      if (expected) {
        expect(v.parse(ValidPercentSchema, input)).toBe(input)
      } else {
        expect(() => v.parse(ValidPercentSchema, input)).toThrow()
      }
    }
  })

  it('should fail for non-number types', () => {
    expect(() => v.parse(ValidPercentSchema, '50')).toThrow('The value must be a number.')
  })
})
