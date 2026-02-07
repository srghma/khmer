import { useCallback, useMemo, memo } from 'react'
import { MdTextFields } from 'react-icons/md'
import { IoColorPalette } from 'react-icons/io5'
import { TbLink, TbLinkOff } from 'react-icons/tb'
import { GoStarFill, GoStar } from 'react-icons/go'
import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/tooltip'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import type { SharedSelection } from '@heroui/system'

import { KhmerHideToggleIcon } from './KhmerHideToggleIcon'
import { GoogleSpeakerIcon } from './GoogleSpeakerIcon'
import { NativeSpeakerIcon } from './NativeSpeakerIcon'
import {
  KHMER_FONT_FAMILY,
  KHMER_FONT_NAME,
  stringToKhmerFontNameOrThrow,
  stringToMaybeColorizationModeOrThrow,
} from '../utils/text-processing/utils'
import { getSingleSelection_string } from '../utils/selection-utils'
import type { KhmerFontName, MaybeColorizationMode } from '../utils/text-processing/utils'

/**
 * 1. WORD HIDING TOGGLE
 */
interface KhmerWordsHidingActionProps {
  isEnabled: boolean
  onToggle: () => void
}

export const KhmerWordsHidingAction = memo(({ isEnabled, onToggle }: KhmerWordsHidingActionProps) => {
  return (
    <Tooltip closeDelay={0} content={isEnabled ? 'Hide khmer words' : 'Show khmer words'}>
      <Button
        isIconOnly
        className={isEnabled ? 'text-primary' : 'text-default-500'}
        radius="full"
        variant="light"
        onPress={onToggle}
      >
        <KhmerHideToggleIcon isEnabled={isEnabled} />
      </Button>
    </Tooltip>
  )
})
KhmerWordsHidingAction.displayName = 'KhmerWordsHidingAction'

/**
 * 2. LINKS TOGGLE
 */
interface KhmerLinksActionProps {
  isEnabled: boolean
  isDisabled: boolean
  onToggle: () => void
}

export const KhmerLinksAction = memo(({ isEnabled, isDisabled, onToggle }: KhmerLinksActionProps) => {
  return (
    <Tooltip closeDelay={0} content={isEnabled ? 'Disable word links' : 'Enable word links'}>
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
    </Tooltip>
  )
})
KhmerLinksAction.displayName = 'KhmerLinksAction'

/**
 * 3. FONT SELECTION DROPDOWN
 */
interface KhmerFontActionProps {
  khmerFontName: KhmerFontName
  onChange: (v: KhmerFontName) => void
}

export const KhmerFontAction = memo(({ khmerFontName, onChange }: KhmerFontActionProps) => {
  const selectedKeys = useMemo(() => [khmerFontName], [khmerFontName])

  const handleFontChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = getSingleSelection_string(keys)

      if (selectedKey) onChange(stringToKhmerFontNameOrThrow(selectedKey))
    },
    [onChange],
  )

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly className="text-default-900" radius="full" variant="light">
          <MdTextFields className={`h-6 w-6 ${khmerFontName ? 'text-primary' : 'text-default-500'}`} />
        </Button>
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
interface ColorizationActionProps {
  colorMode: MaybeColorizationMode
  onChange: (v: MaybeColorizationMode) => void
}

export const ColorizationAction = memo(({ colorMode, onChange }: ColorizationActionProps) => {
  const selectedKeys = useMemo(() => [colorMode], [colorMode])

  const handleColorChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = getSingleSelection_string(keys)

      if (selectedKey) onChange(stringToMaybeColorizationModeOrThrow(selectedKey))
    },
    [onChange],
  )

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly radius="full" variant="light">
          <IoColorPalette className={`h-6 w-6 ${colorMode !== 'none' ? 'text-primary' : 'text-default-500'}`} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Colorization Settings"
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleColorChange}
      >
        <DropdownItem key="segmenter">Using Segmenter</DropdownItem>
        <DropdownItem key="dictionary">Using Dictionary</DropdownItem>
        <DropdownItem key="none">None</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
})
ColorizationAction.displayName = 'ColorizationAction'

/**
 * 5. NATIVE SPEECH BUTTON
 */
export const NativeSpeechAction = memo(({ onSpeak }: { onSpeak: () => void }) => (
  <Tooltip closeDelay={0} content="Native Speech">
    <Button isIconOnly radius="full" variant="light" onPress={onSpeak}>
      <NativeSpeakerIcon className="h-6 w-6 text-default-900" />
    </Button>
  </Tooltip>
))
NativeSpeechAction.displayName = 'NativeSpeechAction'

/**
 * 6. GOOGLE SPEECH BUTTON
 */
export const GoogleSpeechAction = memo(({ onSpeak, isLoading }: { onSpeak: () => void; isLoading: boolean }) => (
  <Tooltip closeDelay={0} content="Google Speech">
    <Button isIconOnly isLoading={isLoading} radius="full" variant="light" onPress={onSpeak}>
      {!isLoading && <GoogleSpeakerIcon className="h-6 w-6 text-[#4285F4]" />}
    </Button>
  </Tooltip>
))
GoogleSpeechAction.displayName = 'GoogleSpeechAction'

/**
 * 7. FAVORITE TOGGLE
 */
export const FavoriteAction = memo(({ isFav, onToggle }: { isFav: boolean; onToggle: () => void }) => (
  <Tooltip closeDelay={0} content={isFav ? 'Remove Favorite' : 'Add Favorite'}>
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
  </Tooltip>
))
FavoriteAction.displayName = 'FavoriteAction'

/**
 * MAIN CONTAINER COMPONENT
 */
interface DetailViewActionsProps {
  // Khmer Words Hiding
  isKhmerWordsHidingEnabled: boolean
  toggleKhmerWordsHiding: () => void
  // Links
  isKhmerLinksEnabled: boolean
  toggleKhmerLinks: () => void
  // Font
  khmerFontName: KhmerFontName
  setKhmerFontName: (v: KhmerFontName) => void
  // Colorization
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void
  // Speech
  handleNativeSpeak: () => void
  handleGoogleSpeak: () => void
  isGoogleSpeaking: boolean
  // Favorites
  isFav: boolean
  toggleFav: () => void
}

export const DetailViewActions = memo(
  ({
    isKhmerWordsHidingEnabled,
    toggleKhmerWordsHiding,
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    khmerFontName,
    setKhmerFontName,
    maybeColorMode,
    setMaybeColorMode,
    handleNativeSpeak,
    handleGoogleSpeak,
    isGoogleSpeaking,
    isFav,
    toggleFav,
  }: DetailViewActionsProps) => {
    return (
      <div className="flex gap-1 shrink-0">
        <KhmerWordsHidingAction isEnabled={isKhmerWordsHidingEnabled} onToggle={toggleKhmerWordsHiding} />
        <KhmerLinksAction
          isDisabled={maybeColorMode === 'none'}
          isEnabled={isKhmerLinksEnabled}
          onToggle={toggleKhmerLinks}
        />
        <KhmerFontAction khmerFontName={khmerFontName} onChange={setKhmerFontName} />
        <ColorizationAction colorMode={maybeColorMode} onChange={setMaybeColorMode} />
        <NativeSpeechAction onSpeak={handleNativeSpeak} />
        <GoogleSpeechAction isLoading={isGoogleSpeaking} onSpeak={handleGoogleSpeak} />
        <FavoriteAction isFav={isFav} onToggle={toggleFav} />
      </div>
    )
  },
)
DetailViewActions.displayName = 'DetailViewActions'
