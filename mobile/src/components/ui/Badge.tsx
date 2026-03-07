import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type BadgeColor = 'accent' | 'red' | 'green' | 'blue' | 'amber' | 'muted';

interface BadgeProps {
  children: string;
  color?: BadgeColor;
}

export function Badge({ children, color = 'muted' }: BadgeProps) {
  const { colors } = useTheme();

  const colorMap: Record<BadgeColor, { bg: string; text: string }> = {
    accent: { bg: colors.accent + '15', text: colors.accent },
    red: { bg: colors.redMuted, text: colors.red },
    green: { bg: colors.greenMuted, text: colors.green },
    blue: { bg: colors.blueMuted, text: colors.blue },
    amber: { bg: colors.amberMuted, text: colors.amber },
    muted: { bg: colors.surface2, text: colors.text3 },
  };

  const c = colorMap[color];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
