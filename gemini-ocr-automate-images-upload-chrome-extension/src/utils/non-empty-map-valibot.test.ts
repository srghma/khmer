import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { NonEmptyMapSchema } from './non-empty-map-valibot'

describe('NonEmptyMapSchema (Valibot)', () => {
  it('should accept a non-empty map', () => {
    const schema = NonEmptyMapSchema(v.string(), v.number())
    const validMap = new Map([['a', 1]])
    expect(v.parse(schema, validMap)).toEqual(validMap)
  })

  it('should reject an empty map', () => {
    const schema = NonEmptyMapSchema(v.string(), v.number())
    const result = v.safeParse(schema, new Map())
    expect(result.success).toBe(false)
  })
})
