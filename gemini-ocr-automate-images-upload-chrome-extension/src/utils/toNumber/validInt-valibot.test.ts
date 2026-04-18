import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { ValidIntSchema } from './validInt-valibot'
import { validIntCases } from './test-data'

describe('ValidIntSchema', () => {
  it('should correctly validate integers (synchronized)', () => {
    for (const [input, expected] of validIntCases) {
      if (expected) {
        expect(v.parse(ValidIntSchema, input)).toBe(input)
      } else {
        expect(() => v.parse(ValidIntSchema, input)).toThrow()
      }
    }
  })

  it('should fail for non-number types', () => {
    expect(() => v.parse(ValidIntSchema, '42')).toThrow('The value must be a number.')
  })

  it('can parse string integers', () => {
    expect(v.parse(v.pipe(v.string(), v.toNumber(), ValidIntSchema), '42')).toBe(42)
  })
})
