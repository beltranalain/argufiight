import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface UserFollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'small' | 'medium' | 'large';
}

export default function UserFollowButton({
  userId,
  initialFollowing = false,
  onFollowChange,
  size = 'medium',
}: UserFollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  const handleToggleFollow = async () => {
    if (!user || user.id === userId) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/users/follow?userId=${userId}`);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await api.post('/users/follow', { userId });
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error: any) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === userId) {
    return null;
  }

  const styles = getStyles(size);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFollowing ? styles.buttonFollowing : styles.buttonNotFollowing,
      ]}
      onPress={handleToggleFollow}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFollowing ? '#fff' : '#000'}
        />
      ) : (
        <>
          <Ionicons
            name={isFollowing ? 'checkmark' : 'add'}
            size={size === 'small' ? 14 : size === 'large' ? 20 : 16}
            color={isFollowing ? '#fff' : '#000'}
          />
          <Text
            style={[
              styles.buttonText,
              isFollowing ? styles.buttonTextFollowing : styles.buttonTextNotFollowing,
            ]}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (size: 'small' | 'medium' | 'large') => {
  const sizeMap = {
    small: {
      padding: 6,
      fontSize: 12,
      iconSize: 14,
    },
    medium: {
      padding: 10,
      fontSize: 14,
      iconSize: 16,
    },
    large: {
      padding: 12,
      fontSize: 16,
      iconSize: 20,
    },
  };

  const sizes = sizeMap[size];

  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingHorizontal: sizes.padding * 1.5,
      paddingVertical: sizes.padding,
      gap: 6,
      minWidth: 80,
    },
    buttonFollowing: {
      backgroundColor: '#333',
      borderWidth: 1,
      borderColor: '#555',
    },
    buttonNotFollowing: {
      backgroundColor: '#fff',
    },
    buttonText: {
      fontSize: sizes.fontSize,
      fontWeight: '600',
    },
    buttonTextFollowing: {
      color: '#fff',
    },
    buttonTextNotFollowing: {
      color: '#000',
    },
  });
};






