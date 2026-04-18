import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { ValidNumberSchema } from './validNumber-valibot'
import { validNumberCases } from './test-data'

describe('ValidNumberSchema', () => {
  it('should correctly validate numbers (synchronized)', () => {
    for (const [input, expected] of validNumberCases) {
      if (expected) {
        expect(v.parse(ValidNumberSchema, input)).toBe(input)
      } else {
        expect(() => v.parse(ValidNumberSchema, input)).toThrow()
      }
    }
  })

  it('should fail for non-number types', () => {
    expect(() => v.parse(ValidNumberSchema, '42')).toThrow('The value must be a number.')
    expect(() => v.parse(ValidNumberSchema, null)).toThrow('The value must be a number.')
    expect(() => v.parse(ValidNumberSchema, {})).toThrow('The value must be a number.')
  })
})
