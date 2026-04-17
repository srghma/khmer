import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { NonEmptyArraySchema } from './non-empty-array-valibot'

describe('NonEmptyArraySchema (Valibot)', () => {
  it('should accept a non-empty array', () => {
    const schema = NonEmptyArraySchema(v.number())
    expect(v.parse(schema, [1, 2, 3])).toEqual([1, 2, 3])
  })

  it('should reject an empty array', () => {
    const schema = NonEmptyArraySchema(v.number())
    const result = v.safeParse(schema, [])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0].message).toBe('Array must not be empty.')
    }
  })

  it('should validate an array of non-empty strings and return a human readable message', () => {
    // Create a schema: Non-Empty Array containing Non-Empty Strings
    const schema = NonEmptyArraySchema(v.pipe(v.string(), v.nonEmpty('String cannot be empty.')))

    const invalidData = ['valid string', '', 'another valid string']
    const result = v.safeParse(schema, invalidData)

    expect(result.success).toBe(false)

    if (!result.success) {
      // 1. Valibot's flatten() converts deep issues into a flat dot-path object
      const flatErrors = v.flatten(result.issues)

      expect(flatErrors.nested).toBeDefined()
      // Index '1' corresponds to the empty string at invalidData[1]
      expect(flatErrors.nested?.['1']).toEqual(['String cannot be empty.'])

      // 2. Valibot's summarize() returns a pretty-printable multi-line string
      const summary = v.summarize(result.issues)

      expect(typeof summary).toBe('string')
      // It will print the exact issue path underneath the message
      // e.g. "String cannot be empty.\n  at .1"
      expect(summary).toContain('String cannot be empty.')
      expect(summary).toContain('at 1') // The path indicator showing where it failed
    }
  })
})

