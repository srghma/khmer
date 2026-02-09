// usually fn is first, but we follow types.ts

export const undefined_map = <T, X>(value: T | undefined, fn: (v: T) => X): X | undefined =>
  value !== undefined ? fn(value) : undefined

export const undefined_lift =
  <T, X>(fn: (v: T) => X) =>
  (value: T | undefined): X | undefined =>
    value !== undefined ? fn(value) : undefined
