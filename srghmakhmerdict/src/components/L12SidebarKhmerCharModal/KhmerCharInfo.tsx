import React from 'react'
import { Chip } from '@heroui/chip'
import type { KhmerCharDefinition } from '../../utils/khmer-lookup'

const Row = React.memo(({ label, value, code }: { label: string; value: React.ReactNode; code?: boolean }) => (
  <div className="flex justify-between items-center py-2 border-b border-divider last:border-none">
    <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</span>
    <span className={`text-sm text-foreground ${code ? 'font-mono bg-default-100 px-1 rounded' : ''}`}>{value}</span>
  </div>
))

Row.displayName = 'KhmerCharInfoRow'

const SeriesBadge = React.memo(({ series }: { series: 'a' | 'o' }) => (
  <Chip className="capitalize" color={series === 'a' ? 'primary' : 'secondary'} size="sm" variant="flat">
    Series {series.toUpperCase()}
  </Chip>
))

SeriesBadge.displayName = 'KhmerCharInfoSeriesBadge'

export const KhmerCharInfo: React.FC<{ data: KhmerCharDefinition }> = React.memo(({ data }) => {
  switch (data.type) {
    case 'consonant':
      return (
        <div className="flex flex-col">
          <div className="mb-2">
            <SeriesBadge series={data.def.series} />
          </div>
          <Row label="Name / Trans" value={data.def.trans} />
          <Row code label="IPA" value={`/${data.def.ipa}/`} />
        </div>
      )

    case 'extra_consonant':
      return (
        <div className="flex flex-col">
          <div className="mb-2">
            <SeriesBadge series={data.def.series} />
          </div>
          <Row label="Description" value={data.def.desc} />
          <Row label="Transliteration" value={data.def.trans} />
          <Row code label="IPA" value={`/${data.def.ipa}/`} />
        </div>
      )

    case 'vowel':
      return (
        <div className="flex flex-col">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-primary font-bold">Series A</span>
              <Row label="Trans" value={data.def.trans_a} />
              <Row code label="IPA" value={`/${data.def.ipa_a}/`} />
            </div>
            <div>
              <span className="text-xs text-secondary font-bold">Series O</span>
              <Row label="Trans" value={data.def.trans_o} />
              <Row code label="IPA" value={`/${data.def.ipa_o}/`} />
            </div>
          </div>
        </div>
      )

    case 'independent_vowel':
      return (
        <div className="flex flex-col">
          <Row label="Description" value={data.def.desc} />
          <Row label="Transliteration" value={data.def.trans} />
          <Row code label="IPA" value={`/${data.def.ipa}/`} />
        </div>
      )

    case 'diacritic':
      return (
        <div className="flex flex-col">
          <Row label="Name" value={<span className="font-khmer">{data.def.name}</span>} />
          <div className="py-2">
            <span className="text-xs font-semibold text-default-500 uppercase tracking-wider block mb-1">
              Description
            </span>
            <p className="text-sm text-foreground/80 leading-relaxed">{data.def.desc}</p>
          </div>
          <div className="py-2">
            <span className="text-xs font-semibold text-default-500 uppercase tracking-wider block mb-1">English</span>
            <p className="text-sm text-foreground/80 leading-relaxed italic">{data.def.desc_en}</p>
          </div>
        </div>
      )

    case 'vowel_combination':
      return (
        <div className="flex flex-col">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-primary font-bold">Series A</span>
              <Row label="Trans" value={data.def.trans_a} />
              <Row code label="IPA" value={`/${data.def.ipa_a}/`} />
            </div>
            <div>
              <span className="text-xs text-secondary font-bold">Series O</span>
              <Row label="Trans" value={data.def.trans_o} />
              <Row code label="IPA" value={`/${data.def.ipa_o}/`} />
            </div>
          </div>
        </div>
      )

    case 'number':
      return (
        <div className="flex flex-col">
          <Row label="Value" value={data.def.value} />
        </div>
      )

    case 'punctuation':
      return (
        <div className="flex flex-col">
          <Row label="Name" value={data.def.name} />
          <div className="py-2">
            <p className="text-sm text-foreground/80">{data.def.desc}</p>
          </div>
        </div>
      )

    case 'lunar':
      return (
        <div className="flex flex-col">
          <Row label="Name" value={data.def.name} />
          <Row label="Desc" value={data.def.desc} />
        </div>
      )

    case 'special_group':
      return <div className="text-default-500 italic py-4 text-center">{data.label}</div>

    case 'unknown':
    default:
      return <div className="text-default-400 italic">No details available for {data.label}</div>
  }
})

KhmerCharInfo.displayName = 'KhmerCharInfo'
