import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useGoogleTts } from '../../../hooks/useGoogleTts'
import { GoogleSpeechActionPresentation } from './Presentation'
import type { ToTranslateLanguage } from '../../../utils/googleTranslate/toTranslateLanguage'

interface GoogleSpeechActionProps {
  word: NonEmptyStringTrimmed | undefined
  mode: ToTranslateLanguage
}

export const GoogleSpeechAction = ({ word, mode }: GoogleSpeechActionProps) => {
  const isDisabled = !word

  return <GoogleSpeechActionPresentation {...useGoogleTts(word, mode)} isDisabled={isDisabled} />
}

GoogleSpeechAction.displayName = 'GoogleSpeechAction'
