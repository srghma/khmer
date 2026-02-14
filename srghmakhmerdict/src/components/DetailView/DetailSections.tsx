import React, { useMemo } from 'react'
import { EnKmHtmlRenderer } from '../EnKmHtmlRenderer'
import { WiktionaryRenderer } from '../WiktionaryRenderer'
import {
  SectionTitle,
  RenderHtmlColorized,
  CsvListRendererColorized,
  CsvListRendererText,
  FromRussianWikiRenderer,
  GorgonievRenderer,
} from './atoms'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { DetailSectionsProps } from './DetailSectionsProps'
import { useI18nContext } from '../../i18n/i18n-react-custom'

// add a component that tests all 3
// srghmakhmerdict / src / utils / WordDetailEn_OnlyKhmerAndWithoutHtml.ts
// srghmakhmerdict / src / utils / WordDetailKm_WithoutKhmerAndHtml.ts
// srghmakhmerdict / src / utils / WordDetailRu_OnlyKhmerAndWithoutHtml.ts
// it takes DetailSectionsProps and for all 3 if there is a field in a processor that matches the field in props - process and show result. Test this way all 3

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
    gorgoniev,
    from_chuon_nath,
    from_chuon_nath_translated,
    mode,
    isKhmerLinksEnabled_ifTrue_passOnNavigate,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  }: DetailSectionsProps) => {
    const { LL } = useI18nContext()
    const isKhmerLinksEnabled_ifTrue_passOnNavigateKm = useMemo(
      () =>
        isKhmerLinksEnabled_ifTrue_passOnNavigate
          ? (w: TypedKhmerWord) => isKhmerLinksEnabled_ifTrue_passOnNavigate(w, 'km')
          : undefined,
      [isKhmerLinksEnabled_ifTrue_passOnNavigate],
    )

    return (
      <>
        {/* <ProcessorsTester
          desc={desc}
          desc_en_only={desc_en_only}
          en_km_com={en_km_com}
          from_chuon_nath={from_chuon_nath}
          from_chuon_nath_translated={from_chuon_nath_translated}
          from_csv_noun_forms={from_csv_noun_forms}
          from_csv_pronunciations={from_csv_pronunciations}
          from_csv_raw_html={from_csv_raw_html}
          from_csv_variants={from_csv_variants}
          from_russian_wiki={from_russian_wiki}
          gorgoniev={gorgoniev}
          isKhmerLinksEnabled_ifTrue_passOnNavigate={isKhmerLinksEnabled_ifTrue_passOnNavigate}
          isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
          isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
          km_map={km_map}
          maybeColorMode={maybeColorMode}
          mode={mode}
          wiktionary={wiktionary}
        /> */}
        {desc && (
          <div className="mb-1">
            <SectionTitle>{LL.DETAIL.SECTION.DEFINITION()}</SectionTitle>
            <RenderHtmlColorized
              hideBrokenImages_enable={true}
              html={desc}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
            />
          </div>
        )}

        {desc_en_only && (
          <div className="mb-6">
            <SectionTitle>{LL.DETAIL.SECTION.DEFINITION_EN()}</SectionTitle>
            <RenderHtmlColorized
              hideBrokenImages_enable={true}
              html={desc_en_only}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
            />
          </div>
        )}

        {en_km_com && (
          <div className="mb-1">
            <SectionTitle>{LL.DETAIL.SECTION.EN_KM()}</SectionTitle>
            <EnKmHtmlRenderer
              html={en_km_com}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
            />
          </div>
        )}

        {from_csv_raw_html && (
          <div className="mb-1">
            <SectionTitle>{LL.DETAIL.SECTION.ENGLISH()}</SectionTitle>
            {from_csv_variants && (
              <div className="mb-2">
                <CsvListRendererColorized
                  isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
                  isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
                  isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
                  isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
                  items={from_csv_variants}
                />
              </div>
            )}
            {from_csv_noun_forms && (
              <>
                <div className="mt-4 border-b border-divider pb-1 mb-3">
                  <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">
                    {LL.DETAIL.SECTION.NOUN_FORMS()}
                  </span>
                </div>
                <CsvListRendererColorized
                  isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
                  isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
                  isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
                  isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
                  items={from_csv_noun_forms}
                />
              </>
            )}
            {from_csv_pronunciations && (
              <>
                <div className="mt-4 border-b border-divider pb-1 mb-3">
                  <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">
                    {LL.DETAIL.SECTION.PRONUNCIATIONS()}
                  </span>
                </div>
                <CsvListRendererText
                  isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
                  isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
                  isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled ?? isKhmerPronunciationHidingEnabled}
                  items={from_csv_pronunciations}
                />
              </>
            )}
            <RenderHtmlColorized
              hideBrokenImages_enable={false}
              html={from_csv_raw_html}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
            />
          </div>
        )}

        {wiktionary && (
          <div className="mb-6">
            <SectionTitle>{LL.DETAIL.SECTION.WIKTIONARY()}</SectionTitle>
            <WiktionaryRenderer
              currentMode={mode}
              html={wiktionary}
              isKhmerLinksEnabled_ifTrue_passOnNavigate={isKhmerLinksEnabled_ifTrue_passOnNavigate}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
            />
          </div>
        )}

        {from_russian_wiki && (
          <div className="mb-6">
            <SectionTitle>{LL.DETAIL.SECTION.RU_WIKI()}</SectionTitle>
            <FromRussianWikiRenderer
              html={from_russian_wiki}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
            />
          </div>
        )}

        {gorgoniev && (
          <div className="mb-6">
            <SectionTitle>{LL.DETAIL.SECTION.GORGONIEV()}</SectionTitle>
            <GorgonievRenderer
              html={gorgoniev}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
            />
          </div>
        )}

        {from_chuon_nath && (
          <div className="mb-6">
            <SectionTitle>{LL.DETAIL.SECTION.CHUON_NATH()}</SectionTitle>
            <RenderHtmlColorized
              hideBrokenImages_enable={false}
              html={from_chuon_nath}
              isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
              isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
            />
            {from_chuon_nath_translated && (
              <div className="mt-4 pt-4 border-t border-divider">
                <RenderHtmlColorized
                  hideBrokenImages_enable={false}
                  html={from_chuon_nath_translated}
                  isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
                  isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
                  isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
                  isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
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
