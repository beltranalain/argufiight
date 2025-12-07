import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownTimerProps {
  deadline: Date;
  onExpire?: () => void;
  showDays?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function CountdownTimer({
  deadline,
  onExpire,
  showDays = true,
  size = 'medium',
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

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

  if (!timeRemaining) {
    return null;
  }

  const isExpired = timeRemaining.total <= 0;
  const isUrgent = timeRemaining.total < 3600000; // Less than 1 hour

  const styles = getStyles(size, isExpired, isUrgent);

  if (isExpired) {
    return (
      <View style={styles.container}>
        <Text style={styles.expiredText}>Time's Up!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showDays && timeRemaining.days > 0 && (
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{timeRemaining.days}</Text>
          <Text style={styles.timeLabel}>d</Text>
        </View>
      )}
      <View style={styles.timeUnit}>
        <Text style={styles.timeValue}>
          {String(timeRemaining.hours).padStart(2, '0')}
        </Text>
        <Text style={styles.timeLabel}>h</Text>
      </View>
      <View style={styles.timeUnit}>
        <Text style={styles.timeValue}>
          {String(timeRemaining.minutes).padStart(2, '0')}
        </Text>
        <Text style={styles.timeLabel}>m</Text>
      </View>
      <View style={styles.timeUnit}>
        <Text style={styles.timeValue}>
          {String(timeRemaining.seconds).padStart(2, '0')}
        </Text>
        <Text style={styles.timeLabel}>s</Text>
      </View>
    </View>
  );
}

const getStyles = (size: 'small' | 'medium' | 'large', isExpired: boolean, isUrgent: boolean) => {
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
  const color = isExpired ? '#ff0000' : isUrgent ? '#ffaa00' : '#00aaff';

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
      color: color,
    },
    timeLabel: {
      fontSize: sizes.fontSize,
      color: '#888',
      marginTop: 2,
    },
    expiredText: {
      fontSize: sizes.valueSize,
      fontWeight: 'bold',
      color: '#ff0000',
    },
  });
};



