/**
 * Loading skeleton component for better UX
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function LoadingSkeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: LoadingSkeletonProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface DebateCardSkeletonProps {
  count?: number;
}

export function DebateCardSkeleton({ count = 3 }: DebateCardSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.cardHeader}>
            <LoadingSkeleton width={60} height={16} />
            <LoadingSkeleton width={80} height={16} />
          </View>
          <LoadingSkeleton width="100%" height={24} borderRadius={8} style={styles.marginTop} />
          <LoadingSkeleton width="80%" height={16} borderRadius={4} style={styles.marginTop} />
          <View style={styles.cardFooter}>
            <LoadingSkeleton width={100} height={16} />
            <LoadingSkeleton width={60} height={16} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#222',
  },
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  marginTop: {
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});



