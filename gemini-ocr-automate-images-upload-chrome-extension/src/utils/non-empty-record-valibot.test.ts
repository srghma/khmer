import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { NonEmptyRecordSchema } from './non-empty-record-valibot'
import type { NonEmptyRecord } from './non-empty-record'

describe('NonEmptyRecordSchema (Valibot)', () => {
  it('should accept a non-empty record', () => {
    const schema = NonEmptyRecordSchema(v.string(), v.number())
    const validRecord = { a: 1 }
    const output: NonEmptyRecord<string, number> = v.parse(schema, validRecord)
    expect(output).toEqual(validRecord)
  })

  it('should reject an empty record', () => {
    const schema = NonEmptyRecordSchema(v.string(), v.number())
    const result = v.safeParse(schema, {})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0].message).toBe('Record must contain at least 1 entry.')
    }
  })

  it('should reject a record with wrong value type', () => {
    const schema = NonEmptyRecordSchema(v.string(), v.number())
    const result = v.safeParse(schema, { a: '1', b: 2 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues).toStrictEqual([
        {
          "abortEarly": undefined,
          "abortPipeEarly": undefined,
          "expected": "number",
          "input": "1",
          "issues": undefined,
          "kind": "schema",
          "lang": undefined,
          "message": "Invalid type: Expected number but received \"1\"",
          "path": [
            {
              "input": {
                "a": "1",
                "b": 2,
              },
              "key": "a",
              "origin": "value",
              "type": "object",
              "value": "1",
            },
          ],
          "received": "\"1\"",
          "requirement": undefined,
          "type": "number",
        },
      ])
    }
  })
})
