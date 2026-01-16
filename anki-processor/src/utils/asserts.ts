// Copyright 2023 srghma

/**
 * This function narrows the type of the value and returns it.
 *
 * @param value The value to check.
 * @param message An optional custom error message.
 */
export function assertIsDefinedAndReturn<T>(
  value: T,
  message: string = 'Assertion Error: value is null or undefined',
): NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message)
  }
  return value
}

/**
 * This function is a type guard that narrows the type of the value.
 *
 * @param value The value to check.
 * @param message An optional custom error message.
 */
export function assertIsDefined<T>(
  value: T,
  message: string = 'Assertion Error: value is null or undefined',
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message)
  }
}

/**
 * Asserts that a value is of type `never` and throws an error if called.
 *
 * This is useful for **exhaustiveness checking** in `switch` statements
 * when working with **tagged unions**. TypeScript will generate a type error
 * if a new variant is added to the union but is not handled.
 *
 * Example usage:
 * ```ts
 * type Shape = { t: 'circle'; radius: number } | { t: 'square'; size: number };
 *
 * function area(shape: Shape) {
 *   switch (shape.t) {
 *     case 'circle': return Math.PI * shape.radius ** 2;
 *     case 'square': return shape.size ** 2;
 *     default: return assertNever(shape); // <-- TypeScript will error `Argument of type '...' is not assignable to parameter of type 'never'.(2345)` if a new variant is added
 *   }
 * }
 * ```
 *
 * @param x The value that should be `never`. TypeScript ensures type safety.
 * @throws Will always throw an `Error` if called at runtime.
 */
export function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + JSON.stringify(x))
}
