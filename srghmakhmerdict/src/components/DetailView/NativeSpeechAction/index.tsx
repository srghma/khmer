import { memo } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useNativeTts } from '../../../hooks/useNativeTts'
import { NativeSpeechActionPresentation } from './Presentation'
import type { BCP47LanguageTagName } from '../../../utils/my-bcp-47'

interface NativeSpeechActionProps {
  word: NonEmptyStringTrimmed | undefined
  mode: BCP47LanguageTagName
}

export const NativeSpeechAction = memo(({ word, mode }: NativeSpeechActionProps) => {
  const isDisabled = !word

  return <NativeSpeechActionPresentation {...useNativeTts(word, mode)} isDisabled={isDisabled} />
})

NativeSpeechAction.displayName = 'NativeSpeechAction'
