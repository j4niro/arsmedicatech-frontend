import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * ThemeContext provides a simple way to switch between light and dark themes.
 *
 * The current theme is persisted to localStorage so the user's preference
 * survives page reloads. A CSS class of `dark` is toggled on the document's
 * root element, which allows Tailwind's dark mode variants (and any custom
 * styles targeting `.dark`) to take effect. See `tailwind.config.js` for
 * configuration.
 */
export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  /** The current active theme */
  theme: Theme;
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
  /** Explicitly set a theme */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialise theme from localStorage if available, defaulting to light
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return 'light';
  });

  /**
   * Update both local state and localStorage when the theme is changed.
   *
   * Persisting to localStorage ensures the preference is remembered across
   * page reloads and sessions.
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', newTheme);
    }
  };

  /** Toggle between dark and light themes */
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Whenever the theme changes, update the `dark` class on the root element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to consume the ThemeContext. Throws an error if used outside a provider.
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};