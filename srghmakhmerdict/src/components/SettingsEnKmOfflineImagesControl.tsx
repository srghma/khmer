import { useState, useEffect } from 'react'
import { Switch } from '@heroui/switch'
import { Button } from '@heroui/button'
import { Progress } from '@heroui/progress'
import { MdOutlineCloudDownload, MdCheckCircle } from 'react-icons/md'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useAppToast } from '../providers/ToastProvider'
import { useSettings } from '../providers/SettingsProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useI18nContext } from '../i18n/i18n-react-custom'

interface ProgressPayload {
  percentage: number
  label: string
}

const MdOutlineCloudDownload_ = <MdOutlineCloudDownload className="text-lg" />

export const SettingsEnKmOfflineImagesControl = () => {
  const { LL } = useI18nContext()
  const { imageMode, setImageMode } = useSettings()
  const toast = useAppToast()

  const [hasOfflineAssets, setHasOfflineAssets] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusLabel, setStatusLabel] = useState('')

  // Check initial status
  useEffect(() => {
    invoke('check_offline_images_status')
      .then((count: unknown) => {
        if (typeof count !== 'number' && count !== null) {
          throw new Error(`unknown type ${typeof count} ${count}`)
        }

        setHasOfflineAssets(count)
      })
      .catch((e: unknown) =>
        toast.error(LL.OFFLINE.CHECK_FAILED() as unknown as NonEmptyStringTrimmed, unknown_to_errorMessage(e)),
      )
  }, [LL, toast])

  // Listen for progress events from Rust
  useEffect(() => {
    let unlisten: (() => void) | undefined

    const setupListener = async () => {
      unlisten = await listen<ProgressPayload>('download-progress', event => {
        setProgress(event.payload.percentage)
        setStatusLabel(event.payload.label)
      })
    }

    if (isDownloading) {
      setupListener()
    }

    return () => {
      if (unlisten) unlisten()
    }
  }, [isDownloading])

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      setProgress(0)
      setStatusLabel(LL.OFFLINE.STARTING_DOWNLOAD())

      // Now receives the count
      const count = await invoke('download_offline_images')

      if (typeof count !== 'number' && count !== null) {
        throw new Error(`unknown type ${typeof count} ${count}`)
      }

      if (count === null) {
        toast.error(LL.OFFLINE.NOT_DOWNLOADED() as unknown as NonEmptyStringTrimmed)
      } else if (count > 0) {
        setHasOfflineAssets(count)
        setImageMode('offline')
        toast.success(LL.OFFLINE.READY({ count }) as unknown as NonEmptyStringTrimmed)
      } else {
        toast.error(LL.OFFLINE.NO_FILES_FOUND() as unknown as NonEmptyStringTrimmed)
      }
    } catch (e: unknown) {
      toast.error(LL.OFFLINE.DOWNLOAD_FAILED() as unknown as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
    } finally {
      setIsDownloading(false)
      setProgress(0)
      setStatusLabel('')
    }
  }

  // Helper to check truthiness
  const isAvailable = hasOfflineAssets !== null && hasOfflineAssets > 0

  return (
    <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{LL.OFFLINE.TITLE()}</span>

      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{LL.OFFLINE.LABEL()}</span>
          <span className="text-xs text-default-400">
            {isAvailable ? LL.OFFLINE.HINT_AVAILABLE({ count: hasOfflineAssets! }) : LL.OFFLINE.HINT_NOT_AVAILABLE()}
          </span>
        </div>
        <Switch
          isDisabled={!isAvailable || isDownloading}
          isSelected={imageMode === 'offline'}
          size="sm"
          onValueChange={v => setImageMode(v ? 'offline' : 'online')}
        />
      </div>

      {!isAvailable && !isDownloading && (
        <Button
          className="w-full justify-start font-medium"
          color="primary"
          startContent={MdOutlineCloudDownload_}
          variant="flat"
          onPress={handleDownload}
        >
          {LL.OFFLINE.DOWNLOAD_BUTTON()}
        </Button>
      )}

      {isDownloading && (
        <div className="flex flex-col gap-2 w-full">
          <Progress
            aria-label={LL.OFFLINE.DOWNLOADING()}
            className="max-w-md"
            color={progress === 100 ? 'success' : 'primary'}
            showValueLabel={true}
            size="sm"
            value={progress}
          />
          <span className="text-xs text-default-500">{statusLabel}</span>
        </div>
      )}

      {isAvailable && !isDownloading && (
        <div className="flex items-center gap-2 text-xs text-success font-medium px-1">
          <MdCheckCircle className="text-sm" /> {LL.OFFLINE.ASSETS_AVAILABLE({ count: hasOfflineAssets! })}
        </div>
      )}
    </div>
  )
}
