import {
  enrichWithSeries,
  type EnrichedToken,
} from '../node_modules/gemini-ocr-automate-images-upload-chrome-extension/src/utils/khmer_parse_tokenize_with_series.js'
import { tokenize } from '../node_modules/gemini-ocr-automate-images-upload-chrome-extension/src/utils/khmer_parse_tokenize.js'
import {
  CONSONANTS,
  DIACRITICS,
  EXTRA_CONSONANTS,
  INDEPENDENT_VOWELS,
  VOWEL_COMBINATIONS,
  VOWELS,
} from '../node_modules/gemini-ocr-automate-images-upload-chrome-extension/src/utils/khmer-consonants-vovels.js'
import { assertNever } from '../node_modules/gemini-ocr-automate-images-upload-chrome-extension/src/utils/asserts.js'
import { Char_mkArray } from '../node_modules/gemini-ocr-automate-images-upload-chrome-extension/src/utils/char.js'

/**
 * Speaks the given text using the Web Speech API
 */
const speakText = async (text: string, api: AnkiDroidJS | undefined): Promise<void> => {
  const lang = 'km-KH'
  const rate = 0.8

  // 1️⃣ Try AnkiDroid TTS
  if (api && typeof api.ankiTtsSpeak === 'function') {
    try {
      await api.ankiTtsSetLanguage(lang)
      await api.ankiTtsSetSpeechRate(rate)
      await api.ankiTtsSpeak(text, 0) // 0 is QUEUE_FLUSH (queue dropped), 1 is QUEUE_ADD (waited)
      return // successful → stop here
    } catch (err) {
      console.warn('AnkiDroid TTS failed, falling back:', err)
    }
  }

  // 2️⃣ Fallback: Web Speech API
  if (!('speechSynthesis' in window)) {
    console.warn('No available TTS (AnkiDroid + WebSpeech both unavailable)')
    return
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}

const addTTSHandlers_whole = (elementId: string, api: AnkiDroidJS | undefined): void => {
  const element = document.getElementById(elementId)
  if (!element) return

  // Add TTS to main word/sentence element
  element.style.cursor = 'pointer'
  element.addEventListener('click', e => {
    e.preventDefault()
    const text = element.innerText.trim()
    if (text) speakText(text, api)
  })
}

/**
 * Adds click handlers to enable TTS on elements
 */
const addTTSHandlers = (elementId: string, elementToClick: string, api: AnkiDroidJS | undefined): void => {
  const element = document.getElementById(elementId)
  if (!element) return

  // Add TTS to individual token boxes (letters/components)
  const tokenBoxes = element.querySelectorAll(elementToClick)
  tokenBoxes.forEach(box => {
    ;(box as HTMLElement).style.cursor = 'pointer'
    box.addEventListener('click', e => {
      e.stopPropagation()
      const text = box.textContent?.trim()
      if (text) speakText(text, api)
    })
  })
}

// ==========================================
// 5. RENDERERS
// ==========================================

const truncate = (str: string, n: number): string => {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export const renderTransliteration = (enrichedTokens: readonly EnrichedToken[]): string => {
  return enrichedTokens
    .map(token => {
      const text = token.v.join('')

      switch (token.t) {
        case 'CONSONANT': {
          const def = CONSONANTS.find(c => c.letter === token.v[0])
          if (!def) throw new Error('not in CONSONANTS')

          const className = def.series === 'a' ? 'cons-a' : 'cons-o'
          return `
      <div class="token-box">
        <div class="token-char ${className}">${text}</div>
        <div class="token-trans">${def.trans}</div>
        <div class="token-ipa">/${def.ipa}/</div>
      </div>`
        }

        case 'EXTRA_CONSONANT': {
          const def = EXTRA_CONSONANTS.find(
            ec => ec.letters.length === token.v.length && ec.letters.every((l, i) => l === token.v[i]),
          )
          if (!def) throw new Error('not in EXTRA_CONSONANTS')

          return `
      <div class="token-box">
        <div class="token-char cons-extra"><i>${text}</i></div>
        <div class="token-trans">${def.trans}</div>
        <div class="token-ipa">/${def.ipa}/</div>
      </div>`
        }

        case 'VOWEL': {
          const def = VOWELS.find(v => v.letter === token.v[0])
          if (!def) throw new Error('not in VOWELS')

          const isASeries = token.series === 'a'
          const aClass = isASeries ? 'trans-active' : 'trans-inactive'
          const oClass = isASeries ? 'trans-inactive' : 'trans-active'

          return `
      <div class="token-box">
        <div class="token-char vowel">${text}</div>
        <div class="token-trans">
          <span class="trans-option ${aClass}">${def.trans_a}</span><span class="trans-separator">/</span><span class="trans-option ${oClass}">${def.trans_o}</span>
        </div>
        <div class="token-ipa">
          <span class="trans-option ${aClass}">/${def.ipa_a}/</span><span class="trans-separator"> </span><span class="trans-option ${oClass}">/${def.ipa_o}/</span>
        </div>
      </div>`
        }

        case 'VOWEL_COMBINATION': {
          const def = VOWEL_COMBINATIONS.find(
            vc => vc.letters.length === token.v.length && vc.letters.every((l, i) => l === token.v[i]),
          )
          if (!def) throw new Error('not in VOWEL_COMBINATIONS')

          const isASeries = token.series === 'a'
          const aClass = isASeries ? 'trans-active' : 'trans-inactive'
          const oClass = isASeries ? 'trans-inactive' : 'trans-active'

          return `
      <div class="token-box">
        <div class="token-char vowel">${text}</div>
        <div class="token-trans">
          <span class="trans-option ${aClass}">${def.trans_a}</span><span class="trans-separator">/</span><span class="trans-option ${oClass}">${def.trans_o}</span>
        </div>
        <div class="token-ipa">
          <span class="trans-option ${aClass}">/${def.ipa_a}/</span><span class="trans-separator"> </span><span class="trans-option ${oClass}">/${def.ipa_o}/</span>
        </div>
      </div>`
        }

        case 'INDEPENDENT_VOWEL': {
          const def = INDEPENDENT_VOWELS.find(
            iv => iv.letters.length === token.v.length && iv.letters.every((l, i) => l === token.v[i]),
          )
          if (!def) throw new Error('not in INDEPENDENT_VOWELS')

          return `
      <div class="token-box">
        <div class="token-char independent-vowel">${text}</div>
        <div class="token-trans">${def.trans}</div>
        <div class="token-ipa">/${def.ipa}/</div>
      </div>`
        }

        case 'DIACRITIC': {
          const def = DIACRITICS.find(d => d.symbol === token.v[0])
          if (!def) throw new Error('not in DIACRITICS')

          // Truncate logic: First 12 chars, ellipsis if longer
          const shortDesc = truncate(def.desc_en, 12)

          return `
      <div class="token-box diacritic-box">
        <div class="token-char diacritic">◌${text}</div>
        <div class="token-trans" style="font-size: 0.7em;">${shortDesc}</div>
        <div class="token-ipa"> </div> <!-- Empty row for alignment, or put '-' -->

        <!-- The custom tooltip element -->
        <div class="custom-tooltip">${def.desc_en}</div>
      </div>`
        }

        case 'SPACE':
          return `</br>`

        case 'UNKNOWN':
          return `
      <div class="token-box">
        <div class="token-char unknown">${text}</div>
        <div class="token-trans">—</div>
        <div class="token-ipa"></div>
      </div>`
        default:
          assertNever(token.t)
      }
    })
    .join('')
}

// ==========================================
// 6. MAIN EXECUTION FOR ANKI
// ==========================================

function initAnkiDroidApi(): AnkiDroidJS | undefined {
  if (typeof AnkiDroidJS !== 'undefined') {
    try {
      const jsApiContract = {
        version: '0.0.3',
        developer: 'srghma@gmail.com', // <-- REQUIRED
      }
      return new AnkiDroidJS(jsApiContract)
    } catch (err) {
      console.warn('Failed to initialize AnkiDroid API:', err)
    }
  } else {
    console.log('AnkiDroidJS not present — using browser fallback.')
  }
}

const renderSingleKhmerText = (
  textElementId: string,
  graphemesElementId: string,
  transliterationElementId: string,
  api: AnkiDroidJS | undefined,
): void => {
  const textEl = document.getElementById(textElementId)
  if (!textEl) return

  const text = textEl.innerText.trim()
  if (!text) return

  const chars = Char_mkArray(text)

  // 1. Render grapheme clusters
  ;(() => {
    const graphemesEl = document.getElementById(graphemesElementId)
    if (!graphemesEl) return

    try {
      const segmenter = new Intl.Segmenter('km', { granularity: 'grapheme' })
      const graphemes = [...segmenter.segment(text)]
        .map(x => (x.segment === ' ' ? '-' : `<span class="one-grapheme-with-audio">${x.segment}</span>`))
        .join(' ')
      graphemesEl.innerHTML = graphemes
    } catch (e) {
      graphemesEl.innerText = '(Grapheme segmentation not supported)'
    }
  })()

  // 2. Tokenize and enrich
  const tokens = tokenize(chars)
  const enrichedTokens = enrichWithSeries(tokens)

  // 3. Render transliteration
  ;(() => {
    const transEl = document.getElementById(transliterationElementId)
    if (!transEl) return
    transEl.innerHTML = renderTransliteration(enrichedTokens)
  })()

  // 4. Add TTS handlers after rendering
  addTTSHandlers_whole(textElementId, api)
  addTTSHandlers(graphemesElementId, '.one-grapheme-with-audio', api)
  addTTSHandlers(transliterationElementId, '.token-char', api)

  // 5. Add Tooltip handlers for mobile support
  addTooltipHandlers(transliterationElementId)
}

const handleHiddenButAppearsOnClick = (): void => {
  const className = 'hidden-but-appears-on-click'
  const elements = document.querySelectorAll(`.${className}`)
  if (!elements.length) return
  elements.forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      el.classList.remove(className)
    })
  })
}

