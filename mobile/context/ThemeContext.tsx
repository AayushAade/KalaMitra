import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { LightColors, DarkColors, ThemeColors, setThemeMode } from '../constants/theme';

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
  colors: LightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setThemeMode(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      setThemeMode(next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    setIsDarkMode(enabled);
    setThemeMode(enabled ? 'dark' : 'light');
  }, []);

  const colors = isDarkMode ? DarkColors : LightColors;

  const value = useMemo(
    () => ({ isDarkMode, toggleDarkMode, setDarkMode, colors }),
    [isDarkMode, toggleDarkMode, setDarkMode, colors]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
