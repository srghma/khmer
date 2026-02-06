import React, { useCallback, useMemo } from 'react'

import { HiArrowLeft } from 'react-icons/hi2'
import { GoStarFill, GoStar } from 'react-icons/go'
import { IoColorPalette } from 'react-icons/io5'
import { MdTextFields } from 'react-icons/md' // NEW ICON
import { Button } from '@heroui/button'
import { CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { Tooltip } from '@heroui/tooltip'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'

import { type DictionaryLanguage } from '../types'
import { GoogleSpeakerIcon } from './GoogleSpeakerIcon'
import { NativeSpeakerIcon } from './NativeSpeakerIcon'
import {
  KHMER_FONT_FAMILY,
  stringToKhmerFontNameOrThrow,
  stringToMaybeColorizationModeOrThrow,
  type KhmerFontName,
  type MaybeColorizationMode,
} from '../utils/text-processing/utils'
import type { KhmerWordsMap } from '../db/dict'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { SharedSelection } from '@heroui/system'
import { getSingleSelection_string } from '../utils/selection-utils'

// --- NEW CONSTANTS ---
export const KHMER_FONTS: { name: NonEmptyStringTrimmed; value: string }[] = [
  { name: 'Default' as NonEmptyStringTrimmed, value: '' }, // Uses system/CSS default
  { name: 'Moul' as NonEmptyStringTrimmed, value: '"Moul", serif' }, // Headings (Thick)
  { name: 'Siemreap' as NonEmptyStringTrimmed, value: '"Siemreap", serif' }, // Elegant, traditional
  { name: 'Battambang' as NonEmptyStringTrimmed, value: '"Battambang", cursive' }, // Standard readable
  { name: 'Kantumruy' as NonEmptyStringTrimmed, value: '"Kantumruy Pro", sans-serif' }, // Modern Sans
  { name: 'Fasthand' as NonEmptyStringTrimmed, value: '"Fasthand", cursive' }, // Handwritten style
]

interface HeaderProps {
  displayWordHtml: { __html: string } | undefined
  phonetic?: string
  mode: DictionaryLanguage
  isFav: boolean
  toggleFav: () => void
  onBack?: () => void
  canGoBack?: boolean
  km_map?: KhmerWordsMap

  // Color Props
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void

  // Font Props (NEW)
  khmerFontName: KhmerFontName
  setKhmerFontName: (v: KhmerFontName) => void

  // TTS Props
  handleNativeSpeak: () => void
  handleGoogleSpeak: () => void
  isGoogleSpeaking: boolean
}

const GoogleSpeakerIcon_ = <GoogleSpeakerIcon className="h-6 w-6 text-[#4285F4]" />
const GoStarFill_ = <GoStarFill className="h-6 w-6" />
const GoStar_ = <GoStar className="h-6 w-6" />

const DetailViewHeaderImpl = (props: HeaderProps) => {
  const {
    displayWordHtml,
    phonetic,
    mode,
    isFav,
    toggleFav,
    onBack,
    canGoBack,
    km_map,

    maybeColorMode,
    setMaybeColorMode,

    khmerFontName,
    setKhmerFontName,

    handleNativeSpeak,
    handleGoogleSpeak,
    isGoogleSpeaking,
  } = props

  // Merge base style with selected font
  const h1Style = useMemo(() => {
    return {
      fontFamily: KHMER_FONT_FAMILY[khmerFontName], // undefined falls back to CSS class
    }
  }, [khmerFontName])

  const maybeColorMode_ = useMemo(() => [maybeColorMode], [maybeColorMode])
  const khmerFontName_ = useMemo(() => [khmerFontName], [khmerFontName])

  const handleColorChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = getSingleSelection_string(keys)

      if (!selectedKey) return
      setMaybeColorMode(stringToMaybeColorizationModeOrThrow(selectedKey))
    },
    [setMaybeColorMode],
  )

  const handleFontChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = getSingleSelection_string(keys)

      if (!selectedKey) return
      setKhmerFontName(stringToKhmerFontNameOrThrow(selectedKey))
    },
    [setKhmerFontName],
  )

  return (
    <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider">
      {onBack && (
        <Button
          isIconOnly
          className={`mr-3 text-default-500 -ml-2 ${canGoBack ? '' : 'md:hidden'}`}
          variant="light"
          onPress={onBack}
        >
          <HiArrowLeft className="w-6 h-6" />
        </Button>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          {displayWordHtml && (
            <h1
              dangerouslySetInnerHTML={displayWordHtml}
              className="font-bold text-foreground font-khmer"
              style={h1Style}
            />
          )}
          {phonetic && (
            <Chip className="font-mono" color="secondary" size="sm" variant="flat">
              /{phonetic}/
            </Chip>
          )}
        </div>
        <div className="mt-1 text-tiny font-mono uppercase text-default-400 tracking-widest">{mode} Dictionary</div>
      </div>

      <div className="flex gap-1 shrink-0">
        {/* FONT DROPDOWN */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              isIconOnly
              className="text-default-900 data-[hover=true]:bg-default-100"
              radius="full"
              variant="light"
            >
              <MdTextFields className={`h-6 w-6 ${khmerFontName ? 'text-primary' : 'text-default-500'}`} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Khmer Font Selection"
            selectedKeys={khmerFontName_}
            selectionMode="single"
            onSelectionChange={handleFontChange}
          >
            {KHMER_FONTS.map(font => (
              <DropdownItem key={font.name} className="font-khmer" style={{ fontFamily: font.value }}>
                {font.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        {/* COLOR DROPDOWN */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              isIconOnly
              className="text-default-900 data-[hover=true]:bg-default-100"
              isLoading={!km_map}
              radius="full"
              variant="light"
            >
              <IoColorPalette
                className={`h-6 w-6 ${maybeColorMode !== 'none' ? 'text-primary' : 'text-default-500'}`}
              />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Colorization Settings"
            selectedKeys={maybeColorMode_}
            selectionMode="single"
            onSelectionChange={handleColorChange}
          >
            <DropdownItem key="segmenter">Using Segmenter</DropdownItem>
            <DropdownItem key="dictionary">Using Dictionary</DropdownItem>
            <DropdownItem key="none">None</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Tooltip closeDelay={0} content="Native Speech">
          <Button isIconOnly radius="full" variant="light" onPress={handleNativeSpeak}>
            <NativeSpeakerIcon className="h-6 w-6 text-default-900" />
          </Button>
        </Tooltip>

        <Tooltip closeDelay={0} content="Google Speech">
          <Button isIconOnly isLoading={isGoogleSpeaking} radius="full" variant="light" onPress={handleGoogleSpeak}>
            {!isGoogleSpeaking && GoogleSpeakerIcon_}
          </Button>
        </Tooltip>

        <Tooltip closeDelay={0} content={isFav ? 'Remove Favorite' : 'Add Favorite'}>
          <Button
            isIconOnly
            className={isFav ? 'text-warning' : 'text-default-400'}
            color={isFav ? 'warning' : 'default'}
            radius="full"
            variant="light"
            onPress={toggleFav}
          >
            {isFav ? GoStarFill_ : GoStar_}
          </Button>
        </Tooltip>
      </div>
    </CardHeader>
  )
}

export const DetailViewHeader = React.memo(DetailViewHeaderImpl)
