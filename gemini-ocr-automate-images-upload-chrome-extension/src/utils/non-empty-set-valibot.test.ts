import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { NonEmptySetSchema } from './non-empty-set-valibot'

describe('NonEmptySetSchema (Valibot)', () => {
  it('should accept a non-empty set', () => {
    const schema = NonEmptySetSchema(v.number())
    const validSet = new Set([1, 2, 3])
    expect(v.parse(schema, validSet)).toEqual(validSet)
  })

  it('should reject an empty set', () => {
    const schema = NonEmptySetSchema(v.number())
    const result = v.safeParse(schema, new Set())
    expect(result.success).toBe(false)
  })
})
