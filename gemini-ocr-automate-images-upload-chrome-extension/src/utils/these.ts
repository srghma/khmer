import { assertNever } from './asserts'
import { identityFn, Option_some, Option_none, type Option } from './types'

/**
 * These<A, B> represents an inclusive disjunction (A, B, or both).
 * - `this(a)`   means only value A is present
 * - `that(b)`   means only value B is present
 * - `both(a, b)` means both values A and B are present
 */
export type These<A, B> = { t: 'this'; vThis: A } | { t: 'that'; vThat: B } | { t: 'both'; vThis: A; vThat: B }

// constructors
export const These_this = <A, B>(vThis: A): These<A, B> => ({ t: 'this', vThis })
export const These_that = <A, B>(vThat: B): These<A, B> => ({ t: 'that', vThat })
export const These_both = <A, B>(vThis: A, vThat: B): These<A, B> => ({
  t: 'both',
  vThis,
  vThat,
})

// functions
export const These_bimap = <A, B, C, D>(ta: These<A, B>, f: (a: A) => C, g: (b: B) => D): These<C, D> => {
  switch (ta.t) {
    case 'this':
      return These_this(f(ta.vThis))
    case 'that':
      return These_that(g(ta.vThat))
    case 'both':
      return These_both(f(ta.vThis), g(ta.vThat))
    default:
      return assertNever(ta)
  }
}

export const These_mapThis = <A, B, C>(ta: These<A, B>, f: (a: A) => C): These<C, B> => These_bimap(ta, f, identityFn)

export const These_mapThat = <A, B, D>(ta: These<A, B>, g: (b: B) => D): These<A, D> => These_bimap(ta, identityFn, g)

export const These_partition = <A, B>(tas: readonly These<A, B>[]): [A[], B[], { vThis: A; vThat: B }[]] => {
  const thiss: A[] = []
  const thats: B[] = []
  const boths: { vThis: A; vThat: B }[] = []

  for (const ta of tas) {
    if (ta.t === 'this') {
      thiss.push(ta.vThis)
    } else if (ta.t === 'that') {
      thats.push(ta.vThat)
    } else {
      boths.push({ vThis: ta.vThis, vThat: ta.vThat })
    }
  }

  return [thiss, thats, boths]
}

// checkers
export const These_isThis = <A, B>(ta: These<A, B>): ta is { t: 'this'; vThis: A } => ta.t === 'this'
export const These_isThat = <A, B>(ta: These<A, B>): ta is { t: 'that'; vThat: B } => ta.t === 'that'
export const These_isBoth = <A, B>(ta: These<A, B>): ta is { t: 'both'; vThis: A; vThat: B } => ta.t === 'both'

// convert
export const These_toOptionThis = <A, B>(ta: These<A, B>): Option<A> =>
  ta.t === 'this' || ta.t === 'both' ? Option_some(ta.vThis) : Option_none

export const These_toOptionThat = <A, B>(ta: These<A, B>): Option<B> =>
  ta.t === 'that' || ta.t === 'both' ? Option_some(ta.vThat) : Option_none
