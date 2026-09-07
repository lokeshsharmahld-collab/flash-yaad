import { useState, useEffect, useCallback } from 'react';
import { ThemeMode } from '../types';
import { storage } from '../lib/storage';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = mode === 'dark' || (mode === 'system' && systemPrefersDark);

    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setIsDark(shouldBeDark);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadTheme() {
      try {
        const settings = await storage.getSettings();
        if (isMounted) {
          setThemeState(settings.theme);
          applyTheme(settings.theme);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load theme preference:', err);
        if (isMounted) {
          applyTheme('system');
          setIsLoaded(true);
        }
      }
    }

    loadTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      isMounted = false;
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]);

  const setTheme = useCallback(async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      const currentSettings = await storage.getSettings();
      await storage.saveSettings({ ...currentSettings, theme: newTheme });
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    }
  }, [applyTheme]);

  return { theme, isDark, isLoaded, setTheme };
}
