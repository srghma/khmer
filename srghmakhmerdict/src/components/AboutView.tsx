import React, { memo, useCallback } from 'react'
import { Button } from '@heroui/button'
import { Link } from '@heroui/link'
import { FaGithub, FaDollarSign, FaSearchPlus } from 'react-icons/fa'
import { SiGooglepay } from 'react-icons/si'
import { HiArrowLeft } from 'react-icons/hi2'

export const AboutView: React.FC = memo(() => {
  const handleDonate = useCallback(() => {
    alert('Google Pay donation integration would go here (requires native plugin setup).')
  }, [])

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
        <h1 className="text-xl font-bold">About Khmer Dictionary</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FaGithub className="text-2xl text-default-600" />
              <h2 className="text-xl font-bold">Developer Info</h2>
            </div>
            <p className="text-default-700 leading-relaxed">
              My name is <strong className="text-foreground">Serhii Khoma</strong>. My github is{' '}
              <Link isExternal className="font-semibold" href="https://github.com/srghma" showAnchorIcon>
                srghma
              </Link>
              .
            </p>
            <p className="text-default-700 leading-relaxed">
              The source code for this dictionary is open source and available at{' '}
              <Link isExternal className="font-semibold" href="https://github.com/srghma/khmer" showAnchorIcon>
                github.com/srghma/khmer
              </Link>
            </p>
          </section>

          <section className="bg-primary-50/50 dark:bg-primary-900/10 p-6 rounded-2xl border border-primary-100 dark:border-primary-900/30 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FaSearchPlus className="text-8xl -rotate-12" />
            </div>
            <h3 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4">Evolutionary Origin</h3>
            <p className="text-default-700 leading-relaxed mb-4 text-base">
              I also know how humans have appeared in the universe from (autocatalyst ={'>'} molecular robot). You can
              read about it in my detailed presentation.
            </p>
            <Button
              as={Link}
              isExternal
              className="bg-primary text-white font-bold"
              href="https://docs.google.com/presentation/d/1x1WXcqXbxWo-Nj3lzXgcSBTdmV-8Ohs9lGZDlfMI76g?usp=sharing"
              showAnchorIcon
              variant="shadow"
            >
              View Full Presentation
            </Button>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-default-400 uppercase tracking-widest">Help the Project</h3>
            <p className="text-default-700">
              You can help significantly by assisting with OCRing of the following dictionary files:
            </p>
            <div className="bg-default-50 dark:bg-default-900/50 p-4 rounded-xl border border-default-200">
              <ul className="list-disc list-inside text-sm text-default-600 flex flex-col gap-2">
                <li>Краткий русско-кхмерский словарь.pdf</li>
                <li>Кхмерско-русский словарь-Горгониев.pdf</li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-4 pt-4 border-t border-divider">
            <h3 className="text-base font-bold text-foreground">Support Development</h3>
            <div className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-900/10 p-6 rounded-2xl border border-warning-200 dark:border-warning-900/30 flex flex-col items-center gap-4 text-center">
              <div className="p-3 bg-white dark:bg-warning-900/30 rounded-full shadow-sm">
                <FaDollarSign className="text-3xl text-warning-500" />
              </div>
              <div>
                <p className="font-bold text-lg mb-1">Make a Donation</p>
                <p className="text-sm text-default-600">Support my work using Google Pay</p>
              </div>
              <Button
                className="w-full max-w-xs font-bold"
                color="warning"
                endContent={<SiGooglepay className="text-2xl" />}
                size="lg"
                variant="shadow"
                onPress={handleDonate}
              >
                Donate
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
})

AboutView.displayName = 'AboutView'
