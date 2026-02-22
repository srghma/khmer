import { memo, useCallback, type Key } from 'react'
import { Button } from '@heroui/button'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { HiOutlineBookmark, HiBookmark, HiOutlineTrash } from 'react-icons/hi2'
import { TooltipMobileFriendly } from '../TooltipMobileFriendly'
import type { AnalyzerHistoryItem } from '../../hooks/useAnalyzerHistory'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { nonEmptyString_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { details_header__text_className } from '../header_classNames'
import { assertIsDate } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toValidDate'
import { truncateString } from '../../utils/truncateString'
import { strOrNumberToIntOrThrow_strict } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'

const MAX_PREVIEW_LENGTH = 60

function formatDate(ts: number): NonEmptyStringTrimmed {
  const date = new Date(ts)

  assertIsDate(date)

  const dateString = date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return nonEmptyString_afterTrim(dateString)
}

const DeleteButton = memo(function DeleteButton({
  savedAt,
  onRemove,
}: {
  savedAt: number
  onRemove: (savedAt: number) => void
}) {
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove(savedAt)
    },
    [savedAt, onRemove],
  )

  return (
    <button
      aria-label="Remove from history"
      className="text-danger/60 hover:text-danger p-1 rounded transition-colors shrink-0"
      type="button"
      onClick={handleRemove}
    >
      <HiOutlineTrash className="w-3.5 h-3.5" />
    </button>
  )
})

interface AnalyzerHistoryButtonProps {
  /** Current textarea text */
  currentText: NonEmptyStringTrimmed | undefined
  history: AnalyzerHistoryItem[]
  onSave: (text: NonEmptyStringTrimmed) => void
  onSelect: (text: NonEmptyStringTrimmed) => void
  onRemove: (savedAt: number) => void
  onClear: () => void
}

export const AnalyzerHistoryButton = memo(function AnalyzerHistoryButton({
  currentText,
  history,
  onSave,
  onSelect,
  onRemove,
  onClear,
}: AnalyzerHistoryButtonProps) {
  const isSaved = currentText ? history.some(item => item.text === currentText) : false

  const handleSave = useCallback(() => {
    if (currentText) onSave(currentText)
  }, [currentText, onSave])

  const handleSelect = useCallback(
    (text: NonEmptyStringTrimmed) => {
      onSelect(text)
    },
    [onSelect],
  )

  const handleDropdownAction = useCallback(
    (key: Key) => {
      const keyStr = String(key)

      if (keyStr === '__clear__') {
        onClear()

        return
      }

      // key is the savedAt timestamp — find and load the text
      const ts = strOrNumberToIntOrThrow_strict(keyStr)
      const item = history.find(h => h.savedAt === ts)

      if (item) handleSelect(item.text)
    },
    [onClear, onRemove, handleSelect, history],
  )

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Save button — only visible when there's text */}
      <TooltipMobileFriendly closeDelay={0} content={isSaved ? 'Already saved in history' : 'Save to history'}>
        <Button
          isIconOnly
          className={isSaved ? 'text-primary' : 'text-default-500'}
          isDisabled={!currentText}
          radius="full"
          size="sm"
          variant="light"
          onPress={handleSave}
        >
          {isSaved ? (
            <HiBookmark className={details_header__text_className} />
          ) : (
            <HiOutlineBookmark className={details_header__text_className} />
          )}
        </Button>
      </TooltipMobileFriendly>

      {/* History dropdown — only visible when there's history */}
      {history.length > 0 && (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button className="text-default-500 text-tiny font-bold" size="sm" variant="flat">
              History ({history.length})
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Analyzer history" className="max-w-[320px]" onAction={handleDropdownAction}>
            {[
              ...history.map(item => (
                <DropdownItem
                  key={item.savedAt}
                  description={formatDate(item.savedAt)}
                  endContent={<DeleteButton savedAt={item.savedAt} onRemove={onRemove} />}
                  textValue={item.text}
                >
                  <span className="font-khmer text-sm leading-snug text-foreground/90 block truncate">
                    {truncateString(item.text, MAX_PREVIEW_LENGTH)}
                  </span>
                </DropdownItem>
              )),
              <DropdownItem key="__clear__" className="text-danger" color="danger" textValue="Clear all">
                Clear all history
              </DropdownItem>,
            ]}
          </DropdownMenu>
        </Dropdown>
      )}
    </div>
  )
})

AnalyzerHistoryButton.displayName = 'AnalyzerHistoryButton'
