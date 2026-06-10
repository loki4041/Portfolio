import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

export const Palettes = {
  light: {
    background: '#F6F7FB',
    card: '#FFFFFF',
    cardAlt: '#EEF0F6',
    text: '#16181D',
    textSecondary: '#5C6370',
    border: '#E3E6EE',
    accent: '#4F6DF5',
    accentSoft: '#E4E9FE',
    success: '#23A26D',
    warning: '#E8930C',
    danger: '#E0484E',
    water: '#2D9CDB',
    steps: '#23A26D',
    study: '#9B51E0',
  },
  dark: {
    background: '#0E1014',
    card: '#1A1D24',
    cardAlt: '#23272F',
    text: '#F2F4F8',
    textSecondary: '#9AA1AD',
    border: '#2A2E37',
    accent: '#7C92FF',
    accentSoft: '#27304F',
    success: '#3DD68C',
    warning: '#F2B33D',
    danger: '#F26D72',
    water: '#56B6F0',
    steps: '#3DD68C',
    study: '#BB86FC',
  },
} as const;

export type Palette = (typeof Palettes)['light'] | (typeof Palettes)['dark'];

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'trackmate.themeMode';

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const resolved: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo(
    () => ({ mode, resolved, colors: Palettes[resolved], setMode }),
    [mode, resolved]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside ThemeModeProvider');
  return ctx;
}
