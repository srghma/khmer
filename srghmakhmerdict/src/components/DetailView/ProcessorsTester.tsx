import React from 'react'
import { processors as enProcessors } from '../../utils/WordDetailEn_OnlyKhmerAndWithoutHtml'
import { processors as ruProcessors } from '../../utils/WordDetailRu_OnlyKhmerAndWithoutHtml'
import { processors as kmProcessors } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import type { DetailSectionsProps } from './DetailSectionsProps'
import { useI18nContext } from '../../i18n/i18n-react-custom'

const fieldsToTest = [
  'desc',
  'desc_en_only',
  'en_km_com',
  'from_csv_raw_html',
  'from_csv_variants',
  'from_csv_noun_forms',
  'from_csv_pronunciations',
  'wiktionary',
  'from_russian_wiki',
  'gorgoniev',
  'from_chuon_nath',
  'from_chuon_nath_translated',
] as const

export const ProcessorsTester: React.FC<DetailSectionsProps> = props => {
  const { LL } = useI18nContext()

  return (
    <div className="p-4 border-2 border-dashed border-divider rounded-lg mt-8 mb-8 bg-content1/30">
      <h2 className="text-xl font-bold mb-4">{LL.DETAIL.TESTER.TITLE()}</h2>
      <div className="space-y-6">
        {fieldsToTest.map(field => {
          const value = props[field]

          if (value === undefined) return null

          // Find processors that handle this field
          const enProc = (enProcessors as any)[field]
          const ruProc = (ruProcessors as any)[field]
          const kmProc = (kmProcessors as any)[field]

          if (!enProc && !ruProc && !kmProc) return null

          return (
            <div key={field} className="border-b border-divider pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-mono">{field}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs text-default-400 uppercase tracking-wider font-semibold">
                    {LL.DETAIL.TESTER.ORIGINAL_VALUE()}
                  </div>
                  <pre className="text-xs bg-content2 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
                <div className="space-y-3">
                  <div className="text-xs text-default-400 uppercase tracking-wider font-semibold">
                    {LL.DETAIL.TESTER.PROCESSED_RESULTS()}
                  </div>
                  {enProc && (
                    <div className="text-xs">
                      <span className="font-bold text-blue-500 mr-2">EN:</span>
                      <code className="bg-blue-500/10 p-1 rounded">
                        {JSON.stringify(enProc(value as any)) || (
                          <span className="text-default-300 italic">undefined</span>
                        )}
                      </code>
                    </div>
                  )}
                  {ruProc && (
                    <div className="text-xs">
                      <span className="font-bold text-red-500 mr-2">RU:</span>
                      <code className="bg-red-500/10 p-1 rounded">
                        {JSON.stringify(ruProc(value as any)) || (
                          <span className="text-default-300 italic">undefined</span>
                        )}
                      </code>
                    </div>
                  )}
                  {kmProc && (
                    <div className="text-xs">
                      <span className="font-bold text-green-500 mr-2">KM:</span>
                      <code className="bg-green-500/10 p-1 rounded">
                        {JSON.stringify(kmProc(value as any)) || (
                          <span className="text-default-300 italic">undefined</span>
                        )}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
