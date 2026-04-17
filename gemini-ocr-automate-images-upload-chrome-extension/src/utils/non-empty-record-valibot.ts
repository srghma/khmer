import * as v from 'valibot'
import { Record_toNonEmptyRecord_unsafe, type NonEmptyRecord } from './non-empty-record'

export const NonEmptyRecordSchema = <K extends v.GenericSchema, V extends v.GenericSchema>(keyItem: K, valueItem: V) =>
  v.pipe(v.record(keyItem as any, valueItem), v.minEntries(1, 'Record must contain at least 1 entry.'), v.transform(Record_toNonEmptyRecord_unsafe as any))
