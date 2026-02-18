import { useState, memo, useCallback } from 'react'
import { Textarea, Button } from '@heroui/react'
import { getAnkiExportData } from '../../../db/favorite/anki_export'
import { useI18nContext } from '../../../i18n/i18n-react-custom'
import { useAppToast } from '../../../providers/ToastProvider'
import { HiClipboardDocumentList, HiArrowDownTray } from 'react-icons/hi2'
import { truncateString } from '../../../utils/truncateString'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

const TextareaClassNames = {
  input: 'font-mono text-xs leading-relaxed opacity-70',
  label: 'font-bold text-default-700 mb-2',
}

export const AnkiExport = memo(() => {
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { LL } = useI18nContext()
  const toast = useAppToast()

  const handleExport = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAnkiExportData()

      setOutput(res)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleCopy = useCallback(() => {
    const output_ = String_toNonEmptyString_orUndefined_afterTrim(output)

    if (output_) {
      navigator.clipboard.writeText(output)
      toast.success('Copied to clipboard' as NonEmptyStringTrimmed, truncateString(output_, 50))
    }
  }, [output, toast])

  return !output ? (
    <Button
      className="font-black uppercase tracking-wider shadow-lg shadow-primary/20"
      color="primary"
      isLoading={isLoading}
      size="lg"
      startContent={<HiArrowDownTray className="text-xl" />}
      onPress={handleExport}
    >
      {LL.ANKI.EXPORT.BUTTON()}
    </Button>
  ) : (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Textarea
        readOnly
        classNames={TextareaClassNames}
        label="Exported Words"
        labelPlacement="outside"
        maxRows={20}
        minRows={10}
        value={output}
        variant="flat"
      />
      <div className="flex gap-2">
        <Button
          className="flex-1 font-black uppercase tracking-wider"
          color="secondary"
          startContent={<HiClipboardDocumentList className="text-xl" />}
          onPress={handleCopy}
        >
          Copy to Clipboard
        </Button>
      </div>
    </div>
  )
})

AnkiExport.displayName = 'AnkiExport'
