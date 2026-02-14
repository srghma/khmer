import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useSettings } from '../providers/SettingsProvider'
import styles from './EnKmHtmlRenderer.module.css'
import type { EnglishKhmerCom_Images_Mode } from '../types'
import { useAppToast } from '../providers/ToastProvider'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import {
  strOrNumberToNonNegativeIntOrThrow_strict,
  strOrNumberToNonNegativeIntOrUndefined_strict,
  type ValidNonNegativeInt,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'
import { memoizeAsync1Lru } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import { get_en_km_com_images_ocr } from '../db/dict'
import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { colorizeHtml } from '../utils/text-processing/html'
import {
  Set_toNonEmptySet_orUndefined,
  type NonEmptySet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { useKhmerAndNonKhmerClickListener, calculateKhmerAndNonKhmerContentStyles } from '../hooks/useKhmerLinks'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import { isContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { useDictionary } from '../providers/DictionaryProvider'

// --- Constants & Regex ---
// Matches source to extract ID. Example: .../1295.png -> 1295
const IMG_ID_ATTRIBUTE_OFFLINE_REGEX = /^\/en_Dict_en_km_com_assets_images\/(\d+)\.webp$/
const IMG_ID_ATTRIBUTE_ONLINE_REGEX = /^http:\/\/imglocal\.localhost\/(\d+)\.webp$/ // should parse e.g.g http://imglocal.localhost/1497.webp
const IMG_ID_IN_HTML_GLOBAL_REGEX = /src="\/en_Dict_en_km_com_assets_images\/(\d+)\.webp"/g

export const fetchOcrCached = memoizeAsync1Lru(
  get_en_km_com_images_ocr,
  3, // LRU Size
  ids => JSON.stringify(Array.from(ids).sort()), // Cache Key: Sorted JSON string of IDs
)

// --- Utilities ---

export const processHtmlImages = (
  html: NonEmptyStringTrimmed,
  mode: EnglishKhmerCom_Images_Mode,
): NonEmptyStringTrimmed => {
  if (mode === 'offline') {
    return html.replace(
      /src=["'].*?en_Dict_en_km_com_assets_images\/([^"']+)["']/g,
      `src="http://imglocal.localhost/$1"`,
    ) as NonEmptyStringTrimmed
  }

  return html.replace(
    /src=["'].*?en_Dict_en_km_com_assets_images\/(\d+)\.webp["']/g,
    'src="https://www.english-khmer.com/imgukh/$1.png"',
  ) as NonEmptyStringTrimmed
}

const extractImageIds = (html: NonEmptyStringTrimmed): NonEmptySet<ValidNonNegativeInt> | undefined => {
  const ids = new Set<ValidNonNegativeInt>()
  let match

  IMG_ID_IN_HTML_GLOBAL_REGEX.lastIndex = 0
  while ((match = IMG_ID_IN_HTML_GLOBAL_REGEX.exec(html)) !== null) {
    const id = strOrNumberToNonNegativeIntOrUndefined_strict(assertIsDefinedAndReturn(match[1]))

    if (id) ids.add(id)
  }

  return Set_toNonEmptySet_orUndefined(ids)
}

const wrapImagesAndInjectOcr = (
  html: NonEmptyStringTrimmed,
  ocrMap: Record<ValidNonNegativeInt, NonEmptyStringTrimmed> | undefined,
): NonEmptyStringTrimmed => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const images = doc.querySelectorAll('img')

  images.forEach(img => {
    if (img.parentElement?.classList.contains('img_and_ocr')) return

    const src = img.getAttribute('src') || ''
    const match = src.match(IMG_ID_ATTRIBUTE_OFFLINE_REGEX)

    if (!match) return

    const id = strOrNumberToNonNegativeIntOrThrow_strict(assertIsDefinedAndReturn(match[1]))

    // 1. Create Wrapper
    const wrapper = doc.createElement('div')

    wrapper.className = 'img_and_ocr'

    // Perform DOM Swap: Insert wrapper before image, move image inside wrapper
    img.classList.add('khmer--image')
    img.parentNode?.insertBefore(wrapper, img)
    wrapper.appendChild(img)

    const ocrMapText_ = ocrMap?.[id]

    if (ocrMap) {
      if (!ocrMapText_) {
        // --- INLINE ERROR HANDLING ---
        const errorSpan = doc.createElement('span')

        errorSpan.className = 'img-ocr-error'
        errorSpan.style.color = 'red'
        errorSpan.textContent = ` (No translation found for ID: ${id})`
        wrapper.appendChild(errorSpan)
      } else {
        const ocrMapText = nonEmptyString_afterTrim(ocrMapText_)
        const span = doc.createElement('div')

        span.className = 'img-ocr'
        span.textContent = ocrMapText
        wrapper.appendChild(span)
      }
    }
  })

  return nonEmptyString_afterTrim(doc.body.innerHTML)
}

// --- Hooks ---

const useOcrData = (html: NonEmptyStringTrimmed) => {
  const [ocrMap, setOcrMap] = useState<Record<ValidNonNegativeInt, NonEmptyStringTrimmed> | undefined>(undefined)
  const toast = useAppToast()
  const ids = useMemo(() => extractImageIds(html), [html])

  useEffect(() => {
    if (!ids) return

    // Using the LRU cached function.
    // If IDs haven't changed (or are in LRU history), this returns the resolved promise immediately.
    // If specific IDs are already fetching, it returns the in-flight promise.
    fetchOcrCached(ids)
      .then(result => {
        // console.log('result', result)
        const newOcrMap = Object.keys(result).length === 0 ? undefined : result

        setOcrMap(newOcrMap)
      })
      .catch((e: unknown) => {
        // console.error('OCR Fetch Error:', err)
        toast.error('OCR Fetch Error:' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
      })
  }, [ids, toast]) // Dependency on HTML string is fine now due to internal checks

  return ocrMap
}

const useImageClickHandler = (toast: ReturnType<typeof useAppToast>) => {
  return useCallback(
    async (e: MouseEvent) => {
      const target = e.target as HTMLElement

      if (target.tagName !== 'IMG') return

      const img = target as HTMLImageElement
      const src = img.getAttribute('src') || ''
      const match_offline = src.match(IMG_ID_ATTRIBUTE_OFFLINE_REGEX)
      const match_online = src.match(IMG_ID_ATTRIBUTE_ONLINE_REGEX)

      if (match_offline && match_offline[1]) {
        const imageId = match_offline[1]
        const publicImageUrl = `https://www.english-khmer.com/imgukh/${imageId}.png`
        const lensUrl = `https://lens.google.com/upload?url=${encodeURIComponent(publicImageUrl)}`

        try {
          await openUrl(lensUrl)
        } catch (e: unknown) {
          toast.error('Failed to open Google Lens.' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        }
      } else if (match_online && match_online[1]) {
        const imageId = match_online[1]
        const publicImageUrl = `https://www.english-khmer.com/imgukh/${imageId}.png`
        const lensUrl = `https://lens.google.com/upload?url=${encodeURIComponent(publicImageUrl)}`

        try {
          await openUrl(lensUrl)
        } catch (e: unknown) {
          toast.error('Failed to open Google Lens.' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        }
      } else {
        toast.error(
          'Image Error' as NonEmptyStringTrimmed,
          'Could not identify this image for translation.' as NonEmptyStringTrimmed,
        )
      }
    },
    [toast],
  )
}

// --- Main Component ---

export interface EnKmHtmlRendererProps {
  html: NonEmptyStringTrimmed
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
  isKhmerPronunciationHidingEnabled: boolean
}

export const EnKmHtmlRenderer = ({
  html,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
  isKhmerWordsHidingEnabled,
  isNonKhmerWordsHidingEnabled,
  isKhmerPronunciationHidingEnabled,
}: EnKmHtmlRendererProps) => {
  const { imageMode, maybeColorMode } = useSettings()
  const { km_map } = useDictionary()
  const containerRef = useRef<HTMLDivElement>(null)
  const ocrMap = useOcrData(html)

  const finalHtml = useMemo(() => {
    // Logic: wrap images (and inject OCR if present) -> Change URLs -> Colorize
    const html_withWrappedImages = wrapImagesAndInjectOcr(html, ocrMap)

    const html_withChangedUrls = processHtmlImages(html_withWrappedImages, imageMode)

    const html_colorized =
      maybeColorMode !== 'none' && isContainsKhmer(html_withChangedUrls)
        ? colorizeHtml(html_withChangedUrls, maybeColorMode, km_map)
        : html_withChangedUrls

    return { __html: html_colorized }
  }, [html, ocrMap, km_map, maybeColorMode, imageMode])

  const toast = useAppToast()

  const imageClickHandler = useImageClickHandler(toast)

  useKhmerAndNonKhmerClickListener(
    containerRef,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
    imageClickHandler,
  )

  const srghma_khmer_dict_content_styles = calculateKhmerAndNonKhmerContentStyles(
    !!isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  )

  return (
    <div
      dangerouslySetInnerHTML={finalHtml}
      ref={containerRef}
      className={`${styles.enKmScope} ${srghma_khmer_dict_content_styles}`}
      title="Click image to translate in Google Lens"
    />
  )
}
