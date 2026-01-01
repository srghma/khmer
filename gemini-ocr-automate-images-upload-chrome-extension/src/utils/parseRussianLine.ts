import { NonEmptyString, nonEmptyString_afterTrim } from "./non-empty-string"
import { TypedRussianMultiWord } from "./russian-word"

export type TypedRussianLine =
  // **улыбаться**, -юсь, -ешься, -ются *несов.*; **улыбн|у́ться**, -у́сь, -ёшься, -у́тся *сов.* **ញញឹម**, **ញញឹមញញែម**; **девушка улыбается нам** **នារីញញឹមញញែមដាក់យើង**; **он весело улыбнулся** **គាត់បានញញឹមយ៉ាងសប្បាយ**
  | {
    t: "ordinary"
    index: TypedRussianMultiWord
    otherIndexEndings: NonEmptyString[] // ["юсь", ...]
    part: NonEmptyString // несов.
    content: NonEmptyString // **улыбн|у́ться**,
  }
  // **улыбнуться** *см.* **улыбаться**
  | { t: "look"; index: TypedRussianMultiWord; to: TypedRussianMultiWord }

export const parseRussianLine = (
  line: NonEmptyString,
): TypedRussianLine => {
}
