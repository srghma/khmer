import { useCallback, useMemo, memo } from 'react'
import { MdTextFields, MdCenterFocusStrong, MdCenterFocusWeak, MdOutlineSubject } from 'react-icons/md'
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
import { type WordsHidingMode, stringToWordsHidingModeOrThrow } from '../../providers/SettingsProvider'
import { GoogleSpeechAction } from './Tooltips/GoogleSpeechAction'
import { NativeSpeechAction } from './Tooltips/NativeSpeechAction'
import { KhmerHideToggleIcon } from '../Icons/KhmerHideToggleIcon'
import { NonKhmerHideToggleIcon } from '../Icons/NonKhmerHideToggleIcon'

import { TooltipMobileFriendly } from '../TooltipMobileFriendly'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { FaEdit, FaRegEdit } from 'react-icons/fa'
import { useNotes } from '../../providers/NotesProvider'
import { useLocation } from 'wouter'

import { cn } from '@heroui/react'
import { details_header__text_className } from '../header_classNames'

/**
 * 1. WORD HIDING TOGGLE
 */
export interface KhmerWordsHidingActionProps {
  mode: WordsHidingMode
  onChange: (mode: WordsHidingMode) => void
}

export const KhmerWordsHidingAction = memo(function KhmerWordsHidingAction({
  mode,
  onChange,
}: KhmerWordsHidingActionProps) {
  const { LL } = useI18nContext()
  const selectedKeys = useMemo(() => [mode], [mode])

  const handleChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = herouiSharedSelection_getFirst_string(keys)

      if (selectedKey) onChange(stringToWordsHidingModeOrThrow(selectedKey))
    },
    [onChange],
  )

  const isEnabled = mode !== 'disabled'

  return (
    <Dropdown>
      <DropdownTrigger>
        <TooltipMobileFriendly closeDelay={0} content={LL.ACTIONS.HIDE_KM()}>
          <Button
            isIconOnly
            className={cn(isEnabled ? 'text-primary' : 'text-default-500', '!overflow-visible')}
            radius="full"
            variant="light"
          >
            <KhmerHideToggleIcon isEnabled={isEnabled} />
          </Button>
        </TooltipMobileFriendly>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        className="text-base"
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleChange}
      >
        <DropdownItem key="disabled">{LL.ACTIONS.SHOW_KM()}</DropdownItem>
        <DropdownItem key="on_click_reveal">{LL.ACTIONS.HIDE_KM()} (Reveal)</DropdownItem>
        <DropdownItem key="on_click_open_fill_in_the_blank_game_modal">{LL.ACTIONS.HIDE_KM()} (Game)</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
})
KhmerWordsHidingAction.displayName = 'KhmerWordsHidingAction'

/**
 * 1. WORD HIDING TOGGLE
 */
export interface NonKhmerWordsHidingActionProps {
  mode: WordsHidingMode
  onChange: (mode: WordsHidingMode) => void
}

export const NonKhmerWordsHidingAction = memo(function NonKhmerWordsHidingAction({
  mode,
  onChange,
}: NonKhmerWordsHidingActionProps) {
  const { LL } = useI18nContext()
  const selectedKeys = useMemo(() => [mode], [mode])

  const handleChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = herouiSharedSelection_getFirst_string(keys)

      if (selectedKey) onChange(stringToWordsHidingModeOrThrow(selectedKey))
    },
    [onChange],
  )

  const isEnabled = mode !== 'disabled'

  return (
    <Dropdown>
      <DropdownTrigger>
        <TooltipMobileFriendly closeDelay={0} content={LL.ACTIONS.HIDE_NON_KM()}>
          <Button
            isIconOnly
            className={cn(isEnabled ? 'text-primary' : 'text-default-500', '!overflow-visible')}
            radius="full"
            variant="light"
          >
            <NonKhmerHideToggleIcon isEnabled={isEnabled} />
          </Button>
        </TooltipMobileFriendly>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        className="text-base"
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleChange}
      >
        <DropdownItem key="disabled">{LL.ACTIONS.SHOW_NON_KM()}</DropdownItem>
        <DropdownItem key="on_click_reveal">{LL.ACTIONS.HIDE_NON_KM()} (Reveal)</DropdownItem>
        <DropdownItem key="on_click_open_fill_in_the_blank_game_modal">{LL.ACTIONS.HIDE_NON_KM()} (Game)</DropdownItem>
      </DropdownMenu>
    </Dropdown>
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

