import { useNavigate } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div
      id="not-found-screen"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mb-4 text-neutral-500 dark:text-neutral-400">
        <HelpCircle className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mb-6">
        The requested page or route does not exist.
      </p>
      <button
        id="not-found-home-btn"
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-sm font-semibold transition-colors shadow-sm"
      >
        <Home className="w-4 h-4" />
        <span>Return to Decks</span>
      </button>
    </div>
  );
}
