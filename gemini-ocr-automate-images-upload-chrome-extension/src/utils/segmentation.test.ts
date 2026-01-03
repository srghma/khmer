import { describe, it, expect } from "vitest"
import { khmerSentenceToWords_usingBoth_join, Space } from "./segmentation"
import { TypedKhmerWord } from "./khmer-word"

// Helper to cast string to TypedKhmerWord for cleaner tests
const K = (s: string) => s as TypedKhmerWord

describe("khmerSentenceToWords_usingBoth_join", () => {
  it("handles empty arrays", () => {
    const result = khmerSentenceToWords_usingBoth_join([], [])
    expect(result).toEqual([])
  })

  it("handles a single matching word (no splits)", () => {
    const seg = [K("ផ្លូវ")]
    const dict = [K("ផ្លូវ")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    // Should return just the word, no spaces
    expect(result).toEqual([K("ផ្លូវ")])
  })

  it("handles perfect agreement between Segmenter and Dictionary", () => {
    // Both split as: A | B
    const seg = [K("ផ្លូវ"), K("កខ្វេង")]
    const dict = [K("ផ្លូវ"), K("កខ្វេង")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([K("ផ្លូវ"), Space.Both, K("កខ្វេង")])
  })

  it("handles Dictionary having more splits (Segmenter under-segments)", () => {
    // Word: "AB"
    // Segmenter: ["AB"]
    // Dictionary: ["A", "B"]
    const seg = [K("កខ")]
    const dict = [K("ក"), K("ខ")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      K("ក"),
      Space.Dictionary, // Split authorized only by Dictionary
      K("ខ"),
    ])
  })

  it("handles Segmenter having more splits (Dictionary under-segments/unknown word)", () => {
    // Word: "AB"
    // Segmenter: ["A", "B"]
    // Dictionary: ["AB"]
    const seg = [K("ក"), K("ខ")]
    const dict = [K("កខ")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      K("ក"),
      Space.Segmenter, // Split authorized only by Segmenter
      K("ខ"),
    ])
  })

  it("handles complex overlapping splits (Disagreement)", () => {
    // Total String: "ABC" (using Latin for clarity of index logic, applies same to Khmer)
    // Segmenter: ["AB", "C"] -> Cuts at 2, 3
    // Dictionary: ["A", "BC"] -> Cuts at 1, 3
    // Union Cuts: 1, 2, 3

    // Khmer equivalent:
    // "កខគ"
    // Seg: "កខ", "គ"
    // Dict: "ក", "ខគ"
    const seg = [K("កខ"), K("គ")]
    const dict = [K("ក"), K("ខគ")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      K("ក"),
      Space.Dictionary, // Cut at 1 (Dict only)
      K("ខ"),
      Space.Segmenter, // Cut at 2 (Seg only)
      K("គ"),
    ])
  })

  it("handles real-world Khmer example with mixed agreement", () => {
    // Full: "ផ្លូវកខ្វេងកខ្វាក់"
    // Seg: ["ផ្លូវ", "កខ្វេងក", "ខ្វាក់"]
    // Dict: ["ផ្លូវ", "ក", "ខ្វេង", "ក", "ខ្វាក់"] (Hypothetically more granular)

    const seg = [K("ផ្លូវ"), K("កខ្វេងក"), K("ខ្វាក់")]
    const dict = [K("ផ្លូវ"), K("ក"), K("ខ្វេង"), K("ក"), K("ខ្វាក់")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      K("ផ្លូវ"),
      Space.Both, // Both agree "ផ្លូវ" ends here
      K("ក"),
      Space.Dictionary, // Dict splits inside "កខ្វេងក"
      K("ខ្វេង"),
      Space.Dictionary, // Dict splits inside "កខ្វេងក"
      K("ក"),
      Space.Both, // Both agree "កខ្វេងក" ends here
      K("ខ្វាក់"),
    ])
  })

  it("throws/fails gracefully if inputs do not form the same string", () => {
    // The implementation relies on char lengths. If inputs differ, logic implies misalignment.
    // However, the function strictly processes based on flat char array of Seg + Dict cuts.
    // It assumes inputs are valid representations of the SAME text.
    // This test ensures the internal flatten logic works, but logically this is "Garbage In, Garbage Out".

    const seg = [K("ក")]
    const dict = [K("ខ")] // Different char

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    // Result logic:
    // Seg cuts: 1. Dict cuts: 1.
    // Flattened Seg chars: ['ក'].
    // Slice(0,1) -> "ក".
    // Space at 1? No (end < totalLength is false).
    expect(result).toEqual([K("ក")])
  })
})