export const KhmerLinksAction = memo(function KhmerLinksAction({
  isEnabled,
  isDisabled,
  onToggle,
}: KhmerLinksActionProps) {
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
        {isEnabled ? (
          <TbLink className={details_header__text_className} />
        ) : (
          <TbLinkOff className={details_header__text_className} />
        )}
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

export const KhmerFontAction = memo(function KhmerFontAction({ khmerFontName, onChange }: KhmerFontActionProps) {
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
            <MdTextFields
              className={cn(
                details_header__text_className,
                khmerFontName !== 'Default' ? 'text-primary' : 'text-default-500',
              )}
            />
          </Button>
        </TooltipMobileFriendly>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Khmer Font Selection"
        className="text-base"
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

export const ColorizationAction = memo(function ColorizationAction({ colorMode, onChange }: ColorizationActionProps) {
  const { LL } = useI18nContext()
  const selectedKeys = useMemo(() => [colorMode], [colorMode])

  const handleColorChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = herouiSharedSelection_getFirst_string(keys)

      if (selectedKey) onChange(stringToMaybeColorizationModeOrThrow(selectedKey))
    },
    [onChange],
  )

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      switch (colorMode) {
        case 'segmenter':
          onChange('dictionary')
          break
        case 'dictionary':
          onChange('segmenter')
          break
        case 'none':
          onChange('segmenter')
          break
        default:
          break
      }
    },
    [colorMode, onChange],
  )

  return (
    <Dropdown>
      <DropdownTrigger>
        <TooltipMobileFriendly closeDelay={0} content={LL.ACTIONS.COLOR_LABEL()}>
          <Button isIconOnly radius="full" variant="light" onContextMenu={handleRightClick}>
            <IoColorPalette
              className={cn(details_header__text_className, colorMode !== 'none' ? 'text-primary' : 'text-default-500')}
            />
          </Button>
        </TooltipMobileFriendly>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label={LL.ACTIONS.COLOR_LABEL()}
        className="text-base"
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
export const FavoriteAction = memo(function FavoriteAction({
  isFav,
  onToggle,
}: {
  isFav: boolean
  onToggle: () => void
}) {
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
        {isFav ? (
          <GoStarFill className={details_header__text_className} />
        ) : (
          <GoStar className={details_header__text_className} />
        )}
      </Button>
    </TooltipMobileFriendly>
  )
})
FavoriteAction.displayName = 'FavoriteAction'

/**
 * 7.5 NOTE ACTION
 */
export const NoteAction = memo(function NoteAction({
  word,
  language,
}: {
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
}) {
  const { getNote } = useNotes()
  const { LL } = useI18nContext()
  const [, setLocation] = useLocation()

  const hasNote = !!getNote(word, language)

  return (
    <TooltipMobileFriendly closeDelay={0} content={LL.ACTIONS.ADD_NOTE()}>
      <Button
        isIconOnly
        className={hasNote ? 'text-primary' : 'text-default-500'}
        radius="full"
        variant="light"
        onPress={() => setLocation(`/notes/${language}/${encodeURIComponent(word)}`)}
      >
        {hasNote ? (
          <FaEdit className={details_header__text_className} />
        ) : (
          <FaRegEdit className={details_header__text_className} />
        )}
      </Button>
    </TooltipMobileFriendly>
  )
})
NoteAction.displayName = 'NoteAction'

/**
 * 8. AUTOFOCUS ANSWER TOGGLE
 */
export interface AutoFocusAnswerActionProps {
  isEnabled: boolean
  onToggle: () => void
}

export const AutoFocusAnswerAction = memo(function AutoFocusAnswerAction({
  isEnabled,
  onToggle,
}: AutoFocusAnswerActionProps) {
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
        {isEnabled ? (
          <MdCenterFocusStrong className={details_header__text_className} />
        ) : (
          <MdCenterFocusWeak className={details_header__text_className} />
        )}
      </Button>
    </TooltipMobileFriendly>
  )
})

AutoFocusAnswerAction.displayName = 'AutoFocusAnswerAction'

/**
 * 9. SHORT DETAIL TOGGLE
 */
export interface ShortDetailAboutKhmerWordActionProps {
  isEnabled: boolean
  onToggle: () => void
}

export const ShortDetailAboutKhmerWordAction = memo(function ShortDetailAboutKhmerWordAction({
  isEnabled,
  onToggle,
}: ShortDetailAboutKhmerWordActionProps) {
  const { LL } = useI18nContext()

  return (
    <TooltipMobileFriendly
      closeDelay={0}
      content={isEnabled ? LL.ACTIONS.HIDE_SHORT_DETAIL() : LL.ACTIONS.SHOW_SHORT_DETAIL()}
    >
      <Button
        isIconOnly
        className={isEnabled ? 'text-primary' : 'text-default-500'}
        radius="full"
        variant="light"
        onPress={onToggle}
      >
        <MdOutlineSubject className={details_header__text_className} />
      </Button>
    </TooltipMobileFriendly>
  )
})

ShortDetailAboutKhmerWordAction.displayName = 'ShortDetailAboutKhmerWordAction'

export interface DetailViewActionsProps_Common {
  word_or_sentence: NonEmptyStringTrimmed
  word_or_sentence__language: DictionaryLanguage
  // Links
  isKhmerLinksEnabled: boolean
  toggleKhmerLinks: () => void
  // Font
  khmerFontName: KhmerFontName
  setKhmerFontName: (v: KhmerFontName) => void
  // Short Detail
  isShowShortDetailAboutKhmerWordEnabled: boolean
  toggleShowShortDetailAboutKhmerWord: () => void
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
  khmerWordsHidingMode: WordsHidingMode
  setKhmerWordsHidingMode: (v: WordsHidingMode) => void
  // Non Khmer Words Hiding
  nonKhmerWordsHidingMode: WordsHidingMode
  setNonKhmerWordsHidingMode: (v: WordsHidingMode) => void
}

export interface DetailViewActionsProps_AnkiGame_Back extends DetailViewActionsProps_Common {
  type: 'anki_game_back'
  // Colorization
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void
  // Khmer Words Hiding
  khmerWordsHidingMode: WordsHidingMode
  setKhmerWordsHidingMode: (v: WordsHidingMode) => void
  // Non Khmer Words Hiding
  nonKhmerWordsHidingMode: WordsHidingMode
  setNonKhmerWordsHidingMode: (v: WordsHidingMode) => void
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

const DetailViewActionsSentenceAnalyzer = memo(function DetailViewActionsSentenceAnalyzer(
  props: DetailViewActionsProps_SentenceAnalyzer,
) {
  const {
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    khmerFontName,
    setKhmerFontName,
    word_or_sentence,
    word_or_sentence__language,
    isShowShortDetailAboutKhmerWordEnabled,
    toggleShowShortDetailAboutKhmerWord,
  } = props

  return (
    <>
      <NativeSpeechAction
        mode={map_DictionaryLanguage_to_BCP47LanguageTagName[word_or_sentence__language]}
        word={word_or_sentence}
      />
      <GoogleSpeechAction mode={word_or_sentence__language} word={word_or_sentence} />
      <KhmerLinksAction isDisabled={false} isEnabled={isKhmerLinksEnabled} onToggle={toggleKhmerLinks} />
      <ShortDetailAboutKhmerWordAction
        isEnabled={isShowShortDetailAboutKhmerWordEnabled}
        onToggle={toggleShowShortDetailAboutKhmerWord}
      />
      <KhmerFontAction khmerFontName={khmerFontName} onChange={setKhmerFontName} />
    </>
  )
})

DetailViewActionsSentenceAnalyzer.displayName = 'DetailViewActionsSentenceAnalyzer'

const DetailViewActionsAnkiFrontShown = memo(function DetailViewActionsAnkiFrontShown(
  props: DetailViewActionsProps_AnkiGame_Front_And_Khmer_Words_Are_Shown,
) {
  return (
    <>
      <ColorizationAction colorMode={props.maybeColorMode} onChange={props.setMaybeColorMode} />
      <AutoFocusAnswerAction isEnabled={props.isAutoFocusAnswerEnabled} onToggle={props.toggleAutoFocusAnswer} />
    </>
  )
})

DetailViewActionsAnkiFrontShown.displayName = 'DetailViewActionsAnkiFrontShown'

const DetailViewActionsAnkiFrontNotShown = memo(function DetailViewActionsAnkiFrontNotShown(
  props: DetailViewActionsProps_AnkiGame_Front_And_Khmer_Words_Are_NotShown,
) {
  return (
    <>
      <AutoFocusAnswerAction isEnabled={props.isAutoFocusAnswerEnabled} onToggle={props.toggleAutoFocusAnswer} />
    </>
  )
})

DetailViewActionsAnkiFrontNotShown.displayName = 'DetailViewActionsAnkiFrontNotShown'

const DetailViewActionsKnownWord = memo(function DetailViewActionsKnownWord(props: DetailViewActionsProps_KnownWord) {
  const {
    maybeColorMode,
    setMaybeColorMode,
    khmerWordsHidingMode,
    setKhmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    setNonKhmerWordsHidingMode,
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    khmerFontName,
    setKhmerFontName,
    word_or_sentence,
    word_or_sentence__language,
    isFav,
    toggleFav,
    isShowShortDetailAboutKhmerWordEnabled,
    toggleShowShortDetailAboutKhmerWord,
  } = props

  return (
    <>
      <FavoriteAction isFav={isFav} onToggle={toggleFav} />
      <NoteAction language={word_or_sentence__language} word={word_or_sentence} />
      <NativeSpeechAction
        mode={map_DictionaryLanguage_to_BCP47LanguageTagName[word_or_sentence__language]}
        word={word_or_sentence}
      />
      <GoogleSpeechAction mode={word_or_sentence__language} word={word_or_sentence} />
      <KhmerWordsHidingAction mode={khmerWordsHidingMode} onChange={setKhmerWordsHidingMode} />
      <NonKhmerWordsHidingAction mode={nonKhmerWordsHidingMode} onChange={setNonKhmerWordsHidingMode} />
      <KhmerLinksAction
        isDisabled={maybeColorMode === 'none'}
        isEnabled={isKhmerLinksEnabled}
        onToggle={toggleKhmerLinks}
      />
      <KhmerFontAction khmerFontName={khmerFontName} onChange={setKhmerFontName} />
      <ShortDetailAboutKhmerWordAction
        isEnabled={isShowShortDetailAboutKhmerWordEnabled}
        onToggle={toggleShowShortDetailAboutKhmerWord}
      />
      <ColorizationAction colorMode={maybeColorMode} onChange={setMaybeColorMode} />
    </>
  )
})

DetailViewActionsKnownWord.displayName = 'DetailViewActionsKnownWord'

const DetailViewActionsAnkiBack = memo(function DetailViewActionsAnkiBack(props: DetailViewActionsProps_AnkiGame_Back) {
  const {
    maybeColorMode,
    setMaybeColorMode,
    khmerWordsHidingMode,
    setKhmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    setNonKhmerWordsHidingMode,
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    khmerFontName,
    setKhmerFontName,
    word_or_sentence,
    word_or_sentence__language,
  } = props

  return (
    <>
      <NativeSpeechAction
        mode={map_DictionaryLanguage_to_BCP47LanguageTagName[word_or_sentence__language]}
        word={word_or_sentence}
      />
      <GoogleSpeechAction mode={word_or_sentence__language} word={word_or_sentence} />
      <KhmerWordsHidingAction mode={khmerWordsHidingMode} onChange={setKhmerWordsHidingMode} />
      <NonKhmerWordsHidingAction mode={nonKhmerWordsHidingMode} onChange={setNonKhmerWordsHidingMode} />
      <KhmerLinksAction
        isDisabled={maybeColorMode === 'none'}
        isEnabled={isKhmerLinksEnabled}
        onToggle={toggleKhmerLinks}
      />
      <KhmerFontAction khmerFontName={khmerFontName} onChange={setKhmerFontName} />
      <ColorizationAction colorMode={maybeColorMode} onChange={setMaybeColorMode} />
      <AutoFocusAnswerAction isEnabled={props.isAutoFocusAnswerEnabled} onToggle={props.toggleAutoFocusAnswer} />
    </>
  )
})

DetailViewActionsAnkiBack.displayName = 'DetailViewActionsAnkiBack'

export const DetailViewActions = memo(function DetailViewActions(props: DetailViewActionsProps) {
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
