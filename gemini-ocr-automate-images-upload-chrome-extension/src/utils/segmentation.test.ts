import { describe, it, expect } from "vitest"
import { khmerSentenceToWords_usingBoth_join, Color } from "./segmentation"
import { strToKhmerWordOrThrow } from "./khmer-word"

// Helper to cast string to TypedKhmerWord for cleaner tests
const K = strToKhmerWordOrThrow

describe("khmerSentenceToWords_usingBoth_join", () => {
  it("handles empty arrays", () => {
    const result = khmerSentenceToWords_usingBoth_join([], [])
    expect(result).toEqual([])
  })

  it("handles a single matching word (no splits)", () => {
    // Both: "ផ្លូវ" |
    const seg = [K("ផ្លូវ")]
    const dict = [K("ផ្លូវ")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      { w: K("ផ្លូវ"), color: Color.Both },
    ])
  })

  it("handles perfect agreement between Segmenter and Dictionary", () => {
    // Both: "ផ្លូវ" | "កខ្វេង" |
    const seg = [K("ផ្លូវ"), K("កខ្វេង")]
    const dict = [K("ផ្លូវ"), K("កខ្វេង")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      { w: K("ផ្លូវ"), color: Color.Both },
      { w: K("កខ្វេង"), color: Color.Both },
    ])
  })

  it("handles Dictionary having more splits (Segmenter under-segments)", () => {
    // Word: "AB"
    // Segmenter: ["AB"] -> Cuts: {2}
    // Dictionary: ["A", "B"] -> Cuts: {1, 2}
    // Union: 1, 2
    // 1: "A", Dict only -> Dictionary
    // 2: "B", Both (End of string) -> Both

    const seg = [K("កខ")]
    const dict = [K("ក"), K("ខ")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      { w: K("ក"), color: Color.Dictionary },
      { w: K("ខ"), color: Color.Both },
    ])
  })

  it("handles Segmenter having more splits (Dictionary under-segments)", () => {
    // Word: "AB"
    // Segmenter: ["A", "B"] -> Cuts: {1, 2}
    // Dictionary: ["AB"] -> Cuts: {2}
    // Union: 1, 2
    // 1: "A", Seg only -> Segmenter
    // 2: "B", Both (End of string) -> Both

    const seg = [K("ក"), K("ខ")]
    const dict = [K("កខ")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      { w: K("ក"), color: Color.Segmenter },
      { w: K("ខ"), color: Color.Both },
    ])
  })

  it("handles complex overlapping splits (Disagreement)", () => {
    // Khmer: "កខគ"
    // Seg: ["កខ", "គ"] -> Cuts: {2, 3}
    // Dict: ["ក", "ខគ"] -> Cuts: {1, 3}
    // Union: 1, 2, 3

    // 1: "ក" (0->1). In Dict? Yes. In Seg? No. -> Dictionary
    // 2: "ខ" (1->2). In Seg? Yes. In Dict? No. -> Segmenter
    // 3: "គ" (2->3). In Both? Yes. -> Both

    const seg = [K("កខ"), K("គ")]
    const dict = [K("ក"), K("ខគ")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      { w: K("ក"), color: Color.Dictionary },
      { w: K("ខ"), color: Color.Segmenter },
      { w: K("គ"), color: Color.Both },
    ])
  })

  it("handles real-world Khmer example with mixed agreement", () => {
    // Full: "ផ្លូវកខ្វេងកខ្វាក់"
    // Seg: ["ផ្លូវ", "កខ្វេងក", "ខ្វាក់"]
    // Dict: ["ផ្លូវ", "ក", "ខ្វេង", "ក", "ខ្វាក់"]

    const seg = [K("ផ្លូវ"), K("កខ្វេងក"), K("ខ្វាក់")]
    const dict = [K("ផ្លូវ"), K("ក"), K("ខ្វេង"), K("ក"), K("ខ្វាក់")]

    const result = khmerSentenceToWords_usingBoth_join(seg, dict)

    expect(result).toEqual([
      { w: K("ផ្លូវ"), color: Color.Both }, // End of "ផ្លូវ"
      { w: K("ក"), color: Color.Dictionary }, // Dict splits inside "កខ្វេងក"
      { w: K("ខ្វេង"), color: Color.Dictionary }, // Dict splits inside "កខ្វេងក"
      { w: K("ក"), color: Color.Both }, // End of "កខ្វេងក"
      { w: K("ខ្វាក់"), color: Color.Both }, // End of string
    ])
  })

  it("throws if inputs do not form the same string", () => {
    const seg = [K("ក")]
    const dict = [K("ខ")] // Different char

    expect(() => khmerSentenceToWords_usingBoth_join(seg, dict)).toThrow(
      /Mismatching inputs/,
    )
  })

  it("throws if inputs differ in length/content (e.g. one has extra space)", () => {
    const seg = [K("ក"), K("ខ")]
    const dict = [K("ក"), K(" "), K("ខ")]

    expect(() => khmerSentenceToWords_usingBoth_join(seg, dict)).toThrow(
      /Mismatching inputs/,
    )
  })
})
