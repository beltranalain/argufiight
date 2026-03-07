import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  fallback: string;
  size?: AvatarSize;
  color?: string;
}

const SIZES: Record<AvatarSize, number> = {
  xs: 24,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 72,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  xs: 10,
  sm: 11,
  md: 14,
  lg: 18,
  xl: 24,
};

// Deterministic color from string
function hashColor(str: string): string {
  const palette = ['#ff4d4d', '#4dff91', '#4d9fff', '#ffcf4d', '#d4f050', '#ff8f4d'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ src, fallback, size = 'md', color }: AvatarProps) {
  const { colors } = useTheme();
  const dim = SIZES[size];
  const fontSize = FONT_SIZES[size];
  const initials = fallback.slice(0, 2).toUpperCase();
  const bgColor = color || hashColor(fallback);

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[styles.image, { width: dim, height: dim, borderRadius: dim / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bgColor + '20',
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize, color: bgColor }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
});
