import { describe, expect, it } from "vitest";

import {
  tokenize,
  Array_match,
  Array_matchMany,
  Char_mkOrThrow,
  type Token,
  Char_mkArray,
  enrichWithSeries,
  renderTransliteration,
} from "./anki.js";

describe("Anki Processor Logic", () => {
  // ==========================================
  // 1. Helper Tests
  // ==========================================
  describe("Char_mkOrThrow", () => {
    it("should accept a single character", () => {
      expect(() => Char_mkOrThrow("ក")).not.toThrow();
      expect(Char_mkOrThrow("A")).toBe("A");
    });

    it("should throw on multiple characters", () => {
      expect(() => Char_mkOrThrow("AB")).toThrow();
    });

    it("should throw on empty string", () => {
      expect(() => Char_mkOrThrow("")).toThrow();
    });
  });

  // ==========================================
  // 2. Array Matcher Tests
  // ==========================================
  describe("Array_match", () => {
    it("should match a sub-sequence correctly", () => {
      const result = Array_match([9, 9], [1, 9, 9, 9, 4]);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ t: "not_matched", otherSentencePart: [1] });
      expect(result[1]).toEqual({ t: "matched" });
      expect(result[2]).toEqual({
        t: "not_matched",
        otherSentencePart: [9, 4],
      });
    });

    it("should handle no matches", () => {
      const result = Array_match([5, 5], [1, 2, 3]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        t: "not_matched",
        otherSentencePart: [1, 2, 3],
      });
    });

    it("should handle full match", () => {
      const result = Array_match([1, 2], [1, 2]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ t: "matched" });
    });
  });

  describe("Array_matchMany (Greedy)", () => {
    it("should prefer longer matches (greedy behavior)", () => {
      // Long [1, 2, 3] vs Short [1, 2]
      const dict = [
        [1, 2, 3],
        [1, 2],
      ];
      const sentence = [1, 2, 3, 4];

      const result = Array_matchMany(dict, sentence);

      // Should match [1, 2, 3] first, leaving [4]
      expect(result[0]).toEqual({ t: "matched", word: [1, 2, 3] });
      expect(result[1]).toEqual({ t: "not_matched", otherSentencePart: [4] });
    });

    it("should respect order if lengths are equal or order dictates priority", () => {
      // If we put the shorter one first in the dictionary, and the logic simply Iterates,
      // it might catch the shorter one depending on implementation.
      // Your implementation breaks on the *first* dictionary match found.
      const dict = [
        [1, 2],
        [1, 2, 3],
      ];
      const sentence = [1, 2, 3];

      const result = Array_matchMany(dict, sentence);

      // Since [1, 2] is checked first, it matches, leaving [3]
      expect(result[0]).toEqual({ t: "matched", word: [1, 2] });
      expect(result[1]).toEqual({ t: "not_matched", otherSentencePart: [3] });
    });
  });

  // ==========================================
  // 3. Khmer Tokenizer Tests
  // ==========================================
  describe("tokenize (Khmer)", () => {
    // Helper to extract values for easier assertion
    const getValues = (tokens: readonly Token[]) =>
      tokens.map((t) =>
        t.t === "UNKNOWN" || t.t === "SPACE" ? t.v.join("") : t.v.join(""),
      );

    const getTypes = (tokens: readonly Token[]) => tokens.map((t) => t.t);

    it("should tokenize simple consonants", () => {
      // "កខ" -> Ka, Kha
      const input = Char_mkOrThrow("ក") + Char_mkOrThrow("ខ");
      const tokens = tokenize(input.split("") as any);

      expect(getTypes(tokens)).toEqual(["CONSONANT", "CONSONANT"]);
      expect(getValues(tokens)).toEqual(["ក", "ខ"]);
    });

    it("should prioritize EXTRA_CONSONANTS over standard consonants", () => {
      // Input: ហ្គ (Ho + Coeng + Ko) -> Transliterates to "ga" (Extra Consonant)
      // If not prioritized, it would be ហ (Ha) + ្ (Coeng) + គ (Ko)
      const input = "ហ្គ";
      const tokens = tokenize(input.split("") as any);

      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.t).toBe("EXTRA_CONSONANT");
      expect(getValues(tokens)).toEqual(["ហ្គ"]);
    });

    it("should prioritize VOWEL_COMBINATIONS over standard vowels", () => {
      // Input: ុះ (U + Reahmuk) -> Vowel Combo "oh"
      // If not prioritized, might be U then Reahmuk (which might be unknown or separate)
      const input = "ុះ";
      const tokens = tokenize(input.split("") as any);

      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.t).toBe("VOWEL_COMBINATION");
      expect(getValues(tokens)).toEqual(["ុះ"]);
    });

    it("should handle mixed complex sentences", () => {
      // "ហ្គាសុះ"
      // Breakdown:
      // ហ្គ (Extra Consonant)
      // ា  (Vowel)
      // ស  (Consonant)
      // ុះ (Vowel Combination)
      const input = "ហ្គាសុះ";
      const tokens = tokenize(input.split("") as any);

      expect(getTypes(tokens)).toEqual([
        "EXTRA_CONSONANT",
        "VOWEL",
        "CONSONANT",
        "VOWEL_COMBINATION",
      ]);

      expect(getValues(tokens)).toEqual(["ហ្គ", "ា", "ស", "ុះ"]);
    });

    it("should handle spaces and unknown characters", () => {
      const input = "ក B"; // Ka, Space, Latin B
      const tokens = tokenize(input.split("") as any);

      expect(getTypes(tokens)).toEqual(["CONSONANT", "SPACE", "UNKNOWN"]);
      expect(getValues(tokens)).toEqual(["ក", " ", "B"]);
    });
  });

  // ==========================================
  // 4. Enrichment Tests
  // ==========================================
  describe("enrichWithSeries", () => {
    it("should default to series 'a'", () => {
      const tokens = tokenize(Char_mkArray("ា")); // Just a vowel
      const enriched = enrichWithSeries(tokens);
      expect(enriched[0]?.series).toBe("a");
    });

    it("should switch series based on standard consonants", () => {
      // ក (Ka, a-series) + ា (Aa) + គ (Ko, o-series) + ា (Aa)
      const text = "កាគា";
      const tokens = tokenize(Char_mkArray(text));
      const enriched = enrichWithSeries(tokens);

      expect(enriched).toHaveLength(4);

      // ក (Consonant matches definition, sets series A)
      expect(enriched[0]?.t).toBe("CONSONANT");
      expect(enriched[0]?.series).toBe("a");

      // ា (Vowel inherits A)
      expect(enriched[1]?.t).toBe("VOWEL");
      expect(enriched[1]?.series).toBe("a");

      // គ (Consonant matches definition, sets series O)
      expect(enriched[2]?.t).toBe("CONSONANT");
      expect(enriched[2]?.series).toBe("o");

      // ា (Vowel inherits O)
      expect(enriched[3]?.t).toBe("VOWEL");
      expect(enriched[3]?.series).toBe("o");
    });

    it("should switch series based on extra consonants", () => {
      // ហ្គ (Ga, a-series) + ា (Aa) + ហ្គ៊ (Go, o-series) + ា (Aa)
      const text = "ហ្គាហ្គ៊ា";
      const tokens = tokenize(Char_mkArray(text));
      const enriched = enrichWithSeries(tokens);

      expect(enriched).toHaveLength(4);

      // ហ្គ (Extra Consonant, series A)
      expect(enriched[0]?.t).toBe("EXTRA_CONSONANT");
      expect(enriched[0]?.series).toBe("a");

      // ា (Vowel inherits A)
      expect(enriched[1]?.t).toBe("VOWEL");
      expect(enriched[1]?.series).toBe("a");

      // ហ្គ៊ (Extra Consonant, series O)
      expect(enriched[2]?.t).toBe("EXTRA_CONSONANT");
      expect(enriched[2]?.series).toBe("o");

      // ា (Vowel inherits O)
      expect(enriched[3]?.t).toBe("VOWEL");
      expect(enriched[3]?.series).toBe("o");
    });
  });

  // ==========================================
  // 5. Renderer Tests
  // ==========================================

  describe("renderTransliteration", () => {
    it("should render correct transliteration for consonants", () => {
      const text = "ក"; // Ka -> ка
      const tokens = tokenize(Char_mkArray(text));
      const enriched = enrichWithSeries(tokens);
      const html = renderTransliteration(enriched);

      expect(html).toContain('<div class="token-trans">ка</div>');
      expect(html).toContain("cons-a");
    });

    it("should highlight correct vowel option based on series", () => {
      // កា (Ka + Aa -> A-series active)
      const textA = "កា";
      const tokensA = tokenize(Char_mkArray(textA));
      const enrichedA = enrichWithSeries(tokensA);
      const htmlA = renderTransliteration(enrichedA);

      // ា: trans_a = "а", trans_o = "еа"
      // Series A active: 'a' should have 'trans-active'
      expect(htmlA).toContain(
        '<span class="trans-option trans-active">а</span>',
      );
      expect(htmlA).toContain(
        '<span class="trans-option trans-inactive">еа</span>',
      );

      // គា (Ko + Aa -> O-series active)
      const textO = "គា";
      const tokensO = tokenize(Char_mkArray(textO));
      const enrichedO = enrichWithSeries(tokensO);
      const htmlO = renderTransliteration(enrichedO);

      // Series O active: 'еа' should have 'trans-active'
      expect(htmlO).toContain(
        '<span class="trans-option trans-inactive">а</span>',
      );
      expect(htmlO).toContain(
        '<span class="trans-option trans-active">еа</span>',
      );
    });

    it("should handle unknowns gracefully", () => {
      const text = "ABC";
      const tokens = tokenize(Char_mkArray(text));
      const enriched = enrichWithSeries(tokens);
      const html = renderTransliteration(enriched);

      expect(html).toContain('<div class="token-char unknown">A</div>');
      expect(html).toContain('<div class="token-trans">—</div>');
    });
  });
});
