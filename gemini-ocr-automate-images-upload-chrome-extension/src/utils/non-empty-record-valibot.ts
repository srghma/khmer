import * as v from 'valibot'
import { Record_toNonEmptyRecord_unsafe, type NonEmptyRecord } from './non-empty-record'

export const NonEmptyRecordSchema = <
  K extends v.BaseSchema<string, string | number | symbol, v.BaseIssue<unknown>>,
  V extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
>(keyItem: K, valueItem: V) =>
  v.pipe(
    v.record(keyItem, valueItem),
    v.minEntries(1, 'Record must contain at least 1 entry.'),
    v.transform(
      Record_toNonEmptyRecord_unsafe as (
        record: v.InferOutput<v.RecordSchema<K, V, undefined>>,
      ) => NonEmptyRecord<v.InferOutput<K>, v.InferOutput<V>>,
    ),
  )
