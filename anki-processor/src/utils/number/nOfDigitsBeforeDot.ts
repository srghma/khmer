// Copyright 2023 srghma

export function nOfDigitsBeforeDot_string(s: string): number {
  if (s.includes('e')) {
    const parts = s.split('e')
    const mantissa = parts[0] ?? '0'
    const expStr = parts[1] ?? '0'
    const exponent = parseInt(expStr, 10)

    const dotIndex = mantissa.indexOf('.')
    const digitsBeforeDotInMantissa = dotIndex === -1 ? mantissa.length : dotIndex

    return digitsBeforeDotInMantissa + exponent
  }
  const dot = s.indexOf('.')
  return dot === -1 ? s.length : dot
}

export function nOfDigitsBeforeDot(n: number): number {
  if (!Number.isFinite(n)) return Infinity // guard NaN/Infinity
  n = Math.abs(n)
  // n < 1 or 0 → integer part is 0 → 1 digit
  if (n < 1) return 1
  const s = n.toString()
  return nOfDigitsBeforeDot_string(s)
}

export const nOfDigitsBeforeDot_testCases: [number, number][] = [
  // Basic cases
  [0, 1],
  [1, 1],
  [9, 1],
  [10, 2],
  [99, 2],
  [100, 3],
  [999, 3],
  [1000, 4],
  [12345, 5],

  // Negative numbers
  [-1, 1],
  [-10, 2],
  [-999, 3],
  [-12345, 5],

  // Decimals (should ignore fractional part)
  [1.1, 1],
  [1.99, 1],
  [99.99, 2],
  [123.456789, 3],
  [0.999, 1], // truncates to 0

  // Special values
  [NaN, Infinity],
  [Infinity, Infinity],
  [-Infinity, Infinity],
  [-0, 1],

  // Scientific notation
  [1e10, 11], // 10000000000
  [1e100, 101], // 1 followed by 100 zeros
  [1.23e2, 3], // 123
  [1.23e-2, 1], // 0.0123 → truncates to 0
  [9.999e5, 6], // 999900

  // Edge cases
  [Number.MAX_VALUE, 309], // ~1.8e308
  [-Number.MAX_VALUE, 309],
  [Number.MIN_VALUE, 1], // 5e-324 → truncates to 0
  [Number.MAX_SAFE_INTEGER, 16], // 9007199254740991
  [Number.MIN_SAFE_INTEGER, 16], // -9007199254740991
  [Number.EPSILON, 1], // very small → truncates to 0

  // Large numbers
  [999999999999999, 15],
  [1000000000000000, 16],
]

for (const [input, expected] of nOfDigitsBeforeDot_testCases) {
  const result = nOfDigitsBeforeDot(input)
  if (result !== expected) console.log(`❌ nOfDigitsBeforeDot(${input}) = ${result} (expected ${expected})`)
}
