import { useCallback, useMemo, memo } from 'react'
import { MdTextFields, MdCenterFocusStrong, MdCenterFocusWeak } from 'react-icons/md'
import { IoColorPalette } from 'react-icons/io5'
import { TbLink, TbLinkOff } from 'react-icons/tb'
import { GoStarFill, GoStar } from 'react-icons/go'
import { Button } from '@heroui/button'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import type { SharedSelection } from '@heroui/system'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'
import { herouiSharedSelection_getFirst_string } from '../../utils/herouiSharedSelection_getFirst_string'
import { map_DictionaryLanguage_to_BCP47LanguageTagName } from '../../utils/my-bcp-47'
import {
  type KhmerFontName,
  stringToKhmerFontNameOrThrow,
  KHMER_FONT_NAME,
  KHMER_FONT_FAMILY,
  type MaybeColorizationMode,
  stringToMaybeColorizationModeOrThrow,
} from '../../utils/text-processing/utils'
import { GoogleSpeechAction } from './Tooltips/GoogleSpeechAction'
import { NativeSpeechAction } from './Tooltips/NativeSpeechAction'
import { KhmerHideToggleIcon } from '../Icons/KhmerHideToggleIcon'
import { NonKhmerHideToggleIcon } from '../Icons/NonKhmerHideToggleIcon'
import { AutoReadAction } from './DetailViewHeaderActions/AutoReadAction'
import { TooltipMobileFriendly } from '../TooltipMobileFriendly'
import { useI18nContext } from '../../i18n/i18n-react-custom'

/**
 * 1. WORD HIDING TOGGLE
 */
export interface KhmerWordsHidingActionProps {
  isEnabled: boolean
  onToggle: () => void
}

export const KhmerWordsHidingAction = memo(({ isEnabled, onToggle }: KhmerWordsHidingActionProps) => {
  const { LL } = useI18nContext()

  return (
    <TooltipMobileFriendly closeDelay={0} content={isEnabled ? LL.ACTIONS.HIDE_KM() : LL.ACTIONS.SHOW_KM()}>
      <Button
        isIconOnly
        className={isEnabled ? 'text-primary' : 'text-default-500'}
        radius="full"
        variant="light"
        onPress={onToggle}
      >
        <KhmerHideToggleIcon isEnabled={isEnabled} />
      </Button>
    </TooltipMobileFriendly>
  )
})
KhmerWordsHidingAction.displayName = 'KhmerWordsHidingAction'

/**
 * 1. WORD HIDING TOGGLE
 */
export interface NonKhmerWordsHidingActionProps {
  isEnabled: boolean
  onToggle: () => void
}

export const NonKhmerWordsHidingAction = memo(({ isEnabled, onToggle }: NonKhmerWordsHidingActionProps) => {
  const { LL } = useI18nContext()

  return (
    <TooltipMobileFriendly closeDelay={0} content={isEnabled ? LL.ACTIONS.HIDE_NON_KM() : LL.ACTIONS.SHOW_NON_KM()}>
      <Button
        isIconOnly
        className={isEnabled ? 'text-primary' : 'text-default-500'}
        radius="full"
        variant="light"
        onPress={onToggle}
      >
        <NonKhmerHideToggleIcon isEnabled={isEnabled} />
      </Button>
    </TooltipMobileFriendly>
  )
})
NonKhmerWordsHidingAction.displayName = 'NonKhmerWordsHidingAction'

/**
 * 2. LINKS TOGGLE
 */
export interface KhmerLinksActionProps {
  isEnabled: boolean
  isDisabled: boolean
  onToggle: () => void
}

export const KhmerLinksAction = memo(({ isEnabled, isDisabled, onToggle }: KhmerLinksActionProps) => {
  const { LL } = useI18nContext()

  return (
    <TooltipMobileFriendly closeDelay={0} content={isEnabled ? LL.ACTIONS.DISABLE_LINKS() : LL.ACTIONS.ENABLE_LINKS()}>
      <Button
        isIconOnly
        className={isEnabled ? 'text-primary' : 'text-default-500'}
        isDisabled={isDisabled}
        radius="full"
        variant="light"
        onPress={onToggle}
      >
        {isEnabled ? <TbLink className="h-6 w-6" /> : <TbLinkOff className="h-6 w-6" />}
      </Button>
    </TooltipMobileFriendly>
  )
})
KhmerLinksAction.displayName = 'KhmerLinksAction'

/**
 * 3. FONT SELECTION DROPDOWN
 */
export interface KhmerFontActionProps {
  khmerFontName: KhmerFontName
  onChange: (v: KhmerFontName) => void
}

