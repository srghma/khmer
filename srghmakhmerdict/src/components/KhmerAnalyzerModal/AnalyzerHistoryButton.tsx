import { memo, useCallback } from 'react'
import { Button } from '@heroui/button'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { HiOutlineBookmark, HiBookmark, HiOutlineTrash } from 'react-icons/hi2'
import { TooltipMobileFriendly } from '../TooltipMobileFriendly'
import type { AnalyzerHistoryItem } from '../../hooks/useAnalyzerHistory'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { String_toNonEmptyString_orUndefined_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { details_header__text_className } from '../header_classNames'

const MAX_PREVIEW_LENGTH = 60

function truncatePreview(text: string): string {
  return text.length > MAX_PREVIEW_LENGTH ? text.slice(0, MAX_PREVIEW_LENGTH) + '…' : text
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface AnalyzerHistoryButtonProps {
  /** Current textarea text */
  currentText: string
  history: AnalyzerHistoryItem[]
  onSave: (text: string) => void
  onSelect: (text: string) => void
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
  const trimmed = String_toNonEmptyString_orUndefined_afterTrim(currentText)

  const isSaved = trimmed ? history.some(item => item.text === trimmed) : false

  const handleSave = useCallback(() => {
    if (trimmed) onSave(trimmed)
  }, [trimmed, onSave])

  const handleSelect = useCallback(
    (text: NonEmptyStringTrimmed) => {
      onSelect(text)
    },
    [onSelect],
  )

  if (history.length === 0 && !trimmed) return null

  return (
    <div className="flex items-center gap-1">
      {/* Save button — only visible when there's text */}
      {trimmed && (
        <TooltipMobileFriendly closeDelay={0} content={isSaved ? 'Already saved in history' : 'Save to history'}>
          <Button
            isIconOnly
            className={isSaved ? 'text-primary' : 'text-default-500'}
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
      )}

      {/* History dropdown — only visible when there's history */}
      {history.length > 0 && (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button className="text-default-500 text-tiny font-bold" size="sm" variant="flat">
              History ({history.length})
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Analyzer history"
            className="max-w-[320px]"
            onAction={key => {
              const keyStr = String(key)

              if (keyStr === '__clear__') {
                onClear()
                return
              }

              if (keyStr.startsWith('delete:')) {
                const ts = parseInt(keyStr.replace('delete:', ''), 10)
                onRemove(ts)
                return
              }

              // key is the savedAt timestamp — find and load the text
              const ts = parseInt(keyStr, 10)
              const item = history.find(h => h.savedAt === ts)

              if (item) handleSelect(item.text as NonEmptyStringTrimmed)
            }}
          >
            {[
              ...history.map(item => (
                <DropdownItem
                  key={String(item.savedAt)}
                  description={formatDate(item.savedAt)}
                  endContent={
                    <button
                      aria-label="Remove from history"
                      className="text-danger/60 hover:text-danger p-1 rounded transition-colors shrink-0"
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        onRemove(item.savedAt)
                      }}
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  }
                  textValue={item.text}
                >
                  <span className="font-khmer text-sm leading-snug text-foreground/90 block truncate">
                    {truncatePreview(item.text)}
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
