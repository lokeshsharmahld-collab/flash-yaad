import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { getDueCards, getStudyAheadCards } from '../lib/leitner';
import { isStreakAtRisk } from '../lib/streak';
import { Flame, CheckCircle2, Play, Plus, BookOpen, Layers, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { STARTER_DECKS } from '../data/starterDecks';
import { differenceInDays, parseISO } from 'date-fns';

export const Home: React.FC = () => {
  const { state, isLoading, today, loadStarterDeck, addDeck } = useAppState();
  const navigate = useNavigate();
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckEmoji, setNewDeckEmoji] = useState('📚');
  const [starterLoading, setStarterLoading] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          <div className="h-28 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
          <div className="h-28 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
          <div className="h-28 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
        </div>
        <div className="h-16 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
        <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
      </div>
    );
  }

  const activeDecks = state.decks.filter((d) => d.deletedAt === null);
  const activeCards = state.cards.filter((c) => c.deletedAt === null);
  const dueCards = getDueCards(activeCards, today, state.settings.dailyNewCardLimit);
  const studyAheadList = getStudyAheadCards(activeCards, today);
  const masteredCards = activeCards.filter((c) => c.box === 5);

  const streak = state.streak;
  const streakAtRisk = isStreakAtRisk(streak, today);

  // Backup status
  let backupLabel = 'No backup yet';
  let backupColorClass = 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800';

  if (state.settings.lastBackupAt) {
    try {
      const days = differenceInDays(new Date(), parseISO(state.settings.lastBackupAt));
      if (days === 0) {
        backupLabel = 'Backup: today';
        backupColorClass = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800';
      } else if (days <= 7) {
        backupLabel = `Backup: ${days}d ago`;
        backupColorClass = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800';
      } else if (days <= 14) {
        backupLabel = `Backup: ${days}d ago`;
        backupColorClass = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800';
      } else {
        backupLabel = `Backup: ${days}d ago (Due!)`;
        backupColorClass = 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800';
      }
    } catch {
      backupLabel = 'Backup recorded';
    }
  }

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    const deck = addDeck(newDeckName.trim(), newDeckEmoji || '📚');
    setNewDeckName('');
    setShowDeckModal(false);
    navigate(`/decks/${deck.id}`);
  };

  const handleLoadStarter = (starterId: string) => {
    setStarterLoading(starterId);
    setTimeout(() => {
      const result = loadStarterDeck(starterId);
      setStarterLoading(null);
      if (result) {
        navigate(`/decks/${result.deck.id}`);
      }
    }, 100);
  };

  // Onboarding screen if no active decks exist
  if (activeDecks.length === 0) {
    return (
      <div className="py-6 space-y-8 max-w-2xl mx-auto text-center">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-4xl shadow-inner mx-auto mb-2">
            🧠
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
            Welcome to YaadKaro
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Retain 10x more with scientific 5-box Leitner spaced repetition. 100% offline, zero sign-up, your cards stay on your device.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowDeckModal(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Create my first deck
          </button>
        </div>

        {/* Starter deck suggestions */}
        <div className="pt-8 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Or load a curated starter deck (offline):
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STARTER_DECKS.map((starter) => (
              <div
                key={starter.id}
                className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between shadow-xs text-left"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{starter.emoji}</span>
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                      {starter.name}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">
                    {starter.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800/60">
                  <span className="text-xs font-mono text-stone-500">
                    {starter.cards.length} cards
                  </span>
                  <button
                    type="button"
                    disabled={starterLoading === starter.id}
                    onClick={() => handleLoadStarter(starter.id)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 min-h-[36px]"
                  >
                    {starterLoading === starter.id ? 'Loading...' : 'Load Deck'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for creating first deck */}
        {showDeckModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 text-left">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Create New Deck</h2>
              <form onSubmit={handleCreateDeck} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Emoji Icon
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newDeckEmoji}
                    onChange={(e) => setNewDeckEmoji(e.target.value)}
                    className="w-16 text-center text-2xl p-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Deck Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="e.g. UPSC Modern History, React Hooks..."
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeckModal(false)}
                    className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newDeckName.trim()}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Create Deck
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal Home Dashboard
  return (
    <div className="space-y-6 pb-12">
      {/* Top row: 3 Key Metrics + Backup pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Daily Study Dashboard
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Local date: <span className="font-mono font-medium">{today}</span>
          </p>
        </div>

        <Link
          to="/settings"
          className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-85 ${backupColorClass}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{backupLabel}</span>
        </Link>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Due Today */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
              Due Today
            </span>
            <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">
              {dueCards.length}
            </span>
            <p className="text-xs text-stone-500 mt-1">
              Cards ready for review
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Streak */}
        <div
          className={`bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
            streakAtRisk
              ? 'border-amber-400 dark:border-amber-600/80 ring-2 ring-amber-400/20'
              : 'border-stone-200 dark:border-stone-800'
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1 flex items-center gap-1">
              Current Streak
              {streakAtRisk && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold" title="At risk today">
                  (At Risk!)
                </span>
              )}
            </span>
            <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 flex items-center gap-1.5">
              🔥 {streak.current}
              <span className="text-sm font-normal text-stone-500">days</span>
            </span>
            <p className="text-xs text-stone-500 mt-1">
              Best: {streak.longest} days
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl">
            <Flame className="w-6 h-6 fill-current" />
          </div>
        </div>

        {/* Mastered */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
              Mastered (Box 5)
            </span>
            <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">
              {masteredCards.length}
            </span>
            <p className="text-xs text-stone-500 mt-1">
              {activeCards.length > 0
                ? `${Math.round((masteredCards.length / activeCards.length) * 100)}% of total cards`
                : 'No cards yet'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Big Action: Start Review / All Done */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            {dueCards.length > 0
              ? `You have ${dueCards.length} card${dueCards.length > 1 ? 's' : ''} to review today`
              : 'All done for today 🎉'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            {dueCards.length > 0
              ? 'Short, focused intervals build permanent long-term memory.'
              : 'Great job maintaining your cadence! You can relax or study ahead.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          {dueCards.length > 0 ? (
            <Link
              to="/review"
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Review ({dueCards.length})</span>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                disabled
                className="w-full sm:w-auto px-6 py-3 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 rounded-xl font-semibold text-sm cursor-not-allowed min-h-[44px]"
              >
                All done for today 🎉
              </button>
              {studyAheadList.length > 0 && (
                <Link
                  to="/review?mode=ahead"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-2"
                >
                  Study ahead ({studyAheadList.length} cards)
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Deck List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-500" />
            Your Decks ({activeDecks.length})
          </h2>
          <Link
            to="/decks"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Manage all
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeDecks.slice(0, 4).map((deck) => {
            const deckCards = activeCards.filter((c) => c.deckId === deck.id);
            const deckDue = getDueCards(deckCards, today, state.settings.dailyNewCardLimit);

            return (
              <Link
                key={deck.id}
                to={`/decks/${deck.id}`}
                className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-1 bg-stone-50 dark:bg-stone-800/80 rounded-xl">
                    {deck.emoji}
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {deck.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {deckCards.length} card{deckCards.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {deckDue.length > 0 ? (
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg">
                      {deckDue.length} due
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400">0 due</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
