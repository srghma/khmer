import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { NonEmptySetSchema } from './non-empty-set-valibot'
import type { NonEmptySet } from './non-empty-set'

describe('NonEmptySetSchema (Valibot)', () => {
  it('should accept a non-empty set', () => {
    const schema = NonEmptySetSchema(v.number())
    const validSet = new Set([1, 2, 3])
    const output: NonEmptySet<number> = v.parse(schema, validSet)
    expect(output).toEqual(validSet)
  })

  it('should reject an empty set', () => {
    const schema = NonEmptySetSchema(v.number())
    const result = v.safeParse(schema, new Set())
    expect(result.success).toBe(false)
  })
})
