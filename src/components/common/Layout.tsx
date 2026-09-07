import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ErrorBoundary } from './ErrorBoundary';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <Header />
      <main className="flex-1 w-full">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="border-t border-neutral-200 dark:border-neutral-800/80 py-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
        <div className="max-w-5xl mx-auto px-4">
          <span>YaadKaro • Leitner Spaced Repetition Flashcards</span>
        </div>
      </footer>
    </div>
  );
}
