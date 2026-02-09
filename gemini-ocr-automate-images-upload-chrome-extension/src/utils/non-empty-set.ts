import { Set_union_onCollisionIgnore } from './sets'
import { Option_none, Option_some, type Option } from './types'

export type NonEmptySet<T> = ReadonlySet<T> & {
  readonly _nonEmptySetBrand: 'NonEmptySet'
}

export function Set_toNonEmptySet<T>(set: ReadonlySet<T>): Option<NonEmptySet<T>> {
  if (set.size === 0) return Option_none
  return Option_some(set as NonEmptySet<T>)
}

export function Set_toNonEmptySet_orUndefined<T>(set: ReadonlySet<T>): NonEmptySet<T> | undefined {
  if (set.size === 0) return undefined
  return set as NonEmptySet<T>
}

export function Set_toNonEmptySet_orThrow<T>(set: ReadonlySet<T>): NonEmptySet<T> {
  Set_assertNonEmptySet(set)
  return set
}

export function Set_isNonEmptySet<T>(set: ReadonlySet<T>): set is NonEmptySet<T> {
  return set.size !== 0
}

export function Set_assertNonEmptySet<T>(set: ReadonlySet<T>): asserts set is NonEmptySet<T> {
  if (set.size === 0) throw new Error('set should be non-empty')
}

export function Set_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptySet_orUndefined<T>(
  set: ReadonlySet<T | null | undefined>,
): NonEmptySet<T> | undefined {
  for (const e of set) {
    if (e === undefined || e === null) return undefined
  }
  if (set.size === 0) return undefined
  return set as NonEmptySet<T>
}

export function Set_elementsMaybeUndefined_ifAllNonUndefined_assertNonEmptySet<T>(
  set: ReadonlySet<T | null | undefined>,
): asserts set is NonEmptySet<T> {
  const set_ = Set_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptySet_orUndefined(set)

  if (set_ === undefined) throw new Error('set should be non-empty and all elements should not undefined or null')
}

type NonEmptySet_union_onCollisionIgnoreFn = <T extends PropertyKey>(
  first: NonEmptySet<T>,
  second: NonEmptySet<T>,
  ...rest: readonly NonEmptySet<T>[]
) => NonEmptySet<T>

export const NonEmptySet_union_onCollisionIgnore =
  Set_union_onCollisionIgnore as unknown as NonEmptySet_union_onCollisionIgnoreFn

export function NonEmptySet_union_maybeUndefined_onCollisionIgnore<T extends PropertyKey>(
  ...sets: readonly (NonEmptySet<T> | undefined)[]
): NonEmptySet<T> | undefined {
  const filtered = sets.filter(Boolean) as NonEmptySet<T>[]
  const [first, second, ...rest] = filtered
  if (!first) return undefined
  if (!second) return first
  return NonEmptySet_union_onCollisionIgnore(first, second, ...rest)
}

export function NonEmptySet_union_maybeUndefined_onCollisionIgnore_fromIterables<T>(
  ...iterables: (Iterable<T> | undefined)[]
): NonEmptySet<T> | undefined {
  const set = new Set<T>()

  for (const iterable of iterables) {
    if (!iterable) continue
    for (const item of iterable) {
      set.add(item)
    }
  }

  return Set_toNonEmptySet_orUndefined(set)
}