export const KhmerFontAction = memo(({ khmerFontName, onChange }: KhmerFontActionProps) => {
  const { LL } = useI18nContext()
  const selectedKeys = useMemo(() => [khmerFontName], [khmerFontName])

  const handleFontChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = herouiSharedSelection_getFirst_string(keys)

      if (selectedKey) onChange(stringToKhmerFontNameOrThrow(selectedKey))
    },
    [onChange],
  )

  return (
    <Dropdown>
      <DropdownTrigger>
        <TooltipMobileFriendly closeDelay={0} content={LL.ACTIONS.FONT_LABEL()}>
          <Button isIconOnly className="text-default-900" radius="full" variant="light">
            <MdTextFields className={`h-6 w-6 ${khmerFontName !== 'Default' ? 'text-primary' : 'text-default-500'}`} />
          </Button>
        </TooltipMobileFriendly>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Khmer Font Selection"
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleFontChange}
      >
        {KHMER_FONT_NAME.map(font => (
          <DropdownItem key={font} className="font-khmer" style={{ fontFamily: KHMER_FONT_FAMILY[font] }}>
            {font}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
})
KhmerFontAction.displayName = 'KhmerFontAction'

/**
 * 4. COLORIZATION DROPDOWN
 */
export interface ColorizationActionProps {
  colorMode: MaybeColorizationMode
  onChange: (v: MaybeColorizationMode) => void
}

export const ColorizationAction = memo(({ colorMode, onChange }: ColorizationActionProps) => {
  const { LL } = useI18nContext()
  const selectedKeys = useMemo(() => [colorMode], [colorMode])

  const handleColorChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = herouiSharedSelection_getFirst_string(keys)

      if (selectedKey) onChange(stringToMaybeColorizationModeOrThrow(selectedKey))
    },
    [onChange],
  )

  return (
    <Dropdown>
      <DropdownTrigger>
        <TooltipMobileFriendly closeDelay={0} content={LL.ACTIONS.COLOR_LABEL()}>
          <Button isIconOnly radius="full" variant="light">
            <IoColorPalette className={`h-6 w-6 ${colorMode !== 'none' ? 'text-primary' : 'text-default-500'}`} />
          </Button>
        </TooltipMobileFriendly>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label={LL.ACTIONS.COLOR_LABEL()}
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleColorChange}
      >
        <DropdownItem key="segmenter">{LL.ACTIONS.COLOR_SEGMENTER()}</DropdownItem>
        <DropdownItem key="dictionary">{LL.ACTIONS.COLOR_DICT()}</DropdownItem>
        <DropdownItem key="none">{LL.ACTIONS.COLOR_NONE()}</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
})
ColorizationAction.displayName = 'ColorizationAction'

/**
 * 7. FAVORITE TOGGLE
 */
export const FavoriteAction = memo(({ isFav, onToggle }: { isFav: boolean; onToggle: () => void }) => {
  const { LL } = useI18nContext()

  return (
    <TooltipMobileFriendly closeDelay={0} content={isFav ? LL.ACTIONS.FAV_REMOVE() : LL.ACTIONS.FAV_ADD()}>
      <Button
        isIconOnly
        className={isFav ? 'text-warning' : 'text-default-400'}
        color={isFav ? 'warning' : 'default'}
        radius="full"
        variant="light"
        onPress={onToggle}
      >
        {isFav ? <GoStarFill className="h-6 w-6" /> : <GoStar className="h-6 w-6" />}
      </Button>
    </TooltipMobileFriendly>
  )
})
FavoriteAction.displayName = 'FavoriteAction'

/**
 * 8. AUTOFOCUS ANSWER TOGGLE
 */
export interface AutoFocusAnswerActionProps {
  isEnabled: boolean
  onToggle: () => void
}

export const AutoFocusAnswerAction = memo(({ isEnabled, onToggle }: AutoFocusAnswerActionProps) => {
  const { LL } = useI18nContext()

  return (
    <TooltipMobileFriendly closeDelay={0} content={isEnabled ? LL.ACTIONS.AUTOFOCUS_ON() : LL.ACTIONS.AUTOFOCUS_OFF()}>
      <Button
        isIconOnly
        className={isEnabled ? 'text-primary' : 'text-default-500'}
        radius="full"
        variant="light"
        onPress={onToggle}
      >
        {isEnabled ? <MdCenterFocusStrong className="h-6 w-6" /> : <MdCenterFocusWeak className="h-6 w-6" />}
      </Button>
    </TooltipMobileFriendly>
  )
})
AutoFocusAnswerAction.displayName = 'AutoFocusAnswerAction'
export interface DetailViewActionsProps_Common {
  word_or_sentence: NonEmptyStringTrimmed
  word_or_sentence__language: DictionaryLanguage
  // Links
  isKhmerLinksEnabled: boolean
  toggleKhmerLinks: () => void
  // Font
  khmerFontName: KhmerFontName
  setKhmerFontName: (v: KhmerFontName) => void
}

