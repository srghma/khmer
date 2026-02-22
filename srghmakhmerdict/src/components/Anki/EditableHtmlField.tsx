import type { WordsHidingMode } from '../../providers/SettingsProvider'
import { useState, useCallback, memo } from 'react'
import { Textarea, Button } from '@heroui/react'
import { HiPencil, HiCheck, HiXMark, HiPlus } from 'react-icons/hi2'
import { RenderHtmlColorized, SectionTitleWithRightContent } from '../DetailView/atoms'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { ShortDefinition } from '../../db/dict'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useI18nContext } from '../../i18n/i18n-react-custom'

interface EditableHtmlFieldProps {
  initialValue: NonEmptyStringTrimmed | undefined
  onSave: (newValue: NonEmptyStringTrimmed | undefined) => Promise<void>
  label: string
  className?: string
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isKhmerPronunciationHidingEnabled: boolean
  isShowShortDetailAboutKhmerWordEnabled: boolean
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined
}

const textareaClassNames = {
  input: 'font-mono text-sm',
  inputWrapper: 'border-divider hover:border-primary/50 focus-within:!border-primary',
}

export const EditableHtmlField = memo(function EditableHtmlField({
  initialValue,
  onSave,
  label,
  className = '',
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isKhmerPronunciationHidingEnabled,
  isShowShortDetailAboutKhmerWordEnabled,
  shortDefinitions,
}: EditableHtmlFieldProps) {
  const { LL } = useI18nContext()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = useCallback(() => {
    setValue(initialValue ?? '')
    setIsEditing(true)
  }, [initialValue])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setValue(initialValue ?? '')
  }, [initialValue])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const trimmed = String_toNonEmptyString_orUndefined_afterTrim(value)

      await onSave(trimmed)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }, [value, onSave])

  if (isEditing) {
    return (
      <div className={`mb-4 animate-in fade-in duration-200 ${className}`}>
        <SectionTitleWithRightContent
          rightContent={
            <div className="flex gap-1">
              <Button
                isIconOnly
                className="h-6 w-6 min-w-0"
                color="danger"
                isDisabled={isSaving}
                size="sm"
                variant="light"
                onPress={handleCancel}
              >
                <HiXMark />
              </Button>
              <Button
                isIconOnly
                className="h-6 w-6 min-w-0"
                color="primary"
                isLoading={isSaving}
                size="sm"
                variant="light"
                onPress={handleSave}
              >
                {!isSaving && <HiCheck />}
              </Button>
            </div>
          }
        >
          {label}
        </SectionTitleWithRightContent>
        <Textarea
          autoFocus
          classNames={textareaClassNames}
          maxRows={12}
          minRows={2}
          placeholder={LL.ACTIONS.ENTER_HTML_OR_TEXT()}
          value={value}
          variant="bordered"
          onValueChange={setValue}
        />
      </div>
    )
  }

  return (
    <div className={`group mb-4 ${className}`}>
      <SectionTitleWithRightContent
        rightContent={
          initialValue ? (
            // Show Edit pencil on hover when content exists
            <Button
              isIconOnly
              className="h-6 w-6 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity"
              size="sm"
              variant="light"
              onPress={handleEdit}
            >
              <HiPencil className="text-default-400" />
            </Button>
          ) : (
            // Show Add button when empty
            <Button
              className="h-6 px-2 min-w-0 text-xs"
              color="primary"
              size="sm"
              startContent={<HiPlus size={14} />}
              variant="light"
              onPress={handleEdit}
            >
              {LL.ACTIONS.ADD()}
            </Button>
          )
        }
      >
        {label}
      </SectionTitleWithRightContent>

      {initialValue && (
        <RenderHtmlColorized
          dictionaryMode_lonelyWordShouldBeSpilt={false}
          hideBrokenImages_enable={false}
          html={initialValue}
          isKhmerLinksEnabled_ifTrue_passOnNavigateKm={undefined}
          isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
          isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
          khmerWordsHidingMode={khmerWordsHidingMode}
          nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
          pronunciationSource={undefined}
          shortDefinitions={shortDefinitions}
        />
      )}
    </div>
  )
})

EditableHtmlField.displayName = 'EditableHtmlField'
