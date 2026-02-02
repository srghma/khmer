import { useState, useCallback, useMemo } from 'react'
import type { SharedSelection } from '@heroui/system'
import { type ColorizationMode, stringToColorizationModeOrThrow } from '../../utils/text-processing/utils'
import { getSingleSelection_string } from '../../utils/selection-utils'

interface UseDetailViewAppearanceProps {
  fontSize: number
  colorMode: ColorizationMode
  setColorMode: (c: ColorizationMode) => void
}

export const useDetailViewAppearance = ({ fontSize, colorMode, setColorMode }: UseDetailViewAppearanceProps) => {
  // Local state for Font
  const [khmerFont, setKhmerFont] = useState<string>('')

  // Handlers
  const handleColorChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = getSingleSelection_string(keys)

      if (selectedKey) {
        setColorMode(stringToColorizationModeOrThrow(selectedKey))
      }
    },
    [setColorMode],
  )

  const handleFontChange = useCallback((keys: SharedSelection) => {
    const selectedVal = getSingleSelection_string(keys)

    if (selectedVal) {
      setKhmerFont(selectedVal)
    }
  }, [])

  // Memos
  const cardStyle = useMemo(
    () => ({
      fontSize: `${fontSize}px`,
      lineHeight: 1.6,
      fontFamily: khmerFont || undefined,
    }),
    [fontSize, khmerFont],
  )

  const colorSelection = useMemo(() => new Set([colorMode]), [colorMode])
  const fontSelection = useMemo(() => new Set([khmerFont]), [khmerFont])

  return {
    khmerFont,
    cardStyle,
    colorSelection,
    fontSelection,
    handleColorChange,
    handleFontChange,
  }
}
