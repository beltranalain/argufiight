import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Skeleton } from '../../components/ui/Skeleton';
import { notificationsApi } from '../../api/notifications';
import { timeAgo } from '../../utils/notifications';

export function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
  });

  const notifications = Array.isArray(data) ? data : data?.notifications ?? [];

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  function handleNotificationPress(item: any) {
    if (!item.isRead) {
      notificationsApi.markRead(item.id).then(() =>
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      );
    }
    if (item.debateId) {
      navigation.navigate('Tabs', { screen: 'HomeTab', params: { screen: 'DebateRoom', params: { id: item.debateId } } });
    } else if (item.type === 'MESSAGE' && item.conversationId) {
      navigation.navigate('Chat', { id: item.conversationId });
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '500' }}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onRefresh={refetch}
        refreshing={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>{[1, 2, 3].map((i) => <Skeleton key={i} height={50} />)}</View>
          ) : (
            <Text style={{ color: colors.text3, textAlign: 'center', marginTop: 40 }}>No notifications</Text>
          )
        }
        renderItem={({ item }: any) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border, opacity: item.isRead ? 0.6 : 1 }]}
            onPress={() => handleNotificationPress(item)}
          >
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={{ color: colors.text3, fontSize: 13 }}>{item.message ?? item.body}</Text>
            </View>
            {item.createdAt && (
              <Text style={{ color: colors.text3, fontSize: 11 }}>{timeAgo(item.createdAt)}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  title: { fontSize: 17, fontWeight: '500', flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  notifTitle: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
});
