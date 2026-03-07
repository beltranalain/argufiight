import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme';

export function LoadingScreen() {
  const { colors } = useTheme();
  const barWidth = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in text
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Animate bar fill
    Animated.loop(
      Animated.sequence([
        Animated.timing(barWidth, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(barWidth, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const animatedBarWidth = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={[styles.logo, { color: colors.text }]}>
          ARGU<Text style={{ color: colors.accent }}>FIGHT</Text>
        </Text>
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.barFill,
              { backgroundColor: colors.accent, width: animatedBarWidth },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 6,
    marginBottom: 20,
  },
  barTrack: {
    width: 48,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 1,
  },
});
