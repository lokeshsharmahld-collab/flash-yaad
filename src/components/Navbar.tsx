import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { Flame, Layers, BarChart2, Settings, Trash2, Home } from 'lucide-react';
import { isStreakAtRisk } from '../lib/streak';

export const Navbar: React.FC = () => {
  const { state, today } = useAppState();
  const streak = state.streak;
  const streakAtRisk = isStreakAtRisk(streak, today);
  const trashCount = state.trash.decks.length + state.trash.cards.length;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <NavLink
          to="/"
          className="flex items-center gap-2.5 text-stone-900 dark:text-stone-50 font-bold text-lg tracking-tight focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 min-h-[44px]"
        >
          <span className="text-2xl" role="img" aria-label="Flashcard brain">🧠</span>
          <span>YaadKaro</span>
        </NavLink>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Streak pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              streak.current > 0
                ? streakAtRisk
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300 animate-pulse'
                  : 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 text-orange-600 dark:text-orange-400'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}
            title={streakAtRisk ? 'Streak at risk! Complete a review today to keep it active.' : `${streak.current} day streak`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streak.current}d</span>
          </div>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] min-w-[44px] justify-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`
            }
            title="Home"
          >
            <Home className="w-4 h-4" />
            <span className="hidden md:inline">Home</span>
          </NavLink>

          <NavLink
            to="/decks"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] min-w-[44px] justify-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`
            }
            title="Decks"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden md:inline">Decks</span>
          </NavLink>

          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] min-w-[44px] justify-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`
            }
            title="Progress & Stats"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden md:inline">Stats</span>
          </NavLink>

          {trashCount > 0 && (
            <NavLink
              to="/trash"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] min-w-[44px] justify-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`
              }
              title={`Trash (${trashCount})`}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs bg-stone-200 dark:bg-stone-700 px-1.5 py-0.5 rounded-full font-mono">
                {trashCount}
              </span>
            </NavLink>
          )}

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] min-w-[44px] justify-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`
            }
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
