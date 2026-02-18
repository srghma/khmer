import { Database } from 'bun:sqlite'
import * as fs from 'fs'
import * as path from 'path'
import { transliterateKhmerSegmentToRu } from './utils/generate-khmer-segments-to-ru-transliteration-automatic'
import type { Char } from './utils/char'
import type { TypedKhmerWord } from './utils/khmer-word'
import { consonantsGrid, vowelsGrid, supplementaryConsonants, independentVowels } from './utils/khmer-table-grid-data'
import { strToKhmerWord_remove_nonKhmerOnBothEnds_orUndefined } from './utils/khmer-word'
import { String_toNonEmptyString_orUndefined_afterTrim } from './utils/non-empty-string-trimmed'

const BASE_DIR = path.join(process.env.HOME!, 'projects/khmer/gemini-ocr-automate-images-upload-chrome-extension')
const USER_YAML_PATH = path.join(BASE_DIR, 'khmer-segments-to-ru-transliteration-user.yaml')

const YamlHelper = {
  parseUserFixes(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) return {}
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const dict: Record<string, string> = {}
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*"?([^":]+)"?:\s*"?([^"]+)"?/)
        if (match) dict[match[1]] = match[2]
      })
      return dict
    } catch {
      return {}
    }
  },
  stringifyUserFixes(dict: Record<string, string>): string {
    return Object.entries(dict)
      .sort()
      .map(([k, v]) => `"${k}": "${v}"`)
      .join('\n')
  },
}

export async function startKhmerSegmentEditor(db: Database, lengthGroups: Map<number, Map<Char, Set<TypedKhmerWord>>>) {
  const userFixes = YamlHelper.parseUserFixes(USER_YAML_PATH)

  console.error('🔍 Indexing example words for each segment...')
  const IS_VERIFIED_WHERE = `(Wiktionary IS NOT NULL OR from_csv_variants IS NOT NULL OR from_csv_nounForms IS NOT NULL OR from_csv_pronunciations IS NOT NULL OR from_csv_rawHtml IS NOT NULL OR from_chuon_nath IS NOT NULL OR from_russian_wiki IS NOT NULL OR en_km_com IS NOT NULL)`
  const words = db.query(`SELECT Word FROM km_Dict WHERE ${IS_VERIFIED_WHERE}`).all() as { Word: string }[]

  const segmentToWords = new Map<string, Set<string>>()
  const segmenter = new Intl.Segmenter('km', { granularity: 'grapheme' })

  for (const row of words) {
    const word = row.Word
    const word_ = strToKhmerWord_remove_nonKhmerOnBothEnds_orUndefined(word)
    if (!word_) continue
    for (const { segment } of segmenter.segment(word_)) {
      const s = String_toNonEmptyString_orUndefined_afterTrim(segment)
      if (!s) continue
      if (!segmentToWords.has(s)) segmentToWords.set(s, new Set())
      const set = segmentToWords.get(s)!
      if (set.size < 10) set.add(word)
    }
  }

  const segmentsData: any[] = []
  for (const [len, baseMap] of lengthGroups) {
    for (const [base, segments] of baseMap) {
      for (const seg of segments) {
        const sortedExamples = Array.from(segmentToWords.get(seg) || []).sort((a, b) => a.length - b.length)
        segmentsData.push({
          km: seg,
          base,
          len: Array.from(seg).length,
          ru_auto: transliterateKhmerSegmentToRu(seg),
          ru_user: userFixes[seg] || '',
          examples: sortedExamples,
        })
      }
    }
  }

  Bun.serve({
    port: 3000,
    async fetch(req) {
      const url = new URL(req.url)
      if (req.method === 'POST' && url.pathname === '/api/save') {
        const body = await req.json()
        const currentFixes = YamlHelper.parseUserFixes(USER_YAML_PATH)
        body.ru_user ? (currentFixes[body.km] = body.ru_user) : delete currentFixes[body.km]
        fs.writeFileSync(USER_YAML_PATH, YamlHelper.stringifyUserFixes(currentFixes))
        return new Response(JSON.stringify({ success: true }))
      }
      const gridData = { consonantsGrid, vowelsGrid, supplementaryConsonants, independentVowels }
      return new Response(generateHtml(segmentsData, gridData), { headers: { 'Content-Type': 'text/html' } })
    },
  })
  console.log(`🚀 Master Grid Editor: http://localhost:3000`)
}

