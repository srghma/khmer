import clsx from 'clsx'
import { memo } from 'react'
import {
  ColorizationAction,
  KhmerFontAction,
  KhmerLinksAction,
  KhmerWordsHidingAction,
  NonKhmerWordsHidingAction,
  ShortDetailAboutKhmerWordAction,
} from '../DetailView/DetailViewHeaderActions'
import { useSettings } from '../../providers/SettingsProvider'
import { Switch } from '@heroui/switch'
import { useI18nContext } from '../../i18n/i18n-react-custom'

export const AnalyzerHeaderToolbar = memo(function AnalyzerHeaderToolbar() {
  const { LL } = useI18nContext()

  const {
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isShowShortDetailAboutKhmerWordEnabled,
    khmerAnalyzerMarkdownEnabled,
    khmerAnalyzerSegmentationEnabled,
    khmerAnalyzerCharacterAnalysisEnabled,
    setKhmerAnalyzerMarkdownEnabled,
    setKhmerAnalyzerSegmentationEnabled,
    setKhmerAnalyzerCharacterAnalysisEnabled,
    setKhmerWordsHidingMode,
    setNonKhmerWordsHidingMode,
    toggleShowShortDetailAboutKhmerWord,
    maybeColorMode,
    setMaybeColorMode,
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    khmerFontName,
    setKhmerFontName,
  } = useSettings()

  return (
    <>
      {/* Group 2: Display Filters */}
      <KhmerWordsHidingAction mode={khmerWordsHidingMode} onChange={setKhmerWordsHidingMode} />
      <NonKhmerWordsHidingAction mode={nonKhmerWordsHidingMode} onChange={setNonKhmerWordsHidingMode} />
      <ShortDetailAboutKhmerWordAction
        isEnabled={isShowShortDetailAboutKhmerWordEnabled}
        onToggle={toggleShowShortDetailAboutKhmerWord}
      />
      <ColorizationAction colorMode={maybeColorMode} onChange={setMaybeColorMode} />
      <KhmerLinksAction
        isDisabled={maybeColorMode === 'none'}
        isEnabled={isKhmerLinksEnabled}
        onToggle={toggleKhmerLinks}
      />
      <KhmerFontAction khmerFontName={khmerFontName} onChange={setKhmerFontName} />

      {/* Group 3: View Toggles */}
      <ToolbarToggle
        isSelected={khmerAnalyzerMarkdownEnabled}
        label={LL.ANALYZER.MARKDOWN_LABEL()}
        onChange={setKhmerAnalyzerMarkdownEnabled}
      />
      <ToolbarToggle
        withDivider
        isSelected={khmerAnalyzerSegmentationEnabled}
        label={LL.ANALYZER.SEGMENTATION_LABEL()}
        onChange={setKhmerAnalyzerSegmentationEnabled}
      />
      <ToolbarToggle
        withDivider
        isSelected={khmerAnalyzerCharacterAnalysisEnabled}
        label={LL.ANALYZER.CHARACTER_ANALYSIS_LABEL()}
        onChange={setKhmerAnalyzerCharacterAnalysisEnabled}
      />
    </>
  )
})

const ToolbarToggle = ({
  label,
  isSelected,
  onChange,
  withDivider,
}: {
  label: string
  isSelected: boolean
  onChange: (v: boolean) => void
  withDivider?: boolean
}) => (
  <div className={clsx('flex flex-col items-center gap-2', withDivider && 'border-l border-divider/50 pl-4')}>
    <Switch isSelected={isSelected} size="sm" onValueChange={onChange} />
    <span className="text-[10px] font-bold uppercase tracking-wider text-default-500 whitespace-nowrap">{label}</span>
  </div>
)
