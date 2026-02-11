// usually fn is first, but we follow types.ts

export const undefined_map = <T, X>(value: T | undefined, fn: (v: T) => X): X | undefined =>
  value !== undefined ? fn(value) : undefined

export const undefined_map2 = <A, B, R>(a: A | undefined, b: B | undefined, fn: (a: A, b: B) => R): R | undefined =>
  a !== undefined && b !== undefined ? fn(a, b) : undefined

export const undefined_map3 = <A, B, C, R>(
  a: A | undefined,
  b: B | undefined,
  c: C | undefined,
  fn: (a: A, b: B, c: C) => R,
): R | undefined => (a !== undefined && b !== undefined && c !== undefined ? fn(a, b, c) : undefined)

export const undefined_lift =
  <T, X>(fn: (v: T) => X) =>
  (value: T | undefined): X | undefined =>
    value !== undefined ? fn(value) : undefined

export const undefined_lift2 =
  <A, B, R>(fn: (a: A, b: B) => R) =>
  (a: A | undefined, b: B | undefined): R | undefined =>
    a !== undefined && b !== undefined ? fn(a, b) : undefined

export const undefined_lift3 =
  <A, B, C, R>(fn: (a: A, b: B, c: C) => R) =>
  (a: A | undefined, b: B | undefined, c: C | undefined): R | undefined =>
    a !== undefined && b !== undefined && c !== undefined ? fn(a, b, c) : undefined
