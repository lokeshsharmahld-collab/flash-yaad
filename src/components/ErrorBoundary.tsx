import { Component, ErrorInfo, ReactNode } from 'react';
import { exportFullData } from '../lib/exportImport';
import { createInitialState } from '../lib/schema';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Readonly<Props>;

  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in YaadKaro ErrorBoundary:', error, errorInfo);
  }

  private handleExport = () => {
    try {
      const raw = localStorage.getItem('yaadkaro_state');
      if (raw) {
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yaadkaro-crash-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        exportFullData(createInitialState());
      }
    } catch {
      alert('Unable to extract raw data. Please reload the application.');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                An unexpected error occurred. Your data is safe in offline storage. You can export a copy before reloading.
              </p>
              {this.state.error && (
                <p className="text-xs font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 p-3 rounded-lg overflow-x-auto text-left">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleExport}
                className="flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl font-medium text-sm transition-colors"
              >
                Export my data
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm transition-colors"
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
