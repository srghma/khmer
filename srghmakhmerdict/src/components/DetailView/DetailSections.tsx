import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import React, { useMemo } from 'react'
import type { KhmerWordsMap } from '../../db/dict'
import type { DictionaryLanguage } from '../../types'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { EnKmHtmlRenderer } from '../EnKmHtmlRenderer'
import { WiktionaryRenderer } from '../WiktionaryRenderer'
import { SectionTitle, RenderHtmlColorized, CsvListRendererColorized, CsvListRendererText } from './atoms'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'

interface DetailSectionsProps {
  desc: NonEmptyStringTrimmed | undefined //can have km
  desc_en_only: NonEmptyStringTrimmed | undefined // cannot have km
  en_km_com: NonEmptyStringTrimmed | undefined //can have km
  from_csv_raw_html: NonEmptyStringTrimmed | undefined //can have km
  from_csv_variants: NonEmptyArray<NonEmptyStringTrimmed> | undefined //can have km
  from_csv_noun_forms: NonEmptyArray<NonEmptyStringTrimmed> | undefined //can have km
  from_csv_pronunciations: NonEmptyArray<NonEmptyStringTrimmed> | undefined // cannot have km
  wiktionary: NonEmptyStringTrimmed | undefined //can have km
  from_russian_wiki: NonEmptyStringTrimmed | undefined //can have km
  from_chuon_nath: NonEmptyStringTrimmed | undefined //can have km
  from_chuon_nath_translated: NonEmptyStringTrimmed | undefined // cannot have km
  maybeColorMode: MaybeColorizationMode
  km_map: KhmerWordsMap
  mode: DictionaryLanguage
  isKhmerLinksEnabled_ifTrue_passOnNavigate:
    | ((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void)
    | undefined
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
}

export const DetailSections = React.memo(
  ({
    desc,
    desc_en_only,
    en_km_com,
    from_csv_raw_html,
    from_csv_variants,
    from_csv_noun_forms,
    from_csv_pronunciations,
    wiktionary,
    from_russian_wiki,
    from_chuon_nath,
    from_chuon_nath_translated,
    maybeColorMode,
    km_map,
    mode,
    isKhmerLinksEnabled_ifTrue_passOnNavigate,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
  }: DetailSectionsProps) => {
    const isKhmerLinksEnabled_ifTrue_passOnNavigateKm = useMemo(
      () =>
        isKhmerLinksEnabled_ifTrue_passOnNavigate
          ? (w: TypedKhmerWord) => isKhmerLinksEnabled_ifTrue_passOnNavigate(w, 'km')
          : undefined,
      [isKhmerLinksEnabled_ifTrue_passOnNavigate],
    )

    return (
      <>
        {desc && (
          <div className="mb-1">
            <SectionTitle>Definition</SectionTitle>
            <RenderHtmlColorized
              hideBrokenImages_enable={true}
              html={desc}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
            />
          </div>
        )}

        {desc_en_only && (
          <div className="mb-6">
            <SectionTitle>English Definition</SectionTitle>
            <RenderHtmlColorized
              hideBrokenImages_enable={true}
              html={desc_en_only}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
            />
          </div>
        )}

        {en_km_com && (
          <div className="mb-1">
            <SectionTitle>English-Khmer</SectionTitle>
            <EnKmHtmlRenderer
              html={en_km_com}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
            />
          </div>
        )}

        {from_csv_raw_html && (
          <div className="mb-1">
            <SectionTitle>English</SectionTitle>
            {from_csv_variants && (
              <div className="mb-2">
                <CsvListRendererColorized
                  isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
                  isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
                  isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
                  items={from_csv_variants}
                  km_map={km_map}
                  maybeColorMode={maybeColorMode}
                />
              </div>
            )}
            {from_csv_noun_forms && (
              <>
                <div className="mt-4 border-b border-divider pb-1 mb-3">
                  <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">Noun forms</span>
                </div>
                <CsvListRendererColorized
                  isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
                  isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
                  isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
                  items={from_csv_noun_forms}
                  km_map={km_map}
                  maybeColorMode={maybeColorMode}
                />
              </>
            )}
            {from_csv_pronunciations && (
              <>
                <div className="mt-4 border-b border-divider pb-1 mb-3">
                  <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">
                    Pronunciations
                  </span>
                </div>
                <CsvListRendererText items={from_csv_pronunciations} />
              </>
            )}
            <RenderHtmlColorized
              hideBrokenImages_enable={false}
              html={from_csv_raw_html}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
            />
          </div>
        )}

        {wiktionary && (
          <div className="mb-6">
            <SectionTitle>Wiktionary</SectionTitle>
            <WiktionaryRenderer
              currentMode={mode}
              html={wiktionary}
              isKhmerLinksEnabled_ifTrue_passOnNavigate={isKhmerLinksEnabled_ifTrue_passOnNavigate}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
            />
          </div>
        )}

        {from_russian_wiki && (
          <div className="mb-6">
            <SectionTitle>Russian Wiki</SectionTitle>
            <RenderHtmlColorized
              hideBrokenImages_enable={false}
              html={from_russian_wiki}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
            />
          </div>
        )}

        {from_chuon_nath && (
          <div className="mb-6">
            <SectionTitle>Chuon Nath</SectionTitle>
            <RenderHtmlColorized
              hideBrokenImages_enable={false}
              html={from_chuon_nath}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
            />
            {from_chuon_nath_translated && (
              <div className="mt-4 pt-4 border-t border-divider">
                <RenderHtmlColorized
                  hideBrokenImages_enable={false}
                  html={from_chuon_nath_translated}
                  isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
                  isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
                  isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
                  km_map={km_map}
                  maybeColorMode={maybeColorMode}
                />
              </div>
            )}
          </div>
        )}
      </>
    )
  },
)

DetailSections.displayName = 'DetailSections'
