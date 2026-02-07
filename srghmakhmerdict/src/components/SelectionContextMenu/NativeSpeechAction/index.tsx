import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useNativeTts } from '../../../hooks/useNativeTts'
import { NativeSpeechActionPresentation } from './Presentation'
import type { BCP47LanguageTagName } from '../../../utils/my-bcp-47'

export const NativeSpeechAction = ({
  word,
  mode,
}: {
  word: NonEmptyStringTrimmed | undefined
  mode: BCP47LanguageTagName
}) => {
  const state = useNativeTts(word, mode)

  return <NativeSpeechActionPresentation {...state} isDisabled={!word} />
}
