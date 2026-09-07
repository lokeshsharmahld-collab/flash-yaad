import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  id?: string;
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  id = 'error-state',
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <div
      id={id}
      className="py-12 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto"
      role="alert"
    >
      <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center mb-3 text-rose-600 dark:text-rose-400">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5">
        {message}
      </p>
      {onRetry && (
        <button
          id={`${id}-retry-button`}
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs font-semibold transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}
