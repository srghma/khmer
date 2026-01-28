import Lean.Elab.Term
import Regex

/-!
  # NonEmptyStringTrimmed
  A string type that guarantees the contained string is not empty after trimming.
-/

structure NonEmptyStringTrimmed where
  val : String
  property : val.trim ≠ ""
  deriving Repr, DecidableEq, Inhabited

instance : ToString NonEmptyStringTrimmed where
  toString s := s.val

namespace NonEmptyStringTrimmed

/-- Tries to create a NonEmptyStringTrimmed from a raw string.
    Note: This stores the *trimmed* version of the string. -/
def fromString? (s : String) : Option NonEmptyStringTrimmed :=
  let trimmed := s.trim
  if h : trimmed ≠ "" then
    some ⟨trimmed, h⟩
  else
    none

/-- Unsafe constructor for scripts/tests -/
def fromString! (s : String) : NonEmptyStringTrimmed :=
  match fromString? s with
  | some nes => nes
  | none => panic! s!"Expected non-empty string after trim, got: '{s}'"

end NonEmptyStringTrimmed

/-! # Macro for Compile-time Validation -/

section Macros
open Lean Meta Elab

/-- Helper to generate the decidability proof for the property -/
private def mkDecidableProof (valExpr : Expr) : Expr :=
  -- We want to prove: valExpr.trim ≠ ""
  -- 1. Construct expression: valExpr.trim
  let trimMethod := mkApp (mkConst ``String.trim) valExpr
  -- 2. Construct expression: ""
  let emptyStr := toExpr ""
  -- 3. Construct Prop: valExpr.trim = ""
  let propEq := mkApp3 (mkConst ``Eq [1]) (mkConst ``String) trimMethod emptyStr
  -- 4. Construct Decidable instance for (valExpr.trim = "")
  let instDecEq := mkApp2 (mkConst ``instDecidableEqString) trimMethod emptyStr
  -- 5. Construct Prop: valExpr.trim ≠ "" (Not ...)
  let propNe := mkApp (mkConst ``Not) propEq
  -- 6. Construct Decidable instance for (valExpr.trim ≠ "")
  let instDecNe := mkApp2 (mkConst ``instDecidableNot) propEq instDecEq

  -- 7. Apply of_decide_eq_true to get the proof
  -- We assume the macro only calls this if the condition is actually true,
  -- so Eq.refl true is the proof for the Bool check.
  let refl := mkApp2 (mkConst ``Eq.refl [1]) (mkConst ``Bool) (mkConst ``true)
  mkApp3 (mkConst ``of_decide_eq_true) propNe instDecNe refl

/-- Elaboration for the `nest!` macro -/
elab "nest!" s:str : term => do
  let strVal := s.getString
  let trimmed := strVal.trim
  if trimmed.isEmpty then
    throwErrorAt s "String literal is empty after trimming!"
  else
    let valExpr := toExpr trimmed
    let proofExpr := mkDecidableProof valExpr
    return mkApp2 (mkConst ``NonEmptyStringTrimmed.mk) valExpr proofExpr

end Macros

/-! # Page Domain Types -/

inductive PageContent where
  | empty
  | content (text : NonEmptyStringTrimmed)
  deriving Repr, DecidableEq, Inhabited

def PageContent.toString : PageContent → String
  | .empty => "EMPTY"
  | .content s => s.toString

instance : ToString PageContent := ⟨PageContent.toString⟩

/-- Page type: (PageNumber, Content) -/
abbrev Page := Nat × PageContent

/-! # Dictionary Parser -/

/--
  Regex explanation:
  ###             Literal start
  [ ]             Space
  (?:\\*\\*)?     Optional bold marker start (non-capturing)
  (?:Страница|Page) Literal word
  [ ]             Space
  ([0-9]+)        **Capture Group 1**: The Page Number
  (?:\\*\\*)?     Optional bold marker end
-/
def pageMarkerRegex : Regex :=
  Regex.ofString! "### (?:\\*\\*)?(?:Страница|Page) ([0-9]+)(?:\\*\\*)?"

/--
  Parses the Russian dictionary string into pages.
  Logic parallels the TypeScript implementation:
  1. Finds all page markers.
  2. Extracts the number.
  3. Takes the text *between* the current marker and the next marker.
  4. Trims that text and wraps it in the Page type.
-/
def extractPageData (input : String) : IO (List Page) := do
  -- Find all occurrences of the marker
  let matches ← pageMarkerRegex.allMatch input

  let mut pages : List Page := []

  for i in [0:matches.size] do
    let m := matches[i]!

    -- Extract Page Number from Capture Group 1
    -- captures[0] is the whole match, captures[1] is the first group
    let pageNumOpt := do
      let sub ← m.groups[1]?
      let s ← sub
      s.toString.toNat?

    if let some pageNum := pageNumOpt then
      -- Determine content boundaries
      let contentStart := m.matchEnd
      let contentEnd :=
        if h : i + 1 < matches.size then
          matches[i + 1].matchStart
        else
          input.endPos

      -- Extract and process content
      let rawContent := input.extract contentStart contentEnd
      let pageContent : PageContent :=
        match NonEmptyStringTrimmed.fromString? rawContent with
        | some trimmed => .content trimmed
        | none => .empty

      pages := pages.concat (pageNum, pageContent)

  return pages

/-! # Tests -/

-- Test 1: NonEmptyStringTrimmed macro
def s1 : NonEmptyStringTrimmed := nest!"  hello world  "
#guard s1.val == "hello world"

-- Test 2: Standard Parsing
def testInput1 := "
Preamble text...
### Page 10
**word** definition
### **Page 11**
  
### Страница 12
Content for 12
"

-- Execute IO action to test
#eval show IO Unit from do
  let pages ← extractPageData testInput1

  -- Expected: 10, 11 (Empty), 12
  match pages with
  | [p1, p2, p3] =>
    IO.println s!"Page 1: {p1.1}, Content: {p1.2}"
    IO.println s!"Page 2: {p2.1}, Content: {p2.2}"
    IO.println s!"Page 3: {p3.1}, Content: {p3.2}"

    if p1.1 != 10 then throw <| IO.userError "P1 num mismatch"
    if p2.1 != 11 then throw <| IO.userError "P2 num mismatch"
    if p3.1 != 12 then throw <| IO.userError "P3 num mismatch"

    if p2.2 != PageContent.empty then throw <| IO.userError "P2 should be empty"
    match p3.2 with
    | .content s => if s.val != "Content for 12" then throw <| IO.userError "P3 content mismatch"
    | .empty => throw <| IO.userError "P3 should have content"

    IO.println "Test 1 Passed!"
  | _ => throw <| IO.userError s!"Wrong number of pages parsed: {pages.length}"

-- Test 3: No markers
#eval show IO Unit from do
  let pages ← extractPageData "Just some random text without markers"
  if pages.isEmpty then
    IO.println "Test 2 Passed (Empty)"
  else
    throw <| IO.userError "Should be empty"
