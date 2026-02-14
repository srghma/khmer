import React, { memo, useCallback } from 'react'
import { Button } from '@heroui/button'
import { Link } from '@heroui/link'
import { FaGithub, FaDollarSign, FaSearchPlus } from 'react-icons/fa'
import { SiGooglepay } from 'react-icons/si'
import { GoStar } from 'react-icons/go'
import { HiArrowLeft } from 'react-icons/hi2'
import { requestReview } from '@gbyte/tauri-plugin-in-app-review'

import { useIap } from '../../providers/IapProvider'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import type { TranslationFunctions } from '../../i18n/i18n-types'

const SuccessModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { LL }: { LL: TranslationFunctions } = useI18nContext()
  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Modal backdrop="blur" isOpen={isOpen} size="xs" onOpenChange={onClose}>
      <ModalContent className="bg-gradient-to-br from-success-50 to-white dark:from-success-900/20 dark:to-background border border-success-200">
        <ModalHeader className="flex flex-col gap-1 items-center pb-0">
          <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center text-white text-3xl mb-2 shadow-lg shadow-success-200 animate-bounce">
            🎉
          </div>
          <h1 className="text-xl font-bold text-success-700">{LL.ABOUT.SUCCESS_MODAL.TITLE()}</h1>
        </ModalHeader>
        <ModalBody className="text-center py-4">
          <p className="text-default-700 font-medium">{LL.ABOUT.SUCCESS_MODAL.BODY_1()}</p>
          <p className="text-sm text-default-500 mt-2 italic">{LL.ABOUT.SUCCESS_MODAL.BODY_2()}</p>
        </ModalBody>
        <ModalFooter className="flex flex-col gap-2 pb-6 px-6">
          <Button className="w-full font-bold shadow-md h-12 text-base" color="success" onPress={handleSuccess}>
            {LL.ABOUT.SUCCESS_MODAL.BUTTON_YES()}
          </Button>
          <Button className="w-full font-medium" color="danger" variant="light" onPress={onClose}>
            {LL.ABOUT.SUCCESS_MODAL.BUTTON_NO()}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
})

SuccessModal.displayName = 'SuccessModal'

const CancellationModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { LL }: { LL: TranslationFunctions } = useI18nContext()

  return (
    <Modal backdrop="blur" isOpen={isOpen} size="xs" onOpenChange={onClose}>
      <ModalContent className="bg-gradient-to-br from-danger-50 to-white dark:from-danger-900/20 dark:to-background border border-danger-200">
        <ModalHeader className="flex flex-col gap-1 items-center pb-0">
          <div className="w-16 h-16 bg-danger-500 rounded-full flex items-center justify-center text-white text-3xl mb-2 shadow-lg shadow-danger-200">
            😢
          </div>
          <h1 className="text-xl font-bold text-danger-700">{LL.ABOUT.CANCELLATION_MODAL.TITLE()}</h1>
        </ModalHeader>
        <ModalBody className="text-center py-4">
          <p className="text-default-700 font-medium">{LL.ABOUT.CANCELLATION_MODAL.BODY()}</p>
        </ModalBody>
        <ModalFooter className="flex flex-col gap-2 pb-6 px-6">
          <Button className="w-full font-bold shadow-md h-12 text-base" color="danger" onPress={onClose}>
            {LL.ABOUT.CANCELLATION_MODAL.BUTTON()}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
})

CancellationModal.displayName = 'CancellationModal'

