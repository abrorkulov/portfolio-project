import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card relative overflow-hidden rounded-2xl border border-red-500/20 p-8 text-center bg-void/80 backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                {this.props.fallbackTitle || 'Component Execution Halted'}
              </h3>
              <p className="mt-1 max-w-md font-mono text-xs text-ink-muted">
                {this.state.error?.message || 'An unexpected rendering error occurred in this section.'}
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 font-mono text-xs font-medium text-red-400 border border-red-500/30 transition-all hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reboot Component
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
