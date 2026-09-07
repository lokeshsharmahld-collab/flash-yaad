import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div
      id="loading-state"
      className="py-16 flex flex-col items-center justify-center text-center"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-8 h-8 text-neutral-500 animate-spin mb-3" />
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
        {message}
      </p>
    </div>
  );
}
