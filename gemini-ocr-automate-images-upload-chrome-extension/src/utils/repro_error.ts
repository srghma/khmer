
import { NonEmptyArray } from './non-empty-array'

export type NonEmptyRecord<K extends PropertyKey, V> = Readonly<Record<K, V>> & {
  readonly _nonEmptyRecordBrand: 'NonEmptyRecord'
}

export function Record_toNonEmptyRecord_addKeysIfKeyIsNotPresentAlready_withUndefined<K extends PropertyKey, V>(
  record: {
    readonly [P in K]?: V;
  },
  keys: NonEmptyArray<K>,
): {
    [P in K]: V | undefined;
  } {
  const result: {
    [P in K]: V | undefined;
  } = { ...record }
  for (const key of keys) {
    if (Object.hasOwn(result, key)) continue
    result[key] = undefined
  }
  return result as any
}
