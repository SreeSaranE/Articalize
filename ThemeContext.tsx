import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextProps {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  currentColorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'auto',
  setTheme: () => {},
  currentColorScheme: 'light',
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('auto');
  const colorScheme = Appearance.getColorScheme();

  const getCurrentColorScheme = () => {
    if (theme === 'auto') {
      return colorScheme ?? 'light';
    }
    return theme;
  };

  useEffect(() => {
    const listener = Appearance.addChangeListener(() => {
      if (theme === 'auto') {
        // Re-render on system theme change
      }
    });
    return () => listener.remove();
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentColorScheme: getCurrentColorScheme(),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
