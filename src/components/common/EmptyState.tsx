import { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  id?: string;
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  id = 'empty-state',
  icon: Icon = Inbox,
  emoji,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      id={id}
      className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto"
    >
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-4 text-neutral-500 dark:text-neutral-400">
        {emoji ? (
          <span className="text-2xl" role="img" aria-label={title}>
            {emoji}
          </span>
        ) : (
          <Icon className="w-7 h-7" aria-hidden="true" />
        )}
      </div>
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
