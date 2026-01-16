// Copyright 2023 srghma

export function nOfDigitsAfterDot_string(s: string): number {
  // Handle scientific notation (e.g., "1.23e+5" or "5e-324")
  if (s.includes('e')) {
    const parts = s.split('e')
    const base = parts[0] ?? '0'
    const exp = parts[1] ?? '0'

    const exponent = parseInt(exp, 10)
    const dotIndex = base.indexOf('.')
    const baseDecimals = dotIndex === -1 ? 0 : base.length - dotIndex - 1

    // After shifting by exponent, how many digits remain after the dot?
    const finalDecimals = baseDecimals - exponent
    return Math.max(0, finalDecimals)
  }

  const dot = s.indexOf('.')
  return dot === -1 ? 0 : s.length - dot - 1
}

export function nOfDigitsAfterDot(n: number): number {
  if (!Number.isFinite(n)) return Infinity // guard NaN/Infinity
  const s = Math.abs(n).toString()
  return nOfDigitsAfterDot_string(s)
}

export const nOfDigitsAfterDot_testCases: [number, number][] = [
  // Basic cases
  [0, 0],
  [1, 0],
  [1.1, 1],
  [1.12, 2],
  [1.123456789, 9],
  [1.12345678901, 11],
  [-1.5, 1],
  [-1.0001, 4],
  [42.99, 2],
  [42, 0],
  [0.00001, 5],
  [123456.000001, 6],
  [NaN, Infinity],
  [Infinity, Infinity],
  [Number.MAX_VALUE, 0], // 1.7976931348623157 × 10^308 → 0 decimals after shift
  [-Number.MAX_VALUE, 0], // -1.7976931348623157 × 10^308 → 0 decimals after shift
  [Number.MIN_VALUE, 324], // 5 × 10^-324 → 324 decimals after shift
  [-Number.MIN_VALUE, 324], // -5 × 10^-324 → 324 decimals after shift
  [-0, 0], // negative zero
  [0.0, 0], // explicit decimal zero
  [1.0, 0], // trailing zero (JavaScript removes it)
  [1e10, 0], // 10000000000 (scientific -> integer)
  [1.23e2, 0], // 123 (scientific -> integer)
  [1.23e-2, 4], // 0.0123 (scientific -> decimal)
  [1.23e1, 1], // 12.3 (scientific -> decimal)
  [9.99999999999999, 14], // near precision limit
  [0.1 + 0.2, 17], // 0.30000000000000004 (floating point error)
  [Number.EPSILON, 31], // 2.220446049250313e-16 → very small
  [Number.MAX_SAFE_INTEGER, 0], // 9007199254740991
  [Number.MIN_SAFE_INTEGER, 0], // -9007199254740991
  [1e-10, 10], // 0.0000000001
  [1e-100, 100], // very small scientific
  [1e100, 0], // very large scientific
]

// ===== Test runner =====
for (const [input, expected] of nOfDigitsAfterDot_testCases) {
  const result = nOfDigitsAfterDot(input)
  if (result !== expected) console.log(`❌ nOfDigitsAfterDot(${input}) = ${result} (expected ${expected})`)
}
