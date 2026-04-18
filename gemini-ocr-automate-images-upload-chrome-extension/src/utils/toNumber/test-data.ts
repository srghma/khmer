export type NumericTestCase = [number, boolean]

export const validNumberCases: NumericTestCase[] = [
  [0, true],
  [1, true],
  [-1, true],
  [1.1, true],
  [1.123456789, true],
  [1234567890123456, true], // max pos by digits
  [-1234567890123456, true], // max neg by digits
  [0.1234567891, true], // max acceptable by digits
  [-0.1234567891, true], // max neg acceptable by digits
  [1.12345678901, true], // change to false if checking length of digits after dot
  [0.2345678901234567, true], // change to false if checking length of digits after dot
  [NaN, false],
  [Infinity, false],
  [Number.EPSILON, true], // change to false if checking length of digits after dot
  [Number.MAX_SAFE_INTEGER, true],
  [Number.MIN_SAFE_INTEGER, true],
  [Number.MAX_VALUE, true], // change to false if checking length of digits before dot
  [-Number.MAX_VALUE, true], // change to false if checking length of digits before dot
  [Number.MIN_VALUE, true], // change to false if checking length of digits after dot
  [-Number.MIN_VALUE, true], // change to false if checking length of digits after dot
]

export const validNonNegativeNumberCases: NumericTestCase[] = [
  [0, true],
  [1, true],
  [-1, false],
  [1.1, true],
  [-1.1, false],
]

export const validPercentCases: NumericTestCase[] = [
  [0, true],
  [50, true],
  [100, true],
  [100.0000000001, false],
  [-1, false],
  [101, false],
]

export const validIntCases: NumericTestCase[] = [
  [0, true],
  [1, true],
  [-1, true],
  [1.1, false],
  [-1.1, false],
]

export const validNonNegativeIntCases: NumericTestCase[] = [
  [0, true],
  [1, true],
  [-1, false],
  [1.1, false],
  [1234567890123456, true],
]