const addTooltipHandlers = (elementId: string): void => {
  const element = document.getElementById(elementId)
  if (!element) return

  // Select all boxes we marked as diacritics
  const diacriticBoxes = element.querySelectorAll('.diacritic-box')

  diacriticBoxes.forEach(box => {
    box.addEventListener('click', e => {
      // 1. Stop the click from bubbling (so it doesn't trigger word TTS if nested)
      e.stopPropagation()

      // 2. Close all other open tooltips first (optional, cleaner UX)
      diacriticBoxes.forEach(b => {
        if (b !== box) b.classList.remove('tooltip-active')
      })

      // 3. Toggle this one
      box.classList.toggle('tooltip-active')
    })
  })

  // 4. Close tooltips if clicking anywhere else on the screen
  document.addEventListener('click', () => {
    diacriticBoxes.forEach(b => b.classList.remove('tooltip-active'))
  })
}

export const renderKhmerAnalysis = (): void => {
  if (typeof document === 'undefined') return

  const api = initAnkiDroidApi()

  // Render main word
  renderSingleKhmerText('word', 'word-graphemes', 'word-split-ru', api)

  // Render example sentence (if present)
  renderSingleKhmerText('example-sent', 'example-sent-graphemes', 'example-sent-split-ru', api)

  handleHiddenButAppearsOnClick()
}

// ==========================================
// EXAMPLE USAGE (for testing)
// ==========================================

// Test with word: កម្ពុជា (Cambodia)
// const testText = "កម្ពុជា";
// const testChars = Array.from(testText);
// const testTokens = tokenize(testChars);
// const testEnriched = enrichWithSeries(testTokens);
// console.log('Tokens:', testTokens);
// console.log('Enriched:', testEnriched);
// console.log('HTML Split:', renderCharacterSplit(testEnriched));
// console.log('HTML Trans:', renderTransliteration(testEnriched));

// For Anki: Execute when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderKhmerAnalysis)
  } else {
    renderKhmerAnalysis()
  }
}
