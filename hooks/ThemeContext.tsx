import { THEME, ThemeName } from '@/constants/Colors';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

// 'system' = segue o SO, 'light' = claro, 'dark' = escuro
export type AppTheme = ThemeName | 'system';

interface ThemeContextProps {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  resolved: ThemeName;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'system',
  setTheme: () => {},
  resolved: 'dark',
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setTheme] = useState<AppTheme>('system');
  const [resolved, setResolved] = useState<ThemeName>('dark');

  useEffect(() => {
    if (theme === 'system') {
      const colorScheme = Appearance.getColorScheme() as ThemeName | null;
      setResolved(colorScheme ?? 'dark');
      const listener = Appearance.addChangeListener(({ colorScheme }) => {
        setResolved((colorScheme as ThemeName) ?? 'dark');
      });
      return () => listener.remove();
    } else {
      setResolved(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useAppTheme() {
  return useContext(ThemeContext);
}

// Hook para obter as cores do tema resolvido
export function useThemeColors() {
  const { resolved } = useAppTheme();
  return THEME[resolved];
}
