import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, MessageCircle } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { debatesApi } from '../../api/debates';
import { useAuthStore } from '../../store/authStore';

export function DebateHistoryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['debateHistory'],
    queryFn: debatesApi.getHistory,
    staleTime: 30000, // 30s
  });

  const debates = Array.isArray(data) ? data : data?.debates ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>History</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Conversations')} style={styles.iconBtn}>
            <MessageCircle size={18} color={colors.text2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
            <Bell size={18} color={colors.text2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MyProfile')}>
            <Avatar src={user?.avatarUrl} fallback={user?.username ?? 'U'} size="sm" />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={debates}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 8 }}>{[1, 2, 3].map((i) => <Skeleton key={i} height={60} />)}</View>
          ) : (
            <Text style={{ color: colors.text3, textAlign: 'center', marginTop: 40 }}>No debate history yet</Text>
          )
        }
        renderItem={({ item }: any) => {
          const isWin = item.winnerId === userId;
          const isDraw = item.status === 'COMPLETED' && !item.winnerId;
          return (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('DebateRoom', { id: item.id })}
            >
              <View style={[
                styles.result,
                { backgroundColor: isWin ? colors.greenMuted : isDraw ? colors.amberMuted : colors.redMuted },
              ]}>
                <Text style={{ color: isWin ? colors.green : isDraw ? colors.amber : colors.red, fontSize: 12, fontWeight: '600' }}>
                  {isWin ? 'W' : isDraw ? 'D' : 'L'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.topic, { color: colors.text }]} numberOfLines={1}>"{item.topic}"</Text>
                <Text style={{ color: colors.text3, fontSize: 12 }}>
                  vs {item.challenger?.username === useAuthStore.getState().user?.username
                    ? item.opponent?.username
                    : item.challenger?.username ?? 'Unknown'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  result: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  topic: { fontSize: 14, fontWeight: '500' },
});
