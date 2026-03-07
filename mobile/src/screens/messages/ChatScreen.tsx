import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { messagesApi } from '../../api/messages';
import { useAuthStore } from '../../store/authStore';
import { timeAgo } from '../../utils/notifications';

export function ChatScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { id, username } = route.params;
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const { data } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => messagesApi.getMessages(id),
    refetchInterval: 5000,
  });

  const messages = Array.isArray(data) ? data : data?.messages ?? [];

  const sendMutation = useMutation({
    mutationFn: (content: string) => messagesApi.sendMessage(id, content),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat', id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  function handleSend() {
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{username}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={messages}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          inverted
          renderItem={({ item }: any) => {
            const isMine = item.senderId === userId;
            return (
              <View style={[styles.bubbleWrap, { alignItems: isMine ? 'flex-end' : 'flex-start' }]}>
                <View style={[
                  styles.bubble,
                  isMine
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                ]}>
                  <Text style={{ color: isMine ? colors.accentFg : colors.text, fontSize: 14 }}>{item.content}</Text>
                </View>
                {item.createdAt && (
                  <Text style={{ color: colors.text3, fontSize: 10, marginTop: 2 }}>{timeAgo(item.createdAt)}</Text>
                )}
              </View>
            );
          }}
        />

        <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.text3}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            style={[styles.sendBtn, { backgroundColor: message.trim() ? colors.accent : colors.surface2 }]}
          >
            <Send size={18} color={message.trim() ? colors.accentFg : colors.text3} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '500' },
  bubbleWrap: { marginBottom: 4 },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, height: 40, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
