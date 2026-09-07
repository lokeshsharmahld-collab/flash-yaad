import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { getDueCards, getStudyAheadCards } from '../lib/leitner';
import { Card, ReviewEvent } from '../lib/schema';
import { RotateCw, Check, X, Undo2, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SessionStats {
  reviewedCount: number;
  correctCount: number;
  promotedCount: number;
  masteredCount: number;
}

export const Review: React.FC = () => {
  const { state, isLoading, today, recordReview, undoReview } = useAppState();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isAheadMode = searchParams.get('mode') === 'ahead';
  const targetDeckId = searchParams.get('deckId');

  // Prepare card queue
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Undo tracking (single step)
  const [lastReviewedCard, setLastReviewedCard] = useState<{
    originalCard: Card;
    event?: ReviewEvent;
    index: number;
  } | null>(null);

  // Session stats
  const [stats, setStats] = useState<SessionStats>({
    reviewedCount: 0,
    correctCount: 0,
    promotedCount: 0,
    masteredCount: 0,
  });

  // Initialize queue once on mount
  useEffect(() => {
    let eligible = state.cards.filter((c) => c.deletedAt === null);
    if (targetDeckId) {
      eligible = eligible.filter((c) => c.deckId === targetDeckId);
    }

    const cardsToReview = isAheadMode
      ? getStudyAheadCards(eligible, today)
      : getDueCards(eligible, today, state.settings.dailyNewCardLimit);

    setQueue(cardsToReview);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(cardsToReview.length === 0);
  }, [isAheadMode, targetDeckId, state.settings.dailyNewCardLimit, today]);

  const currentCard = queue[currentIndex];

  // Safeguard: Check if card's deck was deleted mid-session
  useEffect(() => {
    if (currentCard) {
      const deckExists = state.decks.some((d) => d.id === currentCard.deckId && d.deletedAt === null);
      if (!deckExists) {
        console.warn('Card deck was deleted mid-session. Skipping card silently.');
        if (currentIndex + 1 < queue.length) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        } else {
          setIsCompleted(true);
        }
      }
    }
  }, [currentCard, state.decks, currentIndex, queue.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleAnswer = useCallback(
    (result: 'correct' | 'wrong') => {
      if (!currentCard) return;

      const previousBox = currentCard.box;
      const { updatedCard, mastered } = recordReview(currentCard.id, result);

      // Track last reviewed for undo
      setLastReviewedCard({
        originalCard: currentCard,
        index: currentIndex,
      });

      // Update session stats
      setStats((prev) => ({
        reviewedCount: prev.reviewedCount + 1,
        correctCount: prev.correctCount + (result === 'correct' ? 1 : 0),
        promotedCount: prev.promotedCount + (updatedCard.box > previousBox ? 1 : 0),
        masteredCount: prev.masteredCount + (mastered ? 1 : 0),
      }));

      // Fire confetti if mastered and motion not reduced
      if (mastered) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
      }

      // Advance
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        setIsCompleted(true);
      }
    },
    [currentCard, currentIndex, queue.length, recordReview]
  );

  const handleUndo = useCallback(() => {
    if (!lastReviewedCard) return;

    undoReview(lastReviewedCard.originalCard);
    setCurrentIndex(lastReviewedCard.index);
    setIsFlipped(true); // Return to flipped view of that card
    setLastReviewedCard(null);

    // Revert stats
    setStats((prev) => ({
      ...prev,
      reviewedCount: Math.max(0, prev.reviewedCount - 1),
    }));
  }, [lastReviewedCard, undoReview]);

  // Keyboard controls: Space=flip, 1=Forgot, 2=Got it, Z=undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (isCompleted || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === '1') {
        if (isFlipped) {
          e.preventDefault();
          handleAnswer('wrong');
        }
      } else if (e.key === '2') {
        if (isFlipped) {
          e.preventDefault();
          handleAnswer('correct');
        }
      } else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        if (lastReviewedCard) {
          e.preventDefault();
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompleted, currentCard, isFlipped, handleFlip, handleAnswer, handleUndo, lastReviewedCard]);

  // Deck info for badge
  const currentDeck = currentCard ? state.decks.find((d) => d.id === currentCard.deckId) : null;

  // Empty queue state
  if (!isLoading && queue.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl">
          🎉
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            Nothing due. Come back tomorrow.
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            You've completed all scheduled reviews for today. Spaced intervals ensure information settles into long-term memory.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/review?mode=ahead"
            className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 font-semibold text-sm rounded-xl transition-colors min-h-[44px] inline-flex items-center justify-center"
          >
            Study ahead (optional)
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-sm rounded-xl transition-colors min-h-[44px] inline-flex items-center justify-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Session summary upon completing all queue cards
  if (isCompleted) {
    const accuracy = stats.reviewedCount > 0 ? Math.round((stats.correctCount / stats.reviewedCount) * 100) : 100;

    return (
      <div className="max-w-md mx-auto py-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-4xl shadow-inner">
          <Trophy className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            Session Completed!
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Outstanding dedication to your spaced repetition goals.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-left shadow-xs">
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">Reviewed</span>
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.reviewedCount}</span>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">Accuracy</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{accuracy}%</span>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">Promoted</span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">+{stats.promotedCount}</span>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">Mastered (Box 5)</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">🏆 {stats.masteredCount}</span>
          </div>
        </div>

        {/* Streak summary */}
        <div className="p-4 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-xl flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <span className="font-bold text-orange-900 dark:text-orange-200 text-sm block">
                {state.streak.current} Day Streak!
              </span>
              <span className="text-xs text-orange-700 dark:text-orange-400">
                You studied today! Best: {state.streak.longest} days
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors min-h-[44px]"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Active Review Screen
  return (
    <div className="max-w-xl mx-auto space-y-5 pb-12">
      {/* Header bar: Back, deck title, progress, undo */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Exit review"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
            {currentDeck ? `${currentDeck.emoji} ${currentDeck.name}` : 'Review'}
          </span>
          <span className="text-sm font-extrabold font-mono text-stone-900 dark:text-stone-100">
            {currentIndex + 1} / {queue.length}
          </span>
        </div>

        <div>
          {lastReviewedCard && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
              title="Undo last card answer (Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}
        </div>
      </div>

      {/* Linear progress bar */}
      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
          style={{ width: `${Math.round(((currentIndex) / queue.length) * 100)}%` }}
        />
      </div>

      {/* The Flashcard (Interactive Flip) */}
      <div
        tabIndex={0}
        role="button"
        aria-label="Flashcard. Press Space or tap to flip"
        onClick={handleFlip}
        onKeyDown={(e) => {
          if (e.code === 'Space') {
            e.preventDefault();
            handleFlip();
          }
        }}
        className="w-full min-h-[280px] sm:min-h-[320px] bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between cursor-pointer focus:outline-hidden focus:ring-4 focus:ring-indigo-500/20 transition-all select-none"
      >
        {/* Top card metadata */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono">
            {isFlipped ? 'Answer (Back)' : 'Question (Front)'}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            Box {currentCard.box} / 5
          </span>
        </div>

        {/* Card Content - safely rendered text node preserving whitespace */}
        <div className="my-auto py-6 text-center">
          <p className="text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-50 leading-relaxed whitespace-pre-wrap break-words max-w-lg mx-auto">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>

        {/* Bottom card hint */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
          <RotateCw className="w-3.5 h-3.5" />
          <span>Tap or press Space to {isFlipped ? 'flip back' : 'flip answer'}</span>
        </div>
      </div>

      {/* Bottom Actions: Forgot vs Got It */}
      <div className="pt-2">
        {!isFlipped ? (
          <button
            type="button"
            onClick={handleFlip}
            className="w-full py-4 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-bold rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px]"
          >
            <RotateCw className="w-4 h-4" />
            <span>Show Answer (Space)</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => handleAnswer('wrong')}
              className="py-4 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-xs min-h-[48px]"
            >
              <X className="w-5 h-5" />
              <span>Forgot [1]</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnswer('correct')}
              className="py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-md min-h-[48px]"
            >
              <Check className="w-5 h-5" />
              <span>Got it [2]</span>
            </button>
          </div>
        )}
      </div>

      {/* Keyboard helper bar */}
      <div className="text-center text-xs text-stone-400 dark:text-stone-500 pt-2 hidden sm:block">
        Keyboard: <kbd className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded-md font-mono text-[11px]">Space</kbd> Flip &middot; <kbd className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded-md font-mono text-[11px]">1</kbd> Forgot &middot; <kbd className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded-md font-mono text-[11px]">2</kbd> Got it &middot; <kbd className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded-md font-mono text-[11px]">Z</kbd> Undo
      </div>
    </div>
  );
};
