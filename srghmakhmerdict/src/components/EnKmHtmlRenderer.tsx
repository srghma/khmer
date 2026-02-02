import { useRef, useMemo, useEffect, useState } from 'react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useSettings } from '../providers/SettingsProvider'
import styles from './EnKmHtmlRenderer.module.css'
import type { EnglishKhmerCom_Images_Mode } from '../types'
import { useToast } from '../providers/ToastProvider'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import {
  strOrNumberToNonNegativeIntOrThrow_strict,
  strOrNumberToNonNegativeIntOrUndefined_strict,
  type ValidNonNegativeInt,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'
import { memoizeAsync1Lru } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize-async'
import { get_en_km_com_images_ocr, type KhmerWordsMap } from '../db/dict'
import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type MaybeColorizationMode } from '../utils/text-processing/utils'
import { colorizeHtml } from '../utils/text-processing/html'
import {
  Set_toNonEmptySet_orUndefined,
  type NonEmptySet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'

// --- Constants & Regex ---
// Matches source to extract ID. Example: .../1295.png -> 1295
const IMG_ID_REGEX = /^\/en_Dict_en_km_com_assets_images\/(\d+)\.webp$/
const IMG_ID_GLOBAL_REGEX = /src="\/en_Dict_en_km_com_assets_images\/(\d+)\.webp"/g

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

  IMG_ID_GLOBAL_REGEX.lastIndex = 0
  while ((match = IMG_ID_GLOBAL_REGEX.exec(html)) !== null) {
    const id = strOrNumberToNonNegativeIntOrUndefined_strict(assertIsDefinedAndReturn(match[1]))

    if (id) ids.add(id)
  }

  return Set_toNonEmptySet_orUndefined(ids)
}

const injectOcrIntoHtml = (
  html: NonEmptyStringTrimmed,
  ocrMap: Record<ValidNonNegativeInt, NonEmptyStringTrimmed>,
  // km_map: KhmerWordsMap | undefined,
  // colorMode: ColorizationMode,
): NonEmptyStringTrimmed => {
  if (Object.keys(ocrMap).length === 0) {
    throw new Error('ocrMap doesnt have anything inside, should have been undefined')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const images = doc.querySelectorAll('img')

  images.forEach(img => {
    if (img.parentElement?.classList.contains('img_and_ocr')) return

    const src = assertIsDefinedAndReturn(img.getAttribute('src'))

    // console.log('src', src)
    const match = assertIsDefinedAndReturn(src.match(IMG_ID_REGEX))
    const match1 = assertIsDefinedAndReturn(match)

    const id = strOrNumberToNonNegativeIntOrThrow_strict(assertIsDefinedAndReturn(match1[1]))
    const ocrMapText_ = ocrMap[id]

    // 1. Create Wrapper
    const wrapper = doc.createElement('div')

    wrapper.className = 'img_and_ocr'

    // Perform DOM Swap: Insert wrapper before image, move image inside wrapper
    img.parentNode?.insertBefore(wrapper, img)
    wrapper.appendChild(img)

    if (!ocrMapText_) {
      // --- INLINE ERROR HANDLING ---
      const errorSpan = doc.createElement('span')

      errorSpan.className = 'img-ocr-error'
      errorSpan.style.color = 'red' // Or use a CSS class
      errorSpan.textContent = ` (No translation found for ID: ${id})`
      wrapper.appendChild(errorSpan)
    } else {
      const ocrMapText = nonEmptyString_afterTrim(ocrMapText_)

      // console.log('ocrMapText', ocrMapText)
      const span = doc.createElement('div')

      span.className = 'img-ocr'
      // span.innerHTML = colorizeText(ocrMapText, colorMode, km_map)

      // span.textContent = colorizeText(ocrMapText, colorMode, km_map)
      span.textContent = ocrMapText
      wrapper.appendChild(span)
    }
  })

  return nonEmptyString_afterTrim(doc.body.innerHTML)
}

// --- Hooks ---

const useOcrData = (html: NonEmptyStringTrimmed) => {
  const [ocrMap, setOcrMap] = useState<Record<ValidNonNegativeInt, NonEmptyStringTrimmed> | undefined>(undefined)
  const toast = useToast()

  useEffect(() => {
    const ids = extractImageIds(html)

    // console.log('effect called', ids, html)

    if (!ids) {
      setOcrMap(undefined)

      return
    }

    // Using the LRU cached function.
    // If IDs haven't changed (or are in LRU history), this returns the resolved promise immediately.
    // If specific IDs are already fetching, it returns the in-flight promise.
    fetchOcrCached(ids)
      .then(result => {
        // console.log('result', result)
        const newOcrMap = Object.keys(result).length === 0 ? undefined : result

        setOcrMap(newOcrMap)
      })
      .catch((err: any) => {
        // console.error('OCR Fetch Error:', err)
        toast.error('OCR Fetch Error:', err.message)
      })
  }, [html, toast, ocrMap]) // Dependency on HTML string is fine now due to internal checks

  return ocrMap
}

const useImageInteraction = (ref: React.RefObject<HTMLDivElement | null>) => {
  const toast = useToast()

  useEffect(() => {
    const container = ref.current

    if (!container) return

    const handleImageClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Only handle clicks on the Image itself
      if (target.tagName !== 'IMG') return

      const img = target as HTMLImageElement
      const src = img.getAttribute('src') || ''
      const match = src.match(IMG_ID_REGEX)

      if (match && match[1]) {
        const imageId = match[1]
        const publicImageUrl = `https://www.english-khmer.com/imgukh/${imageId}.png`
        const lensUrl = `https://lens.google.com/upload?url=${encodeURIComponent(publicImageUrl)}`

        try {
          await openUrl(lensUrl)
        } catch (err: any) {
          toast.error('Failed to open Google Lens.', err.message)
        }
      } else {
        toast.error('Image Error', 'Could not identify this image for translation.')
      }
    }

    container.addEventListener('click', handleImageClick)

    return () => container.removeEventListener('click', handleImageClick)
  }, [ref, toast])
}

// --- Main Component ---

export interface EnKmHtmlRendererProps {
  html: NonEmptyStringTrimmed
  km_map: KhmerWordsMap | undefined
  colorMode: MaybeColorizationMode
}

export const EnKmHtmlRenderer = ({ html, km_map, colorMode }: EnKmHtmlRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { imageMode } = useSettings()
  const ocrMap = useOcrData(html)

  const finalHtml = useMemo(() => {
    if (colorMode === 'none' || !km_map) return { __html: processHtmlImages(html, imageMode) }
    if (!ocrMap) return { __html: colorizeHtml(processHtmlImages(html, imageMode), colorMode, km_map) }

    const htmlWithOcr = injectOcrIntoHtml(
      html,
      ocrMap,
      // km_map,
      // colorMode
    )
    const htmlWithOcr_ = processHtmlImages(htmlWithOcr, imageMode)
    const htmlWithOcr__ = colorizeHtml(htmlWithOcr_, colorMode, km_map)

    return { __html: htmlWithOcr__ }
  }, [html, ocrMap, km_map, colorMode, imageMode])

  useImageInteraction(containerRef)

  return (
    <div
      dangerouslySetInnerHTML={finalHtml}
      ref={containerRef}
      className={`${styles.enKmScope} cursor-pointer`}
      title="Click image to translate in Google Lens"
    />
  )
}
