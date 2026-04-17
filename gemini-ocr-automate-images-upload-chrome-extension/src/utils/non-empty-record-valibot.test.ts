import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { NonEmptyRecordSchema } from './non-empty-record-valibot'

describe('NonEmptyRecordSchema (Valibot)', () => {
  it('should accept a non-empty record', () => {
    const schema = NonEmptyRecordSchema(v.string(), v.number())
    const validRecord = { a: 1 }
    expect(v.parse(schema, validRecord)).toEqual(validRecord)
  })

  it('should reject an empty record', () => {
    const schema = NonEmptyRecordSchema(v.string(), v.number())
    const result = v.safeParse(schema, {})
    expect(result.success).toBe(false)
  })
})
