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
  primary: '#6200EE',
  primaryContainer: '#E3C5FF',
  secondary: '#03DAC6',
  secondaryContainer: '#CCFFF5',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  background: '#FAFAFA',
  error: '#B00020',
  errorContainer: '#FDEAEA',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#2D006B',
  onSecondary: '#000000',
  onSecondaryContainer: '#00201C',
  onSurface: '#000000',
  onSurfaceVariant: '#424242',
  onBackground: '#000000',
  onError: '#FFFFFF',
  onErrorContainer: '#370B0B',
  outline: '#757575',
  outlineVariant: '#E0E0E0',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2E2E2E',
  inverseOnSurface: '#F1F1F1',
  inversePrimary: '#BB86FC',
};

const darkTheme: ThemeColors = {
  primary: '#BB86FC',
  primaryContainer: '#3700B3',
  secondary: '#03DAC6',
  secondaryContainer: '#018786',
  surface: '#121212',
  surfaceVariant: '#1E1E1E',
  background: '#000000',
  error: '#CF6679',
  errorContainer: '#B00020',
  onPrimary: '#000000',
  onPrimaryContainer: '#FFFFFF',
  onSecondary: '#000000',
  onSecondaryContainer: '#000000',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#E0E0E0',
  onBackground: '#FFFFFF',
  onError: '#000000',
  onErrorContainer: '#FFFFFF',
  outline: '#404040',
  outlineVariant: '#2A2A2A',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#FFFFFF',
  inverseOnSurface: '#000000',
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
