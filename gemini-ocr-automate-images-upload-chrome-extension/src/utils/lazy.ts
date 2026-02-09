/**
 * A Lazy value is simply a thunk (a function taking no arguments and returning a value).
 * Inspired by Haskell's non-strict evaluation and PureScript's Data.Lazy.
 */
export type Lazy<T> = () => T

/**
 * Forces the evaluation of a lazy value.
 * Since Lazy<T> is just a function, this is equivalent to invoking it.
 */
export const force = <T>(l: Lazy<T>): T => l()

/**
 * Creates a Lazy value from a computation.
 * Crucially, this MEMOIZES the result (Call-by-need),
 * ensuring the computation only runs once.
 */
export const defer = <T>(thunk: () => T): Lazy<T> => {
  let evaluated = false
  let value: T

  return () => {
    if (!evaluated) {
      value = thunk()
      evaluated = true
    }
    return value
  }
}

/**
 * Lifts a raw value into a Lazy context (pure/return).
 * The value is already known, so no computation is needed.
 */
export const pure =
  <T>(v: T): Lazy<T> =>
  () =>
    v

/**
 * Functor map.
 * Creates a new Lazy value that, when forced, forces the inner value
 * and applies the function f.
 */
export const map = <A, B>(fa: Lazy<A>, f: (a: A) => B): Lazy<B> => {
  return defer(() => f(fa()))
}

/**
 * Monadic bind.
 */
export const bind = <A, B>(fa: Lazy<A>, f: (a: A) => Lazy<B>): Lazy<B> => {
  return defer(() => f(fa())())
}

/**
 * Lift a function of two arguments.
 */
export const lift2 = <A, B, C>(f: (a: A, b: B) => C, fa: Lazy<A>, fb: Lazy<B>): Lazy<C> => {
  return defer(() => f(fa(), fb()))
}
