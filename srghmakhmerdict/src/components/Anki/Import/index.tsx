import { useState, memo } from 'react'
import { Textarea, Button, Card, CardBody, CardHeader } from '@heroui/react'
import { importWordsToAnki, type ImportResult } from '../../../db/favorite/anki_import'
import { useFavorites } from '../../../providers/FavoritesProvider'
import { useI18nContext } from '../../../i18n/i18n-react-custom'
import type { DictionaryLanguage } from '../../../types'

const SummarySection = ({ title, data }: { title: string; data: ImportResult[DictionaryLanguage] }) => {
  const { LL } = useI18nContext()

  if (data.success === 0 && data.skipped === 0 && data.notFound.length === 0) return null

  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-bold text-lg">{title}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-success">{LL.ANKI.IMPORT.SUCCESS()}:</span>
        <span className="font-mono font-bold text-right">{data.success}</span>
        <span className="text-warning">{LL.ANKI.IMPORT.SKIPPED()}:</span>
        <span className="font-mono font-bold text-right">{data.skipped}</span>
        <span className="text-danger">{LL.ANKI.IMPORT.NOT_FOUND()}:</span>
        <span className="font-mono font-bold text-right">{data.notFound.length}</span>
      </div>
      {data.notFound.length > 0 && (
        <div className="mt-2 p-2 bg-danger/10 text-danger rounded text-xs break-words">{data.notFound.join(', ')}</div>
      )}
    </div>
  )
}

export const AnkiImport = memo(() => {
  const [input, setInput] = useState('')
  const [summary, setSummary] = useState<ImportResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { refreshFavorites } = useFavorites()
  const { LL } = useI18nContext()

  const handleImport = async () => {
    setIsLoading(true)
    try {
      const res = await importWordsToAnki(input)

      setSummary(res)
      await refreshFavorites()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Textarea
        classNames={{
          input: 'font-mono text-sm leading-relaxed',
          label: 'font-bold text-default-700 mb-2',
        }}
        label={LL.ANKI.IMPORT.TITLE()}
        labelPlacement="outside"
        maxRows={15}
        minRows={8}
        placeholder={LL.ANKI.IMPORT.PLACEHOLDER()}
        value={input}
        variant="flat"
        onValueChange={setInput}
      />
      <Button
        className="font-black uppercase tracking-wider shadow-lg shadow-primary/20"
        color="primary"
        isDisabled={!input.trim()}
        isLoading={isLoading}
        size="lg"
        onPress={handleImport}
      >
        {LL.ANKI.IMPORT.BUTTON()}
      </Button>

      {summary && (
        <Card className="border border-success/20 bg-success-50/5" shadow="sm">
          <CardHeader className="px-6 pt-6 pb-0">
            <h2 className="text-xl font-black uppercase tracking-tight text-success-600">
              {LL.ANKI.IMPORT.SUMMARY_TITLE()}
            </h2>
          </CardHeader>
          <CardBody className="gap-8 px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SummarySection data={summary.en} title={LL.ANKI.LANGUAGES.ENGLISH()} />
              <SummarySection data={summary.km} title={LL.ANKI.LANGUAGES.KHMER()} />
              <SummarySection data={summary.ru} title={LL.ANKI.LANGUAGES.RUSSIAN()} />
            </div>
          </CardBody>
        </Card>
      )}
    </>
  )
})

AnkiImport.displayName = 'AnkiImport'
