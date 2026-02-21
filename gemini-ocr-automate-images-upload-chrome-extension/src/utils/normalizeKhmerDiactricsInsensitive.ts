import type { TypedContainsKhmer } from './string-contains-khmer-char'

export function normalizeKhmerInsensitive(str: TypedContainsKhmer): TypedContainsKhmer {
  return (
    str
      .normalize('NFD')
      /**
       * We remove shifters, modifiers, and the Coeng (subscript) sign:
       * \u17C9-\u17CA: Shifters (Muusikatoan, Triisap)
       * \u17CB-\u17D1: Modifiers (Bantoc, Robat, Toandakhiat, Kakabat, etc.)
       * \u17D2: Khmer Sign Coeng (Subscript sign)
       * \u17D3: Bathamasat
       *
       * We EXCLUDE \u17C6, \u17C7, \u17C8 as they are essential vowel sounds.
       */
      .replace(/[\u17C9-\u17D3]/g, '')
      .normalize('NFC')
      .toLowerCase() as TypedContainsKhmer
  )
}