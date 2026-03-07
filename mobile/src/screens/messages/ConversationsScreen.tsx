import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { messagesApi } from '../../api/messages';
import { timeAgo } from '../../utils/notifications';

export function ConversationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
  });

  const conversations = Array.isArray(data) ? data : data?.conversations ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onRefresh={refetch}
        refreshing={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>{[1, 2, 3].map((i) => <Skeleton key={i} height={56} />)}</View>
          ) : (
            <Text style={{ color: colors.text3, textAlign: 'center', marginTop: 40 }}>No conversations yet</Text>
          )
        }
        renderItem={({ item }: any) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Chat', { id: item.id, username: item.otherUser?.username })}
          >
            <Avatar src={item.otherUser?.avatarUrl} fallback={item.otherUser?.username ?? '?'} size="md" />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.username, { color: colors.text }]}>{item.otherUser?.username}</Text>
                {item.updatedAt && (
                  <Text style={{ color: colors.text3, fontSize: 11 }}>{timeAgo(item.updatedAt)}</Text>
                )}
              </View>
              <Text style={{ color: colors.text3, fontSize: 13 }} numberOfLines={1}>{item.lastMessage ?? 'No messages'}</Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={{ color: colors.accentFg, fontSize: 11, fontWeight: '600' }}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  username: { fontSize: 15, fontWeight: '500' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
