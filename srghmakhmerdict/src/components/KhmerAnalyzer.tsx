import React, { useMemo } from 'react'
import { TooltipMobileFriendly } from './TooltipMobileFriendly'
import { clsx } from 'clsx'

// Utils & Logic
import {
  enrichWithSeries,
  type EnrichedToken,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer_parse_tokenize_with_series'
import { tokenize, type Token } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer_parse_tokenize'
import { CharArray_mkFromString } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

// Data Sets
import {
  CONSONANTS,
  DIACRITICS,
  EXTRA_CONSONANTS,
  INDEPENDENT_VOWELS,
  VOWEL_COMBINATIONS,
  VOWELS,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels'

import { executeNativeTts } from '../utils/tts/native'
import type { TextSegment } from '../utils/text-processing/text'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { TextSegmentEnhanced } from '../utils/text-processing/text-enhanced'
import { DefinitionPopup } from './DefinitionPopup'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// --- Helper Components ---

/**
 * Renders a single piece of info (Transliteration or IPA)
 * handling the Series A / Series O dimming logic
 */
const SeriesDualDisplay = ({
  valA,
  valO,
  activeSeries,
  isIPA = false,
}: {
  valA: string
  valO: string
  activeSeries: 'a' | 'o' | null
  isIPA?: boolean
}) => {
  const baseClass = isIPA ? 'font-mono text-[9px]' : 'text-[10px] font-medium'
  const activeClass = 'text-foreground opacity-100 font-bold'
  const inactiveClass = 'text-default-400 opacity-60'

  return (
    <div className={clsx('flex gap-0.5 justify-center leading-none', baseClass)}>
      <span className={activeSeries === 'a' ? activeClass : inactiveClass}>{isIPA ? `/${valA}/` : valA}</span>
      <span className="text-default-300">|</span>
      <span className={activeSeries === 'o' ? activeClass : inactiveClass}>{isIPA ? `/${valO}/` : valO}</span>
    </div>
  )
}

/**
 * Renders a single parsed token (The Box)
 */
const TokenRenderer = React.memo(({ token }: { token: Token }) => {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent parent sentence TTS
    const text =
      token.type === 'SPACE' ||
      token.type === 'UNKNOWN' ||
      token.type === 'extra_consonant' ||
      token.type === 'vowel_combination'
        ? token.v.join('')
        : token.v

    const text_ = String_toNonEmptyString_orUndefined_afterTrim(text)

    if (!text_) return
    executeNativeTts(text_, 'km-KH')
  }

  // Common container style
  const boxClass =
    'flex flex-col items-center justify-start border border-default-200 bg-content1 rounded p-1 min-w-[32px] cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors select-none'

  if (token.type === 'SPACE') {
    // Render a visual break or gap
    return <div className="w-4 h-full shrink-0" />
  }

  if (token.type === 'UNKNOWN') {
    const text = token.v.join('')

    return (
      <div className={clsx(boxClass, 'opacity-50')}>
        <div className="text-lg mb-1">{text}</div>
        <div className="text-[10px]">—</div>
      </div>
    )
  }

  // Handle CharKhmerGroup variants
  switch (token.type) {
    case 'consonant': {
      const def = CONSONANTS.find(c => c.letter === token.v)

      if (!def) return null

      const text = token.v
      const isSeriesA = def.series === 'a'

      return (
        <button className={boxClass} onClick={handleSpeak}>
          <div className={clsx('text-xl leading-none mb-1', isSeriesA ? 'text-danger-600' : 'text-primary-600')}>
            {text}
          </div>
          <div className="text-[10px] font-bold text-default-600">{def.trans}</div>
          <div className="text-[9px] font-mono text-default-400">/{def.ipa}/</div>
        </button>
      )
    }

    case 'extra_consonant': {
      const def = EXTRA_CONSONANTS.find(
        ec => ec.letters.length === token.v.length && ec.letters.every((l, i) => l === token.v[i]),
      )

      if (!def) return null

      const text = token.v.join('')

      return (
        <button className={boxClass} onClick={handleSpeak}>
          <div className="text-xl font-khmer leading-none mb-1 italic text-secondary-600">{text}</div>
          <div className="text-[10px] font-bold text-default-600">{def.trans}</div>
          <div className="text-[9px] font-mono text-default-400">/{def.ipa}/</div>
        </button>
      )
    }

    case 'vowel': {
      const def = VOWELS.find(v => v.letter === token.v)

      if (!def) return null

      const text = token.v
      const activeSeries = (token as EnrichedToken & { type: 'vowel' }).series ?? null

      return (
        <button className={boxClass} onClick={handleSpeak}>
          <div className="text-xl font-khmer leading-none mb-1">{text}</div>
          <SeriesDualDisplay activeSeries={activeSeries} valA={def.trans_a} valO={def.trans_o} />
          <SeriesDualDisplay isIPA activeSeries={activeSeries} valA={def.ipa_a} valO={def.ipa_o} />
        </button>
      )
    }

    case 'vowel_combination': {
      const def = VOWEL_COMBINATIONS.find(
        vc => vc.letters.length === token.v.length && vc.letters.every((l, i) => l === token.v[i]),
      )

      if (!def) return null

      const text = token.v.join('')
      const activeSeries = (token as EnrichedToken & { type: 'vowel_combination' }).series ?? null

      return (
        <button className={boxClass} onClick={handleSpeak}>
          <div className="text-xl font-khmer leading-none mb-1">{text}</div>
          <SeriesDualDisplay activeSeries={activeSeries} valA={def.trans_a} valO={def.trans_o} />
          <SeriesDualDisplay isIPA activeSeries={activeSeries} valA={def.ipa_a} valO={def.ipa_o} />
        </button>
      )
    }

    case 'independent_vowel': {
      const def = INDEPENDENT_VOWELS.find(v => v.letters === token.v)

      if (!def) return null

      const text = token.v

      return (
        <button className={boxClass} onClick={handleSpeak}>
          <div className="text-xl font-khmer leading-none mb-1 text-warning-600">{text}</div>
          <div className="text-[10px] font-bold text-default-600">{def.trans}</div>
          <div className="text-[9px] font-mono text-default-400">/{def.ipa}/</div>
        </button>
      )
    }

    case 'diacritic': {
      const def = DIACRITICS.find(d => d.symbol === token.v)

      if (!def) return null

      const text = token.v

      return (
        <TooltipMobileFriendly
          content={
            <div className="px-1 py-2 max-w-[100px]">
              <div className="font-bold text-small mb-1">{def.name}</div>
              <div className="text-xs text-default-400">{def.desc_en}</div>
            </div>
          }
        >
          <div className={clsx(boxClass, 'border-dashed border-default-400 bg-default-50')}>
            <div className="text-xl font-khmer leading-none mb-1 text-default-500">◌{text}</div>
            <div className="text-[9px] max-w-[50px] leading-tight text-center text-default-500 line-clamp-2 w-full px-0.5">
              {def.desc_en}
            </div>
          </div>
        </TooltipMobileFriendly>
      )
    }

    default:
      assertNever(token)
  }
})

TokenRenderer.displayName = 'TokenRenderer'

// --- Sub-Component: Khmer Word Block ---

const KhmerWordBlock = React.memo(
  ({ word, definition }: { word: TypedKhmerWord; definition?: NonEmptyStringTrimmed }) => {
    const enrichedTokens = useMemo(() => {
      const chars = CharArray_mkFromString(word)
      const tokens = tokenize(chars)

      return enrichWithSeries(tokens)
    }, [word])

    return (
      <div className={`flex flex-col items-center ${enrichedTokens.length < 2 ? 'max-w-[80px]' : ''}`}>
        <div className="flex flex-wrap gap-1.5 items-stretch bg-default-50/50 rounded-lg p-1 border border-transparent hover:border-default-200 transition-colors">
          {enrichedTokens.map((token, idx) => (
            <TokenRenderer key={idx} token={token} />
          ))}
        </div>
        {definition && <DefinitionPopup definitionHtml={definition} />}
      </div>
    )
  },
)

KhmerWordBlock.displayName = 'KhmerWordBlock'

// --- Main Component ---

interface KhmerAnalyzerProps {
  segments: NonEmptyArray<TextSegment | TextSegmentEnhanced>
}

const KhmerAnalyzerImpl: React.FC<KhmerAnalyzerProps> = ({ segments }) => {
  return (
    <div className="h-full flex flex-wrap gap-x-4 gap-y-4 items-start content-start">
      {segments.map((segment, segIdx) => {
        // 1. Handle Whitespace
        if (segment.t === 'whitespace') {
          // Returning raw string or a Fragment with the space string.
          // Since parent is flex-wrap, this preserves logical spacing if needed.
          return segment.v
        }

        // 2. Handle non-Khmer text
        if (segment.t === 'notKhmer') {
          return (
            <span key={segIdx} className="text-base text-default-700 self-center px-1">
              {segment.v}
            </span>
          )
        }

        // 3. Handle Khmer segments (Type is now narrowed to exclude whitespace/notKhmer)
        return segment.words.map((word, wordIdx) => {
          const w: TypedKhmerWord = typeof word === 'string' ? word : word.w
          const def: NonEmptyStringTrimmed | undefined = typeof word === 'string' ? undefined : word.def

          return <KhmerWordBlock key={`${segIdx}-${wordIdx}`} definition={def} word={w} />
        })
      })}
    </div>
  )
}

export const KhmerAnalyzer = React.memo(KhmerAnalyzerImpl)
