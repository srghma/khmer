// Copyright 2023 srghma

export const stringToUid_usingDbUidsOrThrow = <T>(all: readonly T[], s: string): T => {
  if (all.some(x => x === s)) return s as T
  throw new Error(`stringToUid_usingDbUids: cannot find such uid ${s} in database of all product categories uids`)
}

export const stringToUid_usingDbOrThrow = <U extends string>(all: readonly { uid: U }[], s: string): U => {
  if (all.some(x => x.uid === s)) return s as U
  throw new Error(`stringToUid_usingDbOrThrow: cannot find ${s}`)
}
