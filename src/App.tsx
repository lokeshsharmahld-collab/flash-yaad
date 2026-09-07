import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider, useAppState } from './hooks/useAppState';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { StorageBanner } from './components/StorageBanner';
import { BackupNudgeModal } from './components/BackupNudgeModal';
import { QuotaExceededModal } from './components/QuotaExceededModal';

// Screens
import { Home } from './screens/Home';
import { Review } from './screens/Review';
import { Decks } from './screens/Decks';
import { DeckDetail } from './screens/DeckDetail';
import { Stats } from './screens/Stats';
import { Trash } from './screens/Trash';
import { Settings } from './screens/Settings';

const ThemeManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAppState();

  useEffect(() => {
    const root = document.documentElement;
    const theme = state.settings.theme;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [state.settings.theme]);

  return <>{children}</>;
};

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <StorageBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/review" element={<Review />} />
          <Route path="/decks" element={<Decks />} />
          <Route path="/decks/:deckId" element={<DeckDetail />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BackupNudgeModal />
      <QuotaExceededModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <ThemeManager>
          <HashRouter>
            <MainLayout />
          </HashRouter>
        </ThemeManager>
      </AppStateProvider>
    </ErrorBoundary>
  );
}
