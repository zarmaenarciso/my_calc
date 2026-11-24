import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled application error:', error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900/60 dark:bg-slate-900">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {this.state.errorMessage}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button onClick={this.handleReset}>Try again</Button>
              <Button
                variant="secondary"
                onClick={() => window.location.assign('/')}
              >
                Reload app
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
