import { type ValidNonNegativeInt } from './utils/toNumber'

export type PopupDomainState = {
  aiStudio_isDriveIframeOpened: boolean
  aiStudio_filesUploaded: ValidNonNegativeInt
  aiStudio_isGenerating: boolean
  drive_selectedFiles: string[] | undefined // will be undefined if aiStudio_isDriveIframeOpened=false or if aiStudio_isDriveIframeOpened=true but modal is loading
  drive_allVisibleFiles: string[] | undefined // will be undefined if aiStudio_isDriveIframeOpened=false or if aiStudio_isDriveIframeOpened=true but modal is loading
}
