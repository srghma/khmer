import { memo, useCallback, useMemo, useState, type Key } from 'react'
import { Button } from '@heroui/button'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { HiOutlineBookmark, HiBookmark, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi2'
import { TooltipMobileFriendly } from '../TooltipMobileFriendly'
import type { AnalyzerHistoryItem } from '../../hooks/useAnalyzerHistory'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { nonEmptyString_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { details_header__text_className } from '../header_classNames'
import { assertIsDate } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toValidDate'
import { truncateString } from '../../utils/truncateString'
import { strOrNumberToIntOrThrow_strict } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber/validInt'
import { EditAnalyzerHistoryModal } from './EditAnalyzerHistoryModal'

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

const EditButton = memo(function EditButton({
  savedAt,
  onEdit,
}: {
  savedAt: number
  onEdit: (savedAt: number) => void
}) {
  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onEdit(savedAt)
    },
    [savedAt, onEdit],
  )

  return (
    <button
      aria-label="Edit history item"
      className="text-default-400 hover:text-primary p-1 rounded transition-colors shrink-0"
      type="button"
      onClick={handleEdit}
    >
      <HiOutlinePencil className="w-3.5 h-3.5" />
    </button>
  )
})

const ItemEndContent = memo(function ItemEndContent({
  savedAt,
  onRemove,
  onEdit,
}: {
  savedAt: number
  onRemove: (savedAt: number) => void
  onEdit: (savedAt: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <EditButton savedAt={savedAt} onEdit={onEdit} />
      <DeleteButton savedAt={savedAt} onRemove={onRemove} />
    </div>
  )
})

interface AnalyzerHistoryButtonProps {
  /** Current textarea text */
  currentText: NonEmptyStringTrimmed | undefined
  history: AnalyzerHistoryItem[]
  onSave: (text: NonEmptyStringTrimmed) => void
  onSelect: (text: NonEmptyStringTrimmed) => void
  onRemove: (savedAt: number) => void
  onUpdate: (savedAt: number, text: NonEmptyStringTrimmed) => void
  onClear: () => void
}

export const AnalyzerHistoryButton = memo(function AnalyzerHistoryButton({
  currentText,
  history,
  onSave,
  onSelect,
  onRemove,
  onUpdate,
  onClear,
}: AnalyzerHistoryButtonProps) {
  const [editingItemSavedAt, setEditingItemSavedAt] = useState<number | null>(null)
  const isSaved = currentText ? history.some(item => item.text === currentText) : false

  const editingItem = useMemo(
    () => history.find(item => item.savedAt === editingItemSavedAt),
    [editingItemSavedAt, history],
  )

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
    <div className="flex flex-col items-center gap-1 shrink-0">
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
        <>
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
                    endContent={
                      <ItemEndContent savedAt={item.savedAt} onEdit={setEditingItemSavedAt} onRemove={onRemove} />
                    }
                  >
                    {truncateString(item.text, MAX_PREVIEW_LENGTH)}
                  </DropdownItem>
                )),
                <DropdownItem key="__clear__" className="text-danger" color="danger" textValue="Clear all">
                  Clear all history
                </DropdownItem>,
              ]}
            </DropdownMenu>
          </Dropdown>

          {editingItem && (
            <EditAnalyzerHistoryModal
              isOpen={!!editingItem}
              item={editingItem}
              onClose={() => setEditingItemSavedAt(null)}
              onUpdate={onUpdate}
            />
          )}
        </>
      )}
    </div>
  )
})

AnalyzerHistoryButton.displayName = 'AnalyzerHistoryButton'
