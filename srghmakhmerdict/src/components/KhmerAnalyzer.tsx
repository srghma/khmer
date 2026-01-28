import React, { useMemo } from 'react'
import { Tooltip } from '@heroui/tooltip'
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

import { executeNativeTts } from '../utils/tts'

// --- Types ---

interface KhmerAnalyzerProps {
  text: string
  className?: string
}

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
const TokenRenderer = ({ token }: { token: Token }) => {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent parent sentence TTS
    const text =
      token.type === 'SPACE' ||
      token.type === 'UNKNOWN' ||
      token.type === 'extra_consonant' ||
      token.type === 'vowel_combination'
        ? token.v.join('')
        : token.v

    executeNativeTts(text, 'km-KH')
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
        <div className="text-lg font-khmer mb-1">{text}</div>
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
          <div
            className={clsx('text-xl font-khmer leading-none mb-1', isSeriesA ? 'text-danger-600' : 'text-primary-600')}
          >
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
        <Tooltip
          content={
            <div className="px-1 py-2 max-w-[200px]">
              <div className="font-bold text-small mb-1">{def.name}</div>
              <div className="text-xs text-default-400">{def.desc_en}</div>
            </div>
          }
        >
          <div className={clsx(boxClass, 'border-dashed border-default-400 bg-default-50')}>
            <div className="text-xl font-khmer leading-none mb-1 text-default-500">◌{text}</div>
            <div className="text-[9px] max-w-[200px] leading-tight text-center text-default-500 line-clamp-2 w-full px-0.5">
              {def.desc_en}
            </div>
          </div>
        </Tooltip>
      )
    }

    default:
      assertNever(token)
  }
}

// --- Sub-Component: Khmer Segment Block ---

const KhmerSegmentBlock = ({ text }: { text: string }) => {
  const enrichedTokens = useMemo(() => {
    const chars = CharArray_mkFromString(text)
    const tokens = tokenize(chars)

    return enrichWithSeries(tokens)
  }, [text])

  return (
    <div className="flex flex-wrap gap-1.5 items-stretch">
      {enrichedTokens.map((token, idx) => (
        <TokenRenderer key={idx} token={token} />
      ))}
    </div>
  )
}

// --- Main Component ---

const KhmerAnalyzerImpl: React.FC<KhmerAnalyzerProps> = ({ text, className }) => {
  // Split text into [Non-Khmer, Khmer, Non-Khmer, Khmer...]
  // Using Regex capturing group to keep the delimiters (the Khmer parts)
  const segments = useMemo(() => {
    if (!text) return []

    return text.split(/(\p{Script=Khmer}+)/u)
  }, [text])

  return (
    <div className={clsx('w-full', className)}>
      <div className="leading-8 text-foreground">
        {segments.map((segment, index) => {
          if (!segment) return null

          // Check if this segment is Khmer
          if (/\p{Script=Khmer}/u.test(segment)) {
            return <KhmerSegmentBlock key={index} text={segment} />
          }

          // Render Non-Khmer text normally
          return (
            <span key={index} className="text-base text-default-700 px-1">
              {segment}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export const KhmerAnalyzer = React.memo(KhmerAnalyzerImpl)
