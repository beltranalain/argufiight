/**
 * ArguFight Design System — Colors
 * Mapped from app/globals.css CSS custom properties
 */

export const colors = {
  dark: {
    bg: '#0c0c0c',
    surface: '#141414',
    surface2: '#1c1c1c',
    surface3: '#242424',
    border: '#2a2a2a',
    border2: '#363636',
    text: '#e8e8e8',
    text2: '#909090',
    text3: '#525252',
    accent: '#d4f050',
    accent2: '#c2e040',
    accentFg: '#0c0c0c',
    red: '#ff4d4d',
    redMuted: 'rgba(255, 77, 77, 0.12)',
    green: '#4dff91',
    greenMuted: 'rgba(77, 255, 145, 0.12)',
    blue: '#4d9fff',
    blueMuted: 'rgba(77, 159, 255, 0.12)',
    amber: '#ffcf4d',
    amberMuted: 'rgba(255, 207, 77, 0.12)',
  },
  light: {
    bg: '#fafafa',
    surface: '#ffffff',
    surface2: '#f4f4f5',
    surface3: '#eeeeef',
    border: '#e4e4e7',
    border2: '#d4d4d8',
    text: '#111111',
    text2: '#52525b',
    text3: '#a1a1aa',
    accent: '#5f9900',
    accent2: '#4e8000',
    accentFg: '#ffffff',
    red: '#dc2626',
    redMuted: 'rgba(220, 38, 38, 0.1)',
    green: '#16a34a',
    greenMuted: 'rgba(22, 163, 74, 0.1)',
    blue: '#2563eb',
    blueMuted: 'rgba(37, 99, 235, 0.1)',
    amber: '#d97706',
    amberMuted: 'rgba(217, 119, 6, 0.1)',
  },
};

export type ThemeColors = (typeof colors)['dark'];
export type ThemeMode = 'dark' | 'light';
