import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CommentInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  placeholder?: string;
  replyingTo?: string;
  onCancelReply?: () => void;
}

export default function CommentInput({
  value,
  onChangeText,
  onSubmit,
  submitting = false,
  placeholder = 'Add a comment...',
  replyingTo,
  onCancelReply,
}: CommentInputProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      {replyingTo && (
        <View style={styles.replyingToContainer}>
          <Text style={styles.replyingToText}>Replying to {replyingTo}</Text>
          <TouchableOpacity onPress={onCancelReply}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          multiline
          textAlignVertical="top"
          autoCorrect={true}
          autoCapitalize="sentences"
          selectionColor="#00aaff"
          cursorColor="#00aaff"
          underlineColorAndroid="transparent"
          keyboardAppearance="dark"
          editable={!submitting}
          returnKeyType="default"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!value.trim() || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={!value.trim() || submitting}
        >
          {submitting ? (
            <Ionicons name="hourglass-outline" size={20} color="#666" />
          ) : (
            <Ionicons name="send" size={20} color={value.trim() ? '#fff' : '#666'} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  replyingToText: {
    color: '#888',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#333',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00aaff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
  },
});


