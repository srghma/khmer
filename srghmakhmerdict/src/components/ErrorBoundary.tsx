import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@heroui/button'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { BiErrorCircle } from 'react-icons/bi' // Assuming you have react-icons
import { HiRefresh } from 'react-icons/hi'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-default-50 p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="flex gap-3 pb-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                <BiErrorCircle size={24} />
              </div>
              <div className="flex flex-col">
                <p className="text-md font-bold text-danger">Application Error</p>
                <p className="text-small text-default-500">Something went wrong.</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="mb-4 text-small text-default-600">
                An unexpected error occurred. Please try reloading the application.
              </p>

              {/* Optional: Show technical error message in dev mode */}
              {this.state.error && (
                <div className="mb-4 max-h-32 overflow-y-auto rounded-md bg-default-100 p-2 font-mono text-tiny text-default-600">
                  {this.state.error.toString()}
                </div>
              )}

              <Button fullWidth color="primary" startContent={<HiRefresh />} variant="flat" onPress={this.handleReload}>
                Reload Application
              </Button>
            </CardBody>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
