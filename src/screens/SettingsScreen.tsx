import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, HardDrive, ShieldCheck } from 'lucide-react';
import { AppSettings, ThemeMode, ViewState } from '../types';
import { storage } from '../lib/storage';
import { useTheme } from '../hooks/useTheme';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadSettings = async () => {
    setViewState('loading');
    setErrorMessage('');
    try {
      const data = await storage.getSettings();
      setSettings(data);
      setViewState('normal');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load app settings.';
      setErrorMessage(msg);
      setViewState('error');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleThemeChange = async (mode: ThemeMode) => {
    setTheme(mode);
    if (settings) {
      setSettings({ ...settings, theme: mode });
    }
  };

  return (
    <div id="settings-screen" className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Settings
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
          Manage application theme, local storage, and study preferences
        </p>
      </div>

      {viewState === 'loading' && (
        <LoadingState message="Loading preferences..." />
      )}

      {viewState === 'error' && (
        <ErrorState
          id="settings-error-state"
          title="Error Loading Settings"
          message={errorMessage}
          onRetry={loadSettings}
        />
      )}

      {viewState === 'normal' && (
        <div className="space-y-6">
          {/* Appearance Section */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              Appearance
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Select your preferred color theme or match system settings
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                id="theme-btn-light"
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-2 transition-all ${
                  theme === 'light'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                id="theme-btn-dark"
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-2 transition-all ${
                  theme === 'dark'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-400" />
                <span>Dark</span>
              </button>

              <button
                id="theme-btn-system"
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-2 transition-all ${
                  theme === 'system'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Monitor className="w-5 h-5 text-neutral-500" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Privacy & Storage Section */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Offline-First Local Storage
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  All flashcard decks, cards, and Leitner review intervals are stored directly in your browser using IndexedDB. No account or cloud sync required.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% Client-Side Privacy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
