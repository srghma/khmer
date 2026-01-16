// Copyright 2023 srghma

import { assertNever } from './asserts.js'

// ------------ Option type

/**
 * Option<A> represents an optional value (like Lean's Option / Haskell's Maybe).
 * - `none`  means no value
 * - `some`  wraps a present value
 */
export type Option<A> = { t: 'none' } | { t: 'some'; v: A }

// constructors
export const Option_none: Option<never> = { t: 'none' }
export const Option_some = <A>(v: A): Option<A> => ({ t: 'some', v })

// functions
export const Option_map = <A, B>(oa: Option<A>, f: (a: A) => B): Option<B> =>
  oa.t === 'some' ? Option_some(f(oa.v)) : Option_none
export const Option_bind = <A, B>(oa: Option<A>, f: (a: A) => Option<B>): Option<B> =>
  oa.t === 'some' ? f(oa.v) : Option_none
export const Option_getD = <A>(oa: Option<A>, d: A): A => (oa.t === 'some' ? oa.v : d)
export const Option_ap = <A, B>(of: Option<(a: A) => B>, oa: Option<A>): Option<B> =>
  of.t === 'some' && oa.t === 'some' ? Option_some(of.v(oa.v)) : Option_none

// checkers
export const Option_isSome = <A>(oa: Option<A>): oa is { t: 'some'; v: A } => oa.t === 'some'
export const Option_isNone = <A>(oa: Option<A>): oa is { t: 'none' } => oa.t === 'none'

// convert
export const Option_toUndefined = <A>(oa: Option<A>): A | undefined => (oa.t === 'some' ? oa.v : undefined)
export const Option_fromNullable = <A>(a: A | null | undefined): Option<A> => (a == null ? Option_none : Option_some(a))

// ------------ Sum type
/**
 * Sum<E, A> represents a computation that may fail with an r `E`
 * or succeed with a value `A` (like Lean's Sum / Haskell's Either).
 * - `l(a)`    means success with value
 * - `r(e)` means failure with r
 */
export type Sum<L, R> = { t: 'l'; v: L } | { t: 'r'; v: R }

// constructors
export const Sum_l = <L, R>(l: L): Sum<L, R> => ({ t: 'l', v: l })
export const Sum_r = <L, R>(r: R): Sum<L, R> => ({ t: 'r', v: r })

// functions
export const Sum_mapl = <L, L2, R>(sa: Sum<L, R>, f: (l: L) => L2): Sum<L2, R> => (sa.t === 'l' ? Sum_l(f(sa.v)) : sa)
export const Sum_mapr = <L, R, R2>(sa: Sum<L, R>, f: (r: R) => R2): Sum<L, R2> => (sa.t === 'r' ? Sum_r(f(sa.v)) : sa)

export const Sum_partition = <L, R>(xs: readonly Sum<L, R>[]): [L[], R[]] => {
  const ls: L[] = []
  const rs: R[] = []
  for (const x of xs) {
    if (x.t === 'l') {
      ls.push(x.v)
    } else {
      rs.push(x.v)
    }
  }
  return [ls, rs]
}

// ------------ Except type
/**
 * Except<E, A> represents a computation that may fail with an error `E`
 * or succeed with a value `A` (like Lean's Except / Haskell's Either).
 * - `ok(a)`    means success with value
 * - `error(e)` means failure with error
 */
export type Except<E, A> = { t: 'ok'; v: A } | { t: 'error'; error: E }

// constructors
export const Except_ok = <E, A>(v: A): Except<E, A> => ({ t: 'ok', v })
export const Except_error = <E, A = never>(err: E): Except<E, A> => ({ t: 'error', error: err })

// functions
export const Except_map = <E, A, B>(ea: Except<E, A>, f: (a: A) => B): Except<E, B> =>
  ea.t === 'ok' ? Except_ok(f(ea.v)) : ea
export const Except_mapError = <E, F, A>(ea: Except<E, A>, f: (e: E) => F): Except<F, A> =>
  ea.t === 'error' ? Except_error(f(ea.error)) : ea
export const Except_bind = <E, A, B>(ea: Except<E, A>, f: (a: A) => Except<E, B>): Except<E, B> =>
  ea.t === 'ok' ? f(ea.v) : ea
export const Except_getD = <E, A>(ea: Except<E, A>, d: A): A => (ea.t === 'ok' ? ea.v : d)
export const Except_bimap = <E, F, A, B>(ea: Except<E, A>, fErr: (e: E) => F, fOk: (a: A) => B): Except<F, B> =>
  ea.t === 'ok' ? Except_ok(fOk(ea.v)) : Except_error(fErr(ea.error))

export const Except_toOption = <E, A>(ea: Except<E, A>): Option<A> => (ea.t === 'ok' ? Option_some(ea.v) : Option_none)

export const Except_partition = <E, A>(eas: readonly Except<E, A>[]): Except<E[], A[]> => {
  const values: A[] = []
  const errors: E[] = []

  for (const ea of eas) {
    if (ea.t === 'ok') {
      values.push(ea.v)
    } else {
      errors.push(ea.error)
    }
  }

  return errors.length > 0 ? Except_error(errors) : Except_ok(values)
}

// checkers
export const Except_isOk = <E, A>(ea: Except<E, A>): ea is { t: 'ok'; v: A } => ea.t === 'ok'
export const Except_isError = <E, A>(ea: Except<E, A>): ea is { t: 'error'; error: E } => ea.t === 'error'

export function Except_unwrapOrThrowErrorOnParsingTypeError<A>(
  ea: Except<string | readonly string[], A>,
  entity: string,
  original: unknown,
): A {
  switch (ea.t) {
    case 'ok':
      return ea.v
    case 'error': {
      const errs = Array.isArray(ea.error) ? ea.error.join(', ') : ea.error
      console.error(original)
      throw new TypeError(`Value is not an ${entity}: ${errs}`)
    }
    default:
      return assertNever(ea)
  }
}

export function Except_makeArrayParser<T>(
  elementParser: (input: unknown) => Except<readonly string[], T>,
): (input: unknown) => Except<string[], T[]> {
  return (input: unknown): Except<string[], T[]> => {
    if (!Array.isArray(input)) return Except_error([`Expected array, got ${typeof input}`])

    const results: T[] = []
    const errors = new Set<string>()

    input.forEach((item, index) => {
      const result = elementParser(item)
      if (Except_isOk(result)) {
        results.push(result.v)
      } else {
        for (const err of result.error) {
          errors.add(`Index ${index}: ${err}`)
        }
      }
    })

    return errors.size > 0 ? Except_error([...errors]) : Except_ok(results)
  }
}

/**
 * Traverse an array with a parser that returns Except.
 * Collect all successes or all errors.
 */
export function Except_appTraverse<E, A, B>(arr: readonly A[], f: (a: A) => Except<E, B>): Except<E[], B[]> {
  const values: B[] = []
  const errors: E[] = []

  arr.forEach((a, _i) => {
    const res = f(a)
    if (res.t === 'ok') {
      values.push(res.v)
    } else {
      errors.push(res.error)
    }
  })

  return errors.length > 0 ? Except_error(errors) : Except_ok(values)
}

/**
 * Map over an array with a parser that returns Except.
 * Stop at the first error and return it immediately.
 */
export function Except_appTraverseFast<E, A, B>(arr: readonly A[], f: (a: A) => Except<E, B>): Except<E, B[]> {
  const result: B[] = []

  for (const a of arr) {
    const res = f(a)
    if (res.t === 'ok') {
      result.push(res.v)
    } else {
      return Except_error(res.error) // fail-fast
    }
  }

  return Except_ok(result)
}
