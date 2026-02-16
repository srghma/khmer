import { CharArray_mkFromString, type Char } from './char'
import { CONSONANTS, EXTRA_CONSONANTS, VOWELS, VOWEL_COMBINATIONS, INDEPENDENT_VOWELS } from './khmer-consonants-vovels'
import type { TypedKhmerWord } from './khmer-word'
import { tokenize } from './khmer_parse_tokenize'
import { enrichWithSeries } from './khmer_parse_tokenize_with_series'
import { String_toNonEmptyString_orUndefined_afterTrim } from './non-empty-string-trimmed'
import { strToLowercaseCyrillicWithGroups_orThrow, type KhmerToRussianOutput } from './khmerToRussianOutput'

const getPureTrans = (trans: string) => {
  // Removes trailing inherent vowels 'а' or 'о', 'я', 'ё'
  return trans.replace(/[ао]$/, '').replace(/я$/, '').replace(/ё$/, '')
}

export const khmerToRussian = (khmerText: TypedKhmerWord): KhmerToRussianOutput | undefined => {
  const chars: readonly Char[] = CharArray_mkFromString(khmerText)
  const tokens = tokenize(chars)
  const enrichedTokens = enrichWithSeries(tokens)

  let result = ''

  // console.log('--- Starting Transliteration ---')
  // console.log('Input:', khmerText)

  for (let i = 0; i < enrichedTokens.length; i++) {
    const token = enrichedTokens[i]!
    const nextToken = enrichedTokens[i + 1]

    // console.log(`\n[Token ${i}] Type: ${token.type}, Value: ${JSON.stringify(token.v)}`)

    switch (token.type) {
      case 'consonant': {
        const def = CONSONANTS.find(c => c.letter === token.v)
        if (!def) {
          // console.log(`  No definition found for consonant: ${token.v}`)
          result += token.v
          break
        }

        const prevToken = i > 0 ? enrichedTokens[i - 1] : undefined
        const isSubscript = prevToken?.type === 'diacritic' && prevToken.v === '្'
        const hasVowelNext = nextToken?.type === 'vowel' || nextToken?.type === 'vowel_combination'
        const hasSubscriptNext = nextToken?.type === 'diacritic' && nextToken.v === '្'
        const isBantakNext = nextToken?.type === 'diacritic' && nextToken.v === '់'
        const isFinal = !nextToken || nextToken.type === 'SPACE' || isBantakNext

        let subscriptIsRetroflex = false
        if (hasSubscriptNext && enrichedTokens[i + 2]) {
          const subscriptConsonant = enrichedTokens[i + 2]
          if (subscriptConsonant?.type === 'consonant') {
            const subscriptDef = CONSONANTS.find(c => c.letter === subscriptConsonant.v)
            if (subscriptDef && subscriptDef.trans.startsWith('.')) {
              subscriptIsRetroflex = true
            }
          }
        }

        if (hasSubscriptNext && subscriptIsRetroflex) {
          // console.log(`  Skipping base consonant ${token.v} because next is retroflex subscript`)
          break
        }

        const hasOtherConsonants = enrichedTokens.some(
          (t, idx) => idx !== i && (t.type === 'consonant' || t.type === 'extra_consonant'),
        )

        const shouldSuppressVowel = hasVowelNext || isSubscript || hasSubscriptNext || (isFinal && hasOtherConsonants)

        const output = shouldSuppressVowel ? getPureTrans(def.trans) : def.trans

        // console.log(`  Consonant Logic:`, {
        //   letter: token.v,
        //   trans: def.trans,
        //   isSubscript,
        //   hasVowelNext,
        //   hasSubscriptNext,
        //   isFinal,
        //   isBantakNext,
        //   shouldSuppressVowel,
        //   output,
        // })

        result += output
        break
      }

      case 'extra_consonant': {
        const def = EXTRA_CONSONANTS.find(
          ec => ec.letters.length === token.v.length && ec.letters.every((l, j) => l === token.v[j]),
        )
        if (!def) {
          result += token.v.join('')
          break
        }
        // console.log(`  Extra Consonant: ${token.v.join('')} -> ${def.trans}`)

        const options = def.trans
          .split(',')
          .map(x => x.trim())
          .sort()
        const output = options.length > 1 ? `(${options.join('|')})` : options[0]
        result += output
        break
      }

      case 'vowel': {
        const def = VOWELS.find(v => v.letter === token.v)
        if (!def) {
          result += token.v
          break
        }
        const output = token.series === 'a' ? def.trans_a : def.trans_o
        // console.log(`  Vowel: ${token.v} (Series ${token.series}) -> ${output}`)
        result += output
        break
      }

      case 'vowel_combination': {
        const def = VOWEL_COMBINATIONS.find(
          vc => vc.letters.length === token.v.length && vc.letters.every((l, j) => l === token.v[j]),
        )
        if (!def) {
          result += token.v.join('')
          break
        }
        const output = token.series === 'a' ? def.trans_a : def.trans_o
        // console.log('  Vowel Combination:', {
        //   letters: token.v,
        //   series: token.series,
        //   output,
        // })
        result += output
        break
      }

      case 'independent_vowel': {
        const def = INDEPENDENT_VOWELS.find(iv => iv.letters === token.v)
        if (def) {
          const options = def.trans.split(',').map(x => x.trim())
          const output = options.length > 1 ? `(${options.join('|')})` : options[0]
          // console.log(`  Independent Vowel: ${token.v} -> ${output}`)
          result += output
        } else {
          result += token.v
        }
        break
      }

      case 'diacritic': {
        // console.log(`  Diacritic: ${token.v} (Handled via suppression logic)`)
        break
      }

      case 'SPACE':
        result += ' '
        break

      case 'UNKNOWN': {
        const raw = token.v.join('')
        if (raw === 'ៗ') {
          const words = result.trim().split(' ')
          const lastWord = words[words.length - 1]
          if (lastWord) result += ' ' + lastWord
          // console.log(`  Duplication: ៗ -> repeated ${lastWord}`)
        } else {
          result += raw
        }
        break
      }
    }
    // console.log(`  Current Result Buffer: "${result}"`)
  }

  // console.log('\nFinal Buffer Before Cleanup:', result)
  const x = String_toNonEmptyString_orUndefined_afterTrim(result.replace(/\s+/g, ' '))
  if (!x) return
  return strToLowercaseCyrillicWithGroups_orThrow(x)
}
