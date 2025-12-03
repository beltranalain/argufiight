import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface AnimatedCountdownTimerProps {
  deadline: Date;
  onExpire?: () => void;
  showDays?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function AnimatedCountdownTimer({
  deadline,
  onExpire,
  showDays = true,
  size = 'medium',
}: AnimatedCountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [colorValue, setColorValue] = useState('#00aaff');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        });
        if (onExpire) {
          onExpire();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  useEffect(() => {
    if (!timeRemaining) return;

    const isUrgent = timeRemaining.total < 3600000; // Less than 1 hour
    const isCritical = timeRemaining.total < 300000; // Less than 5 minutes

    // Stop any existing animations first
    pulseAnim.stopAnimation();
    shakeAnim.stopAnimation();

    if (isCritical) {
      // Reset values before starting new animations
      pulseAnim.setValue(1);
      shakeAnim.setValue(0);

      // Aggressive pulsing and shaking when critical
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const shake = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: -5,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 5,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ])
      );
      shake.start();

      setColorValue('#ff0000'); // Red for critical

      return () => {
        pulse.stop();
        shake.stop();
        pulseAnim.stopAnimation();
        shakeAnim.stopAnimation();
      };
    } else if (isUrgent) {
      // Reset values before starting new animations
      pulseAnim.setValue(1);
      shakeAnim.setValue(0);

      // Gentle pulsing when urgent
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      setColorValue('#ffaa00'); // Orange for urgent

      return () => {
        pulse.stop();
        pulseAnim.stopAnimation();
        shakeAnim.stopAnimation();
      };
    } else {
      // Reset animations
      pulseAnim.stopAnimation();
      shakeAnim.stopAnimation();
      pulseAnim.setValue(1);
      shakeAnim.setValue(0);
      setColorValue('#00aaff'); // Blue for normal
    }
  }, [timeRemaining?.total]);

  if (!timeRemaining) {
    return null;
  }

  const isExpired = timeRemaining.total <= 0;
  const isUrgent = timeRemaining.total < 3600000;
  const isCritical = timeRemaining.total < 300000;

  const styles = getStyles(size, isExpired, isUrgent, isCritical);

  if (isExpired) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={[styles.expiredText, { color: '#ff0000' }]}>Time's Up!</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: pulseAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
    >
      {showDays && timeRemaining.days > 0 && (
        <View style={styles.timeUnit}>
          <Text style={[styles.timeValue, { color: colorValue }]}>
            {timeRemaining.days}
          </Text>
          <Text style={styles.timeLabel}>d</Text>
        </View>
      )}
      <View style={styles.timeUnit}>
        <Text style={[styles.timeValue, { color: colorValue }]}>
          {String(timeRemaining.hours).padStart(2, '0')}
        </Text>
        <Text style={styles.timeLabel}>h</Text>
      </View>
      <View style={styles.timeUnit}>
        <Text style={[styles.timeValue, { color: colorValue }]}>
          {String(timeRemaining.minutes).padStart(2, '0')}
        </Text>
        <Text style={styles.timeLabel}>m</Text>
      </View>
      <View style={styles.timeUnit}>
        <Text style={[styles.timeValue, { color: colorValue }]}>
          {String(timeRemaining.seconds).padStart(2, '0')}
        </Text>
        <Text style={styles.timeLabel}>s</Text>
      </View>
    </Animated.View>
  );
}

const getStyles = (
  size: 'small' | 'medium' | 'large',
  isExpired: boolean,
  isUrgent: boolean,
  isCritical: boolean
) => {
  const sizeMap = {
    small: {
      fontSize: 12,
      valueSize: 16,
      containerGap: 4,
      padding: 4,
    },
    medium: {
      fontSize: 14,
      valueSize: 20,
      containerGap: 8,
      padding: 8,
    },
    large: {
      fontSize: 16,
      valueSize: 24,
      containerGap: 12,
      padding: 12,
    },
  };

  const sizes = sizeMap[size];

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.containerGap,
      padding: sizes.padding,
    },
    timeUnit: {
      alignItems: 'center',
      minWidth: sizes.valueSize + 8,
    },
    timeValue: {
      fontSize: sizes.valueSize,
      fontWeight: 'bold',
    },
    timeLabel: {
      fontSize: sizes.fontSize,
      color: '#888',
      marginTop: 2,
    },
    expiredText: {
      fontSize: sizes.valueSize,
      fontWeight: 'bold',
    },
  });
};

