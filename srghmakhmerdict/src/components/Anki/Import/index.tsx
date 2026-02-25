import { useState, memo, useCallback, useMemo } from 'react'
import {
  Textarea,
  Button,
  Card,
  CardBody,
  CardHeader,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  type SharedSelection,
} from '@heroui/react'
import { HiDocumentArrowUp } from 'react-icons/hi2' // Add an icon
import { open } from '@tauri-apps/plugin-dialog' // Tauri Dialog
import { readTextFile } from '@tauri-apps/plugin-fs' // Tauri FS
import { useFavorites } from '../../../providers/FavoritesProvider'
import { useI18nContext } from '../../../i18n/i18n-react-custom'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAppToast } from '../../../providers/ToastProvider'
import { unknown_to_errorMessage } from '../../../utils/errorMessage'
import type {
  InAndNotInDbThese_MaybeImported,
  PartitionedMaps_Split_Imported,
} from '../../../db/favorite/anki_import/process'
import { Char_mkOrThrow, type Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'
import { herouiSharedSelection_getFirst_string } from '../../../utils/herouiSharedSelection_getFirst_string'
import {
  assertIsDefined,
  assertIsDefinedAndReturn,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

const textareaClassNames = {
  input: 'font-mono text-sm leading-relaxed',
  label: 'font-bold text-default-700 mb-2',
}

// Helper to convert the "Talking Type" into simple UI stats
function getStats<V>(result: InAndNotInDbThese_MaybeImported<NonEmptyStringTrimmed, V> | undefined) {
  if (!result) return null

  let success = 0
  let skipped = 0
  let notFoundWords: string[] = []

  // Check Dictionary Status (Outer These)
  if (result.t === 'in_db' || result.t === 'both') {
    const importPart = result.in_db

    // Check Database Status (Inner These)
    if (importPart.t === 'imported' || importPart.t === 'both') {
      success = importPart.imported.size
    }
    if (importPart.t === 'skipped' || importPart.t === 'both') {
      skipped = importPart.skipped.size
    }
  }

  if (result.t === 'not_in_db' || result.t === 'both') {
    notFoundWords = Array.from(result.not_in_db.keys())
  }

  return { success, skipped, notFoundWords }
}

const SEPARATORS: { value: Char; label: string }[] = [
  { value: '\t' as Char, label: 'Tab' },
  { value: '|' as Char, label: 'Pipe' },
  { value: ',' as Char, label: 'Comma' },
  { value: ';' as Char, label: 'Semicolon' },
  { value: ':' as Char, label: 'Colon' },
]

const SummarySection = ({ title, data }: { title: string; data: ReturnType<typeof getStats> }) => {
  const { LL } = useI18nContext()

  if (!data) return null
  if (data.success === 0 && data.skipped === 0 && data.notFoundWords.length === 0) return null

  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-bold text-lg">{title}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-success">{LL.ANKI.IMPORT.SUCCESS()}:</span>
        <span className="font-mono font-bold text-right">{data.success}</span>
        <span className="text-warning">{LL.ANKI.IMPORT.SKIPPED()}:</span>
        <span className="font-mono font-bold text-right">{data.skipped}</span>
        <span className="text-danger">{LL.ANKI.IMPORT.NOT_FOUND()}:</span>
        <span className="font-mono font-bold text-right">{data.notFoundWords.length}</span>
      </div>
      {data.notFoundWords.length > 0 && (
        <div className="mt-2 p-2 bg-danger/10 text-danger rounded text-xs break-words">
          {data.notFoundWords.join(', ')}
        </div>
      )}
    </div>
  )
}

export const AnkiImport = memo(function AnkiImport() {
  const [input, setInput] = useState('')
  const [summary, setSummary] = useState<PartitionedMaps_Split_Imported<any> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { importFavorites } = useFavorites()
  const [separator, setSeparator] = useState<Char>('\t' as Char)
  const { LL } = useI18nContext()
  const toast = useAppToast()

  const handleFileSelect = useCallback(async () => {
    try {
      // 1. Open File Dialog
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'Text',
            extensions: ['txt', 'csv', 'md'],
          },
        ],
      })

      if (selected && typeof selected === 'string') {
        // 2. Read file content
        const content = await readTextFile(selected)

        setInput(content)
      }
    } catch (error) {
      toast.error('File selection failed' as NonEmptyStringTrimmed, unknown_to_errorMessage(error))
    }
  }, [])

  const handleImport = useCallback(async () => {
    const input_ = String_toNonEmptyString_orUndefined_afterTrim(input)

    if (!input_) return
    setIsLoading(true)
    try {
      const res = await importFavorites(input_, separator)

      setSummary(res)
    } finally {
      setIsLoading(false)
    }
  }, [importFavorites, input, separator])

  const separatorSelectedKeys = useMemo(() => new Set([separator]), [separator])

  const separatorSelected = useMemo(
    () => assertIsDefinedAndReturn(SEPARATORS.find(s => s.value === separator)),
    [separator],
  )

  const handleSeparatorChange = useCallback((value: SharedSelection) => {
    const selectedValue = herouiSharedSelection_getFirst_string(value)

    assertIsDefined(selectedValue)
    setSeparator(Char_mkOrThrow(selectedValue))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end">
        <div className="flex-1">
          <Textarea
            classNames={textareaClassNames}
            label={LL.ANKI.IMPORT.TITLE()}
            labelPlacement="outside"
            maxRows={15}
            minRows={8}
            placeholder={LL.ANKI.IMPORT.PLACEHOLDER()}
            value={input}
            variant="flat"
            onValueChange={setInput}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          className="font-semibold"
          color="default"
          startContent={<HiDocumentArrowUp size={20} />}
          variant="flat"
          onPress={handleFileSelect}
        >
          Select File
        </Button>

        <Button
          className="flex-1 font-black uppercase tracking-wider shadow-lg shadow-primary/20"
          color="primary"
          isDisabled={!input.trim()}
          isLoading={isLoading}
          onPress={handleImport}
        >
          {LL.ANKI.IMPORT.BUTTON()}
        </Button>

        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat">Separator: {separatorSelected.label}</Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Select separator"
            selectedKeys={separatorSelectedKeys}
            selectionMode="single"
            onSelectionChange={handleSeparatorChange}
          >
            {SEPARATORS.map(s => (
              <DropdownItem key={s.value}>{s.label}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {summary && (
        <Card className="border border-success/20 bg-success-50/5" shadow="sm">
          <CardHeader className="px-6 pt-6 pb-0">
            <h2 className="text-xl font-black uppercase tracking-tight text-success-600">
              {LL.ANKI.IMPORT.SUMMARY_TITLE()}
            </h2>
          </CardHeader>
          <CardBody className="gap-8 px-6 py-6">
            <SummarySection data={getStats(summary.en)} title={LL.ANKI.LANGUAGES.ENGLISH()} />
            <SummarySection data={getStats(summary.km)} title={LL.ANKI.LANGUAGES.KHMER()} />
            <SummarySection data={getStats(summary.ru)} title={LL.ANKI.LANGUAGES.RUSSIAN()} />
          </CardBody>
        </Card>
      )}
    </div>
  )
})
