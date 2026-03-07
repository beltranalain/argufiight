import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { radius } from '../../theme/spacing';

type Variant = 'accent' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = 'accent',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const heights: Record<Size, number> = { sm: 36, md: 44, lg: 48 };
  const fontSizes: Record<Size, number> = { sm: 13, md: 15, lg: 15 };
  const paddings: Record<Size, number> = { sm: 12, md: 16, lg: 20 };

  const variantStyles: Record<Variant, { bg: ViewStyle; text: TextStyle }> = {
    accent: {
      bg: { backgroundColor: colors.accent },
      text: { color: colors.accentFg, fontWeight: '600' },
    },
    secondary: {
      bg: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
      text: { color: colors.text, fontWeight: '500' },
    },
    ghost: {
      bg: { backgroundColor: 'transparent' },
      text: { color: colors.text3, fontWeight: '500' },
    },
    danger: {
      bg: { backgroundColor: colors.red },
      text: { color: '#fff', fontWeight: '600' },
    },
    outline: {
      bg: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent },
      text: { color: colors.accent, fontWeight: '500' },
    },
  };

  const vs = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        { height: heights[size], paddingHorizontal: paddings[size], borderRadius: radius.md },
        vs.bg,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'accent' ? colors.accentFg : colors.text}
        />
      ) : (
        <>
          {icon}
          <Text style={[{ fontSize: fontSizes[size] }, vs.text]}>
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