export interface DetailViewActionsProps_KnownWord extends DetailViewActionsProps_Common {
  type: 'known_word'
  // Favorites
  isFav: boolean
  toggleFav: () => void
  // Colorization
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void
  // Khmer Words Hiding
  isKhmerWordsHidingEnabled: boolean
  toggleKhmerWordsHiding: () => void
  // Non Khmer Words Hiding
  isNonKhmerWordsHidingEnabled: boolean
  toggleNonKhmerWordsHiding: () => void
}

export interface DetailViewActionsProps_AnkiGame_Back extends DetailViewActionsProps_Common {
  type: 'anki_game_back'
  // Colorization
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void
  // Khmer Words Hiding
  isKhmerWordsHidingEnabled: boolean
  toggleKhmerWordsHiding: () => void
  // Non Khmer Words Hiding
  isNonKhmerWordsHidingEnabled: boolean
  toggleNonKhmerWordsHiding: () => void
  // Autofocus
  isAutoFocusAnswerEnabled: boolean
  toggleAutoFocusAnswer: () => void
}

export interface DetailViewActionsProps_AnkiGame_Front_And_Khmer_Words_Are_Shown extends DetailViewActionsProps_Common {
  type: 'anki_game_front_and_khmer_words_are_shown'
  // Colorization
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void
  // Autofocus
  isAutoFocusAnswerEnabled: boolean
  toggleAutoFocusAnswer: () => void
}

export interface DetailViewActionsProps_AnkiGame_Front_And_Khmer_Words_Are_NotShown extends DetailViewActionsProps_Common {
  type: 'anki_game_front_and_khmer_words_are_not_shown'
  // Autofocus
  isAutoFocusAnswerEnabled: boolean
  toggleAutoFocusAnswer: () => void
}

export interface DetailViewActionsProps_SentenceAnalyzer extends DetailViewActionsProps_Common {
  type: 'sentence_analyzer'
}

export type DetailViewActionsProps =
  | DetailViewActionsProps_KnownWord
  | DetailViewActionsProps_SentenceAnalyzer
  | DetailViewActionsProps_AnkiGame_Back
  | DetailViewActionsProps_AnkiGame_Front_And_Khmer_Words_Are_Shown
  | DetailViewActionsProps_AnkiGame_Front_And_Khmer_Words_Are_NotShown

const DetailViewActionsSentenceAnalyzer = memo((props: DetailViewActionsProps_SentenceAnalyzer) => {
  const {
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    khmerFontName,
    setKhmerFontName,
    word_or_sentence,
    word_or_sentence__language,
  } = props

  return (
    <div className="flex gap-1 shrink-0">
      <KhmerLinksAction isDisabled={false} isEnabled={isKhmerLinksEnabled} onToggle={toggleKhmerLinks} />
      <KhmerFontAction khmerFontName={khmerFontName} onChange={setKhmerFontName} />
      <NativeSpeechAction
        mode={map_DictionaryLanguage_to_BCP47LanguageTagName[word_or_sentence__language]}
        word={word_or_sentence}
      />
      <GoogleSpeechAction mode={word_or_sentence__language} word={word_or_sentence} />
      <AutoReadAction />
    </div>
  )
})

DetailViewActionsSentenceAnalyzer.displayName = 'DetailViewActionsSentenceAnalyzer'

const DetailViewActionsAnkiFrontShown = memo(
  (props: DetailViewActionsProps_AnkiGame_Front_And_Khmer_Words_Are_Shown) => {
    return (
      <div className="flex gap-1 shrink-0">
        <ColorizationAction colorMode={props.maybeColorMode} onChange={props.setMaybeColorMode} />
        <AutoFocusAnswerAction isEnabled={props.isAutoFocusAnswerEnabled} onToggle={props.toggleAutoFocusAnswer} />
      </div>
    )
  },
)

DetailViewActionsAnkiFrontShown.displayName = 'DetailViewActionsAnkiFrontShown'

