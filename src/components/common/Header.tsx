import { NavLink } from 'react-router-dom';
import { Layers, BarChart3, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function Header() {
  const { theme, isDark, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <NavLink
          to="/"
          id="brand-logo-link"
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg py-1 px-1.5"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            <span>YK</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight">
              YaadKaro
            </span>
            <span className="text-[10px] font-medium tracking-wide uppercase text-neutral-500 dark:text-neutral-400">
              Leitner Flashcards
            </span>
          </div>
        </NavLink>

        {/* Navigation links & Theme toggle */}
        <div className="flex items-center gap-1 sm:gap-2">
          <nav id="desktop-nav" className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              id="nav-link-decks"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`
              }
            >
              <Layers className="w-4 h-4" />
              <span>Decks</span>
            </NavLink>

            <NavLink
              to="/stats"
              id="nav-link-stats"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`
              }
            >
              <BarChart3 className="w-4 h-4" />
              <span>Stats</span>
            </NavLink>

            <NavLink
              to="/settings"
              id="nav-link-settings"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`
              }
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </NavLink>
          </nav>

          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 mx-1 hidden sm:block" />

          {/* Dark Mode Toggle */}
          <button
            id="theme-toggle-button"
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