export const AboutView: React.FC = memo(() => {
  const { LL }: { LL: TranslationFunctions } = useI18nContext()
  const { handlePurchase, isPurchasing } = useIap()
  const successDisclosure = useDisclosure()
  const cancellationDisclosure = useDisclosure()

  const handleDonate = useCallback(async () => {
    // For simplicity, we choose a medium tier or could show a selection
    const success = await handlePurchase('donation_medium')

    if (success) {
      successDisclosure.onOpen()
    } else {
      cancellationDisclosure.onOpen()
    }
  }, [handlePurchase, successDisclosure, cancellationDisclosure])

  const handleReview = useCallback(async () => {
    await requestReview()
  }, [])

  const handleBack = useCallback(() => {
    window.history.back()
  }, [])

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in slide-in-from-right duration-200">
      <SuccessModal isOpen={successDisclosure.isOpen} onClose={successDisclosure.onClose} />
      <CancellationModal isOpen={cancellationDisclosure.isOpen} onClose={cancellationDisclosure.onClose} />
      {/* Header */}
      <div className="flex shrink-0 items-center p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider pt-[calc(1rem+env(safe-area-inset-top))]">
        <Button isIconOnly className="mr-3 text-default-500 -ml-2" variant="light" onPress={handleBack}>
          <HiArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">{LL.ABOUT.TITLE()}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FaGithub className="text-2xl text-default-600" />
              <h2 className="text-xl font-bold">{LL.ABOUT.DEVELOPER_INFO()}</h2>
            </div>
            <p
              dangerouslySetInnerHTML={{ __html: LL.ABOUT.DEV_SECTION.NAME() }}
              className="text-default-700 leading-relaxed"
            />
            <p
              dangerouslySetInnerHTML={{ __html: LL.ABOUT.DEV_SECTION.GITHUB() }}
              className="text-default-700 leading-relaxed"
            />
            <p
              dangerouslySetInnerHTML={{ __html: LL.ABOUT.DEV_SECTION.SOURCE_CODE() }}
              className="text-default-700 leading-relaxed"
            />
          </section>

          <section className="bg-primary-50/50 dark:bg-primary-900/10 p-6 rounded-2xl border border-primary-100 dark:border-primary-900/30 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FaSearchPlus className="text-8xl -rotate-12" />
            </div>
            <div className="text-default-700 leading-relaxed mb-4 text-base flex flex-col gap-2">
              <p dangerouslySetInnerHTML={{ __html: LL.ABOUT.PRESENTATION_SECTION.BODY_1() }} />
              <p dangerouslySetInnerHTML={{ __html: LL.ABOUT.PRESENTATION_SECTION.BODY_2() }} />
              <p dangerouslySetInnerHTML={{ __html: LL.ABOUT.PRESENTATION_SECTION.BODY_3() }} />
            </div>
            <Button
              isExternal
              showAnchorIcon
              as={Link}
              className="bg-primary text-white font-bold"
              href="https://docs.google.com/presentation/d/1x1WXcqXbxWo-Nj3lzXgcSBTdmV-8Ohs9lGZDlfMI76g?usp=sharing"
              variant="shadow"
            >
              {LL.ABOUT.PRESENTATION_SECTION.BUTTON()}
            </Button>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-default-400 uppercase tracking-widest">{LL.ABOUT.HELP_PROJECT()}</h3>
            <p className="text-default-700">{LL.ABOUT.OCR_SECTION.TITLE()}</p>
            {/* <div className="bg-default-50 dark:bg-default-900/50 p-4 rounded-xl border border-default-200">
              <ul className="list-disc list-inside text-sm text-default-600 flex flex-col gap-2">
                <li>{LL.ABOUT.OCR_SECTION.FILE_1()}</li>
                <li>{LL.ABOUT.OCR_SECTION.FILE_2()}</li>
              </ul>
            </div> */}
          </section>

          <section className="flex flex-col gap-4 pt-4 border-t border-divider">
            <h3 className="text-base font-bold text-foreground">{LL.ABOUT.SUPPORT_DEVELOPMENT()}</h3>
            <div className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-900/10 p-6 rounded-2xl border border-warning-200 dark:border-warning-900/30 flex flex-col items-center gap-4 text-center">
              <div className="p-3 bg-white dark:bg-warning-900/30 rounded-full shadow-sm">
                <FaDollarSign className="text-3xl text-warning-500" />
              </div>
              <div>
                <p className="font-bold text-lg mb-1">{LL.SETTINGS.ACTIONS.DONATE()}</p>
                <p className="text-sm text-default-600">{LL.ABOUT.DONATE_SUBTITLE()}</p>
              </div>
              <Button
                className="w-full max-w-xs font-bold"
                color="warning"
                endContent={<SiGooglepay className="text-2xl" />}
                isLoading={isPurchasing}
                size="lg"
                variant="shadow"
                onPress={handleDonate}
              >
                {LL.SETTINGS.ACTIONS.DONATE()}
              </Button>
              <Button
                className="w-full max-w-xs font-bold"
                color="default"
                endContent={<GoStar className="text-2xl" />}
                size="lg"
                variant="flat"
                onPress={handleReview}
              >
                {LL.ABOUT.RATE_APP()}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
})

AboutView.displayName = 'AboutView'
