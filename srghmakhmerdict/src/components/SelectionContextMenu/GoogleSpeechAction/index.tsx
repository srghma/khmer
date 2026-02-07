import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../../types'
import { useGoogleTts } from '../../../hooks/useGoogleTts'
import { GoogleSpeechActionPresentation } from './Presentation'

export const GoogleSpeechAction = ({
  word,
  mode,
}: {
  word: NonEmptyStringTrimmed | undefined
  mode: DictionaryLanguage
}) => {
  const state = useGoogleTts(word, mode)

  return <GoogleSpeechActionPresentation {...state} isDisabled={!word} />
}