function generateHtml(segments: any[], grids: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Khmer Master Grid</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Koh+Santepheap:wght@400;700;900&display=swap');
        body { font-family: 'Koh Santepheap', serif; background: white; margin: 0; padding: 0; }
        .km-text { font-size: 1.8rem; font-weight: 700; line-height: 1.2; }

        @media print {
            .no-print { display: none !important; }
            @page {
                size: 600mm 1500mm; /* Large canvas for single-page style */
                margin: 0;
            }
            body { width: 580mm; background: white; }
            .consonant-block { break-inside: avoid; page-break-inside: avoid; }
        }

        .tooltip-trigger .tooltip { display: none; }
        .tooltip-trigger:hover .tooltip { display: block; z-index: 9999; }
        .vowel-empty { background: #f8fafc; border: 1px dashed #e2e8f0; color: #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    </style>
</head>
<body class="p-8">
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useMemo } = React;

        const SegmentCard = ({ item, placeholder }) => {
            const [val, setVal] = useState(item?.ru_user || '');

            if (!item) {
                return (
                    <div className="vowel-empty w-full h-full">
                        <span className="opacity-60">{placeholder || '-'}</span>
                    </div>
                );
            }

            return (
                <div className={"relative group tooltip-trigger border p-1 h-full flex flex-col items-center justify-center bg-white shadow-sm " + (val ? "border-green-500 bg-green-50" : "border-slate-200")}>
                    <div className="km-text text-slate-900 leading-none mb-0.5">{item.km}</div>
                    <div className="text-[10px] text-blue-700 font-mono font-bold uppercase tracking-tighter leading-none">{item.ru_auto}</div>

                    <div className="tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-900 text-white text-[12px] rounded-xl shadow-2xl pointer-events-none border border-slate-700">
                        <div className="font-bold border-b border-slate-700 mb-2 pb-1 text-cyan-400">Verified Samples:</div>
                        <ul className="space-y-1">
                            {item.examples.length > 0
                                ? item.examples.map((ex, i) => <li key={i} className="whitespace-nowrap overflow-hidden text-ellipsis opacity-90 tracking-wide">• {ex}</li>)
                                : <li className="italic text-slate-500 text-center">No samples found</li>
                            }
                        </ul>
                    </div>
                </div>
            );
        };

        const ConsonantBox = ({ base, segments, vowelsGrid, hideStandardGrid }) => {
            const { standardMap, complexityGroups } = useMemo(() => {
                const standardMap = new Map();
                const complexityGroups = {};
                const flatVowels = vowelsGrid.flat().filter(Boolean);

                segments.forEach(s => {
                    const vowelPart = Array.from(s.km).slice(Array.from(base).length).join('');
                    if (flatVowels.includes(vowelPart)) {
                        standardMap.set(vowelPart, s);
                    } else {
                        const len = s.len;
                        if (!complexityGroups[len]) complexityGroups[len] = [];
                        complexityGroups[len].push(s);
                    }
                });
                return { standardMap, complexityGroups };
            }, [base, segments]);

            return (
                <div className="consonant-block border-2 border-slate-400 flex flex-col bg-white">
                    {/* Header */}
                    <div className="bg-slate-900 text-white text-center py-2 px-3 flex justify-between items-center shrink-0">
                        <span className="text-3xl font-black">{base}</span>
                        <span className="text-[10px] font-mono font-bold opacity-30 uppercase tracking-widest">U+{base.charCodeAt(0).toString(16)}</span>
                    </div>

                    {/* 5x5 Matrix (No flex-grow) */}
                    {!hideStandardGrid && (
                        <div className="grid grid-cols-5 border-b border-slate-200">
                            {vowelsGrid.flat().map((v, i) => (
                                <div key={i} className="border-r border-b border-slate-100 last:border-r-0 aspect-square">
                                    <SegmentCard item={standardMap.get(v)} placeholder={v} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Extras Section */}
                    <div className="p-1.5 space-y-3 bg-slate-50">
                        {Object.keys(complexityGroups).sort().map(len => (
                            <div key={len} className="flex flex-wrap gap-1 border-t border-slate-200 pt-1.5 first:border-0">
                                <span className="text-[9px] font-black text-slate-400 w-full mb-1 uppercase tracking-widest leading-none">{len} Chars</span>
                                {complexityGroups[len].map(s => (
                                    <div key={s.km} className="w-12 h-12"><SegmentCard item={s} /></div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        const App = () => {
            const [filter, setFilter] = useState('');
            const data = ${JSON.stringify(segments)};
            const grids = ${JSON.stringify(grids)};

            const renderGrid = (gridRows, title, isPhoneticBase = false) => (
                <div className="mb-24">
                    <h2 className="text-4xl font-black mb-8 border-b-8 border-slate-900 inline-block uppercase italic tracking-tighter bg-yellow-300 px-4">{title}</h2>
                    <div className="grid grid-cols-5 gap-0 border-l border-t border-slate-400">
                        {gridRows.flat().map((base, i) => {
                            if (!base) return <div key={i} className="bg-slate-200 border-r border-b border-slate-400"></div>;
                            const baseSegments = data.filter(s => s.base === base && (s.km.includes(filter) || s.ru_auto.includes(filter)));
                            return (
                                <div key={i} className="border-r border-b border-slate-400">
                                    <ConsonantBox
                                        base={base}
                                        segments={baseSegments}
                                        vowelsGrid={grids.vowelsGrid}
                                        hideStandardGrid={!isPhoneticBase}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            );

            return (
                <div className="w-full">
                    <div className="no-print mb-16 sticky top-0 bg-white/95 backdrop-blur-xl p-8 border-b-8 border-slate-900 z-[1000] flex justify-between items-center shadow-2xl">
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter text-slate-900">KHMER <span className="text-blue-600">PHONETIC</span></h1>
                            <p className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Found Graphemes & Samples</p>
                        </div>
                        <div className="flex gap-8 items-center">
                            <input
                                className="border-4 border-slate-900 rounded-2xl px-8 py-4 w-[500px] font-bold text-2xl outline-none focus:ring-8 ring-blue-100 transition-all"
                                placeholder="Search..."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                            <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-2xl hover:bg-blue-700 active:scale-95 shadow-lg">PRINT PDF</button>
                        </div>
                    </div>

                    {renderGrid(grids.consonantsGrid, "I. The 33 Consonants", true)}
                    {renderGrid([grids.independentVowels], "II. Independent Vowels", false)}
                    {renderGrid([grids.supplementaryConsonants], "III. Supplementary Consonants", false)}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
  `
}