const DetailViewActionsAnkiFrontNotShown = memo(
  (props: DetailViewActionsProps_AnkiGame_Front_And_Khmer_Words_Are_NotShown) => {
    return (
      <div className="flex gap-1 shrink-0">
        <AutoFocusAnswerAction isEnabled={props.isAutoFocusAnswerEnabled} onToggle={props.toggleAutoFocusAnswer} />
      </div>
    )
  },
)

DetailViewActionsAnkiFrontNotShown.displayName = 'DetailViewActionsAnkiFrontNotShown'

const DetailViewActionsKnownWord = memo((props: DetailViewActionsProps_KnownWord) => {
  const {
    maybeColorMode,
    setMaybeColorMode,
    isKhmerWordsHidingEnabled,
    toggleKhmerWordsHiding,
    isNonKhmerWordsHidingEnabled,
    toggleNonKhmerWordsHiding,
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    khmerFontName,
    setKhmerFontName,
    word_or_sentence,
    word_or_sentence__language,
    isFav,
    toggleFav,
  } = props

  return (
    <div className="flex gap-1 shrink-0">
      <KhmerWordsHidingAction isEnabled={isKhmerWordsHidingEnabled} onToggle={toggleKhmerWordsHiding} />
      <NonKhmerWordsHidingAction isEnabled={isNonKhmerWordsHidingEnabled} onToggle={toggleNonKhmerWordsHiding} />
      <KhmerLinksAction
        isDisabled={maybeColorMode === 'none'}
        isEnabled={isKhmerLinksEnabled}
        onToggle={toggleKhmerLinks}
      />
      <KhmerFontAction khmerFontName={khmerFontName} onChange={setKhmerFontName} />
      <ColorizationAction colorMode={maybeColorMode} onChange={setMaybeColorMode} />
      <NativeSpeechAction
        mode={map_DictionaryLanguage_to_BCP47LanguageTagName[word_or_sentence__language]}
        word={word_or_sentence}
      />
      <GoogleSpeechAction mode={word_or_sentence__language} word={word_or_sentence} />
      <AutoReadAction />
      <FavoriteAction isFav={isFav} onToggle={toggleFav} />
    </div>
  )
})

DetailViewActionsKnownWord.displayName = 'DetailViewActionsKnownWord'

const DetailViewActionsAnkiBack = memo((props: DetailViewActionsProps_AnkiGame_Back) => {
  const {
    maybeColorMode,
    setMaybeColorMode,
    isKhmerWordsHidingEnabled,
    toggleKhmerWordsHiding,
    isNonKhmerWordsHidingEnabled,
    toggleNonKhmerWordsHiding,
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    khmerFontName,
    setKhmerFontName,
    word_or_sentence,
    word_or_sentence__language,
  } = props

  return (
    <div className="flex gap-1 shrink-0">
      <KhmerWordsHidingAction isEnabled={isKhmerWordsHidingEnabled} onToggle={toggleKhmerWordsHiding} />
      <NonKhmerWordsHidingAction isEnabled={isNonKhmerWordsHidingEnabled} onToggle={toggleNonKhmerWordsHiding} />
      <KhmerLinksAction
        isDisabled={maybeColorMode === 'none'}
        isEnabled={isKhmerLinksEnabled}
        onToggle={toggleKhmerLinks}
      />
      <KhmerFontAction khmerFontName={khmerFontName} onChange={setKhmerFontName} />
      <ColorizationAction colorMode={maybeColorMode} onChange={setMaybeColorMode} />
      <NativeSpeechAction
        mode={map_DictionaryLanguage_to_BCP47LanguageTagName[word_or_sentence__language]}
        word={word_or_sentence}
      />
      <GoogleSpeechAction mode={word_or_sentence__language} word={word_or_sentence} />
      <AutoReadAction />
      <AutoFocusAnswerAction isEnabled={props.isAutoFocusAnswerEnabled} onToggle={props.toggleAutoFocusAnswer} />
    </div>
  )
})

DetailViewActionsAnkiBack.displayName = 'DetailViewActionsAnkiBack'

export const DetailViewActions = memo((props: DetailViewActionsProps) => {
  switch (props.type) {
    case 'sentence_analyzer':
      return <DetailViewActionsSentenceAnalyzer {...props} />
    case 'anki_game_front_and_khmer_words_are_shown':
      return <DetailViewActionsAnkiFrontShown {...props} />
    case 'anki_game_front_and_khmer_words_are_not_shown':
      return <DetailViewActionsAnkiFrontNotShown {...props} />
    case 'known_word':
      return <DetailViewActionsKnownWord {...props} />
    case 'anki_game_back':
      return <DetailViewActionsAnkiBack {...props} />
  }
})
DetailViewActions.displayName = 'DetailViewActions'
