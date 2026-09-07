import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import { Deck, ViewState } from '../types';
import { storage } from '../lib/storage';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export function StatsScreen() {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadStats = async () => {
    setViewState('loading');
    setErrorMessage('');
    try {
      const storedDecks = await storage.getDecks();
      setDecks(storedDecks);
      setViewState(storedDecks.length === 0 ? 'empty' : 'normal');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading statistics.';
      setErrorMessage(msg);
      setViewState('error');
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const totalCards = decks.reduce((acc, d) => acc + (d.cardCount || 0), 0);
  const totalDue = decks.reduce((acc, d) => acc + (d.dueCount || 0), 0);

  return (
    <div id="stats-screen" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Learning Statistics
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
          Track Leitner 5-box distribution and spaced repetition mastery
        </p>
      </div>

      {/* 4 State Handling */}
      {viewState === 'loading' && (
        <LoadingState message="Calculating Leitner box metrics..." />
      )}

      {viewState === 'empty' && (
        <EmptyState
          id="stats-empty-state"
          icon={BarChart3}
          title="No Learning Data Yet"
          description="Create decks and review cards to generate spaced repetition charts and retention stats."
        />
      )}

      {viewState === 'error' && (
        <ErrorState
          id="stats-error-state"
          title="Failed to Load Statistics"
          message={errorMessage}
          onRetry={loadStats}
        />
      )}

      {viewState === 'normal' && (
        <div id="stats-summary" className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Decks</span>
                <Layers className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {decks.length}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Cards</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {totalCards}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Cards Due</span>
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {totalDue}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              5-Box Leitner Distribution
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Detailed Recharts visualizations and retention analytics will be activated in Phase 4.
            </p>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[1, 2, 3, 4, 5].map((box) => (
                <div
                  key={box}
                  className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-3"
                >
                  <span className="block font-semibold text-neutral-700 dark:text-neutral-300">
                    Box {box}
                  </span>
                  <span className="text-neutral-400 text-[10px] block mt-0.5">
                    {box === 1 && 'Daily'}
                    {box === 2 && '3 Days'}
                    {box === 3 && 'Weekly'}
                    {box === 4 && '14 Days'}
                    {box === 5 && '30 Days'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
