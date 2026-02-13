import React, { memo, useCallback } from 'react'
import { Button } from '@heroui/button'
import { HiArrowLeft } from 'react-icons/hi2'
import { useDictionary } from '../providers/DictionaryProvider'
import { KhmerComplexTableContent } from './KhmerComplexTableModal/KhmerComplexTableContent'

export const KhmerComplexTableView: React.FC = memo(() => {
  const { km_map } = useDictionary()

  const handleBack = useCallback(() => {
    window.history.back()
  }, [])

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex shrink-0 items-center p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider pt-[calc(1rem+env(safe-area-inset-top))]">
        <Button isIconOnly className="mr-3 text-default-500 -ml-2" variant="light" onPress={handleBack}>
          <HiArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Khmer Complex Table</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{km_map && <KhmerComplexTableContent wordsMap={km_map} />}</div>
    </div>
  )
})

KhmerComplexTableView.displayName = 'KhmerComplexTableView'
