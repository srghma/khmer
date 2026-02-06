import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import React from 'react'
import type { KhmerWordsMap } from '../../db/dict'
import type { DictionaryLanguage } from '../../types'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { EnKmHtmlRenderer } from '../EnKmHtmlRenderer'
import { WiktionaryRenderer } from '../WiktionaryRenderer'
import { SectionTitle, RenderHtmlColorized, CsvListRendererColorized, CsvListRendererText, RenderHtml } from './atoms'

interface DetailSectionsProps {
  desc?: NonEmptyStringTrimmed
  desc_en_only?: NonEmptyStringTrimmed
  en_km_com?: NonEmptyStringTrimmed
  from_csv_raw_html?: NonEmptyStringTrimmed
  from_csv_variants?: NonEmptyArray<NonEmptyStringTrimmed>
  from_csv_noun_forms?: NonEmptyArray<NonEmptyStringTrimmed>
  from_csv_pronunciations?: NonEmptyArray<NonEmptyStringTrimmed>
  wiktionary?: NonEmptyStringTrimmed
  from_russian_wiki?: NonEmptyStringTrimmed
  from_chuon_nath?: NonEmptyStringTrimmed
  from_chuon_nath_translated?: NonEmptyStringTrimmed
  maybeColorMode: MaybeColorizationMode
  km_map: KhmerWordsMap | undefined
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
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
    onNavigate,
  }: DetailSectionsProps) => {
    return (
      <>
        {desc && (
          <div className="mb-1">
            <SectionTitle>Definition</SectionTitle>
            <RenderHtmlColorized html={desc} km_map={km_map} maybeColorMode={maybeColorMode} />
          </div>
        )}

        {desc_en_only && (
          <div className="mb-6">
            <SectionTitle>English Definition</SectionTitle>
            <RenderHtmlColorized html={desc_en_only} km_map={km_map} maybeColorMode={maybeColorMode} />
          </div>
        )}

        {en_km_com && (
          <div className="mb-1">
            <SectionTitle>English-Khmer</SectionTitle>
            <EnKmHtmlRenderer html={en_km_com} km_map={km_map} maybeColorMode={maybeColorMode} />
          </div>
        )}

        {from_csv_raw_html && (
          <div className="mb-1">
            <SectionTitle>English</SectionTitle>
            {from_csv_variants && (
              <div className="mb-2">
                <CsvListRendererColorized items={from_csv_variants} km_map={km_map} maybeColorMode={maybeColorMode} />
              </div>
            )}
            {from_csv_noun_forms && (
              <>
                <div className="mt-4 border-b border-divider pb-1 mb-3">
                  <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">Noun forms</span>
                </div>
                <CsvListRendererColorized items={from_csv_noun_forms} km_map={km_map} maybeColorMode={maybeColorMode} />
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
            <RenderHtml html={from_csv_raw_html} />
          </div>
        )}

        {wiktionary && (
          <div className="mb-6">
            <SectionTitle>Wiktionary</SectionTitle>
            <WiktionaryRenderer
              currentMode={mode}
              html={wiktionary}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
              onNavigate={onNavigate}
            />
          </div>
        )}

        {from_russian_wiki && (
          <div className="mb-6">
            <SectionTitle>Russian Wiki</SectionTitle>
            <RenderHtmlColorized html={from_russian_wiki} km_map={km_map} maybeColorMode={maybeColorMode} />
          </div>
        )}

        {from_chuon_nath && (
          <div className="mb-6">
            <SectionTitle>Chuon Nath</SectionTitle>
            <RenderHtmlColorized html={from_chuon_nath} km_map={km_map} maybeColorMode={maybeColorMode} />
            {from_chuon_nath_translated && (
              <div className="mt-4 pt-4 border-t border-divider">
                <RenderHtmlColorized
                  html={from_chuon_nath_translated}
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
