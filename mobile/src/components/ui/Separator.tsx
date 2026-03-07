import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface SeparatorProps {
  text?: string;
}

export function Separator({ text }: SeparatorProps) {
  const { colors } = useTheme();

  if (text) {
    return (
      <View style={styles.withText}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text style={[styles.text, { color: colors.text3 }]}>{text}</Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return <View style={[styles.line, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  line: {
    flex: 1,
    height: 1,
  },
  withText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  text: {
    fontSize: 13,
  },
});
