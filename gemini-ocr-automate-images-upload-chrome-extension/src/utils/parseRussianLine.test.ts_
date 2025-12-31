import { describe, expect, it } from "vitest"
import { parseRussianLine } from "./parseRussianLine"
import { NonEmptyString } from "./non-empty-string"
import {
  nonEmptyString_afterTrim,
  String_toNonEmptyString_afterTrim,
} from "./non-empty-string-trimmed"

console.log("=== Example 1: Reference ===")
const ex1 = parseLine("**улыбнуться** *см.* **улыбаться**")
displayTokens(ex1)

console.log("\n=== Example 2: Definition with endings ===")
const ex2 = parseLine("**агрессивн|ый**, -ая, -ое, -ые **ឈ្លានពាន**")
displayTokens(ex2)

console.log("\n=== Example 3: Definition with gender ===")
const ex3 = parseLine("**агресси|я**, -и *ж* **អំពើឈ្លានពាន**")
displayTokens(ex3)

console.log("\n=== Example 4: Definition with part of speech ===")
const ex4 = parseLine("**а** I *союз* 1. **ប៉ុន្តែ**")
displayTokens(ex4)

console.log("\n=== Example 5: Complex with aspect pair ===")
const ex5 = parseLine(
  "**сажá|ть**, -ю, -ешь, -ют *несов.*; **поса|ди́ть** *сов.* 1. **អោយអង្គុយ**",
)
displayTokens(ex5)
