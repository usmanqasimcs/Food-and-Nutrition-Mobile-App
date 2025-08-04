import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  surface: string;
  surfaceVariant: string;
  background: string;
  error: string;
  errorContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  onSurface: string;
  onSurfaceVariant: string;
  onBackground: string;
  onError: string;
  onErrorContainer: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

const lightTheme: ThemeColors = {
  primary: '#6750A4',
  primaryContainer: '#EADDFF',
  secondary: '#625B71',
  secondaryContainer: '#E8DEF8',
  surface: '#FFFBFE',
  surfaceVariant: '#E7E0EC',
  background: '#FFFBFE',
  error: '#B3261E',
  errorContainer: '#F9DEDC',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#21005D',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#1D192B',
  onSurface: '#1C1B1F',
  onSurfaceVariant: '#49454F',
  onBackground: '#1C1B1F',
  onError: '#FFFFFF',
  onErrorContainer: '#410E0B',
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',
};

const darkTheme: ThemeColors = {
  primary: '#D0BCFF',
  primaryContainer: '#4F378B',
  secondary: '#CCC2DC',
  secondaryContainer: '#4A4458',
  surface: '#1C1B1F',
  surfaceVariant: '#49454F',
  background: '#1C1B1F',
  error: '#F2B8B5',
  errorContainer: '#8C1D18',
  onPrimary: '#381E72',
  onPrimaryContainer: '#EADDFF',
  onSecondary: '#332D41',
  onSecondaryContainer: '#E8DEF8',
  onSurface: '#E6E1E5',
  onSurfaceVariant: '#CAC4D0',
  onBackground: '#E6E1E5',
  onError: '#601410',
  onErrorContainer: '#F9DEDC',
  outline: '#938F99',
  outlineVariant: '#49454F',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E6E1E5',
  inverseOnSurface: '#313033',
  inversePrimary: '#6750A4',
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('userTheme');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('userTheme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    colors,
    isDark,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
