import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@heroui/button'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { BiErrorCircle } from 'react-icons/bi'
import { HiRefresh } from 'react-icons/hi'
import { useI18nContext } from '../i18n/i18n-react-custom'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

const GlobalErrorBoundaryFallback = ({ error, handleReload }: { error: Error | null; handleReload: () => void }) => {
  const { LL } = useI18nContext()

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-default-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex gap-3 pb-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
            <BiErrorCircle size={24} />
          </div>
          <div className="flex flex-col">
            <p className="text-md font-bold text-danger">{LL.ERROR_BOUNDARY.TITLE()}</p>
            <p className="text-small text-default-500">{LL.ERROR_BOUNDARY.SUBTITLE()}</p>
          </div>
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-small text-default-600">{LL.ERROR_BOUNDARY.BODY()}</p>

          {error && (
            <div className="mb-4 max-h-32 overflow-y-auto rounded-md bg-default-100 p-2 font-mono text-tiny text-default-600">
              {error.toString()}
            </div>
          )}

          <Button fullWidth color="primary" startContent={<HiRefresh />} variant="flat" onPress={handleReload}>
            {LL.ERROR_BOUNDARY.RELOAD_BUTTON()}
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  private handleReload = () => {
    window.location.reload()
  }

  public override render() {
    if (this.state.hasError) {
      return <GlobalErrorBoundaryFallback error={this.state.error} handleReload={this.handleReload} />
    }

    return this.props.children
  }
}
