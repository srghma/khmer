import { describe, expect, it } from "vitest"
import { parseRussianLine } from "./parseRussianLine"
import { NonEmptyString } from "./non-empty-string"
import {
  nonEmptyString_afterTrim,
  String_toNonEmptyString_afterTrim,
} from "./non-empty-string-trimmed"

const parse = (s: string) => parseRussianLine(nonEmptyString_afterTrim(s))

describe("parseRussianLine", () => {
  describe("References (*см.*)", () => {
    it("parses simple reference", () => {
      const line = "**испечь** *см.* **печь**"
      const result = parse(line)

      expect(result).toEqual({
        t: "reference",
        index: "испечь",
        to: "печь",
      })
    })

    it("parses reference with different spacing", () => {
      const line = "**улыбнуться** *см.* **улыбаться**"
      expect(parse(line)).toEqual({
        t: "reference",
        index: "улыбнуться",
        to: "улыбаться",
      })
    })
  })

  describe("Definitions", () => {
    it("parses standard noun: вагон", () => {
      // **вагон**, -а *м* **ទូរថភ្លើង**; мягкий вагон...
      const line =
        "**вагон**, -а *м* **ទូរថភ្លើង**; мягкий вагон **ទូរថភ្លើងមានពូក**"
      const result = parse(line)

      if (result.t !== "definition") throw new Error("Expected definition")

      expect(result.headwords).toHaveLength(1)
      expect(result.headwords[0]).toEqual({
        word: "вагон",
        morphology: ", -а",
        grammar: "м",
        separator: undefined,
      })
      expect(result.content).toBe(
        "**ទូរថភ្លើង**; мягкий вагон **ទូរថភ្លើងមានពូក**",
      )
    })

    it("parses aspect pairs: сажать/посадить", () => {
      // **сажá|ть**, -ю, -ешь, -ют *несов.*; **поса|ди́ть, -жý, посáд|ишь, -ят** *сов.* 1. **អោយអង្គុយ**...
      const line =
        "**сажá|ть**, -ю, -ешь, -ют *несов.*; **поса|ди́ть** *сов.* 1. **អោយអង្គុយ**"
      const result = parse(line)

      if (result.t !== "definition") throw new Error("Expected definition")

      expect(result.headwords).toHaveLength(2)

      // Imperfective
      expect(result.headwords[0]).toEqual({
        word: "сажá|ть",
        morphology: ", -ю, -ешь, -ют",
        grammar: "несов.",
        separator: "pair", // semicolon
      })

      // Perfective
      expect(result.headwords[1]).toEqual({
        word: "поса|ди́ть",
        morphology: undefined,
        grammar: "сов.",
        separator: undefined,
      })

      expect(result.content).toBe("1. **អោយអង្គុយ**")
    })

    it("parses multiple words connected by 'and': из *и* изо", () => {
      // **из** *и* **изо** *(перед...)* 1. ...
      const line = "**из** *и* **изо** *(перед...)* 1. **ពី**"
      const result = parse(line)

      if (result.t !== "definition") throw new Error("Expected definition")

      expect(result.headwords).toHaveLength(2)
      expect(result.headwords[0]).toEqual({
        word: "из",
        morphology: undefined,
        grammar: undefined,
        separator: "and",
      })
      expect(result.headwords[1]).toEqual({
        word: "изо",
        morphology: undefined,
        grammar: "(перед...)", // Captures content inside *...*
        separator: undefined,
      })

      expect(result.content).toBe("1. **ពី**")
    })

    it("parses complex morphology lines: важн|ый", () => {
      // **важн|ый**, -ая, -ое, -ые; важен, важна, важно, важны *и* важны **សំខាន់**
      const line =
        "**важн|ый**, -ая, -ое, -ые; важен, важна, важно, важны *и* важны **សំខាន់**"
      const result = parse(line)

      if (result.t !== "definition") throw new Error("Expected definition")

      expect(result.headwords).toHaveLength(1)
      expect(result.headwords[0]).toEqual({
        word: "важн|ый",
        // Expect everything up to the next headword or translation
        // Since "важны" is not bold, it is part of morphology.
        // Note: The `*и*` inside morphology might trigger the separator logic?
        // The regex looks for `\s*(?:;|и)\s*` AT THE END of the block.
        // But `*и*` in text is `*и*`. The regex checks literal `и` (no stars) in the separator group?
        // Wait, the line in "Page 64" says: `... важны *и* важны`.
        // If the 'and' is italicized `*и*`, my regex `(?<sep>\s*(?:;|и)\s*)` (no stars) won't catch it as a headword separator unless the text provided is normalized.
        // However, the example usually separates headwords with `*и*` (e.g. `из *и* изо`).
        // If the text has `*и*` between definitions, it should be handled.
        // In `важный`, the extra forms are just text.
        morphology: ", -ая, -ое, -ые; важен, важна, важно, важны *и* важны",
        grammar: undefined,
        separator: undefined,
      })
      expect(result.content).toBe("**សំខាន់**")
    })

    it("parses adjective: маленький", () => {
      const line =
        "**маленьк|ий**, -ая, -ое, -ие; мал, мал|а, -о, -ы *(сравн. ст. меньше)* 1. **តូច**"
      const result = parse(line)

      if (result.t !== "definition") throw new Error("Expected definition")

      expect(result.headwords[0].word).toBe("маленьк|ий")
      // It captures the long string before the next bold/end
      expect(result.headwords[0].morphology).toContain("мал, мал|а")
      // It captures the *...* as grammar
      expect(result.headwords[0].grammar).toBe("(сравн. ст. меньше)")
      expect(result.content).toBe("1. **តូច**")
    })

    it("parses adverb: холодно", () => {
      const line =
        "**холодно** *нареч., безл. в знач. сказ.* **ត្រជាក់**, **រងា**"
      const result = parse(line)

      if (result.t !== "definition") throw new Error("Expected definition")

      expect(result.headwords[0].word).toBe("холодно")
      expect(result.headwords[0].grammar).toBe("нареч., безл. в знач. сказ.")
      expect(result.content).toBe("**ត្រជាក់**, **រងា**")
    })
  })
})
