import React, { createContext, useContext } from 'react';
import { colors, ThemeColors, ThemeMode } from './colors';

export { colors, type ThemeColors, type ThemeMode } from './colors';
export { spacing, radius } from './spacing';
export { typography, fontFamily } from './typography';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: colors.dark,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}
