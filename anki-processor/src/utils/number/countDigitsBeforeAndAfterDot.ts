// Copyright 2023 srghma

import {
  nOfDigitsBeforeDot_string,
  nOfDigitsBeforeDot_testCases,
} from "./nOfDigitsBeforeDot.js";
import {
  nOfDigitsAfterDot_string,
  nOfDigitsAfterDot_testCases,
} from "./nOfDigitsAfterDot.js";

export function countDigitsAfterDotAndBeforeDot(num: number): {
  before: number;
  after: number;
} {
  if (!Number.isFinite(num)) return { before: Infinity, after: Infinity };

  const n = Math.abs(num);
  const s = n.toString();

  // For numbers < 1, the integer part has 1 digit (0)
  if (n < 1) {
    return {
      before: 1,
      after: nOfDigitsAfterDot_string(s),
    };
  }

  // For numbers >= 1, use string-based functions
  return {
    before: nOfDigitsBeforeDot_string(s),
    after: nOfDigitsAfterDot_string(s),
  };
}

// Test "before" digits
for (const [input, expectedBefore] of nOfDigitsBeforeDot_testCases) {
  const result = countDigitsAfterDotAndBeforeDot(input);
  if (result.before !== expectedBefore) {
    console.log(
      `❌ before: countDigitsAfterDotAndBeforeDot(${input}).before = ${result.before} (expected ${expectedBefore})`,
    );
  }
}

// Test "after" digits
for (const [input, expectedAfter] of nOfDigitsAfterDot_testCases) {
  const result = countDigitsAfterDotAndBeforeDot(input);
  if (result.after !== expectedAfter) {
    console.log(
      `❌ after: countDigitsAfterDotAndBeforeDot(${input}).after = ${result.after} (expected ${expectedAfter})`,
    );
  }
}
