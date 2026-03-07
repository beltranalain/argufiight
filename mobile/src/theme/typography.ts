import { TextStyle } from 'react-native';

export const fontFamily = {
  light: 'Inter_200Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const typography: Record<string, TextStyle> = {
  display: {
    fontSize: 32,
    fontFamily: fontFamily.light,
    letterSpacing: -1.5,
    lineHeight: 38,
  },
  heading1: {
    fontSize: 25,
    fontFamily: fontFamily.medium,
    letterSpacing: -0.25,
    lineHeight: 32,
  },
  heading2: {
    fontSize: 19,
    fontFamily: fontFamily.medium,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 15,
    fontFamily: fontFamily.medium,
    lineHeight: 22,
  },
  small: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    lineHeight: 18,
  },
  smallMedium: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    lineHeight: 14,
  },
};
