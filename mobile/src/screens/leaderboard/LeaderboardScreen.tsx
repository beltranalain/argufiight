import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { leaderboardApi } from '../../api/leaderboard';

export function LeaderboardScreen({ navigation }: any) {
  const { colors } = useTheme();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => leaderboardApi.get(1, 50),
  });

  const users = data?.users ?? data ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Rankings</Text>
      </View>

      <FlatList
        data={Array.isArray(users) ? users : []}
        keyExtractor={(item: any) => item.id || item.userId || String(item.rank)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 8 }}>{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={52} />)}</View>
          ) : (
            <Text style={{ color: colors.text3, textAlign: 'center', marginTop: 40 }}>No rankings available</Text>
          )
        }
        renderItem={({ item, index }: any) => {
          const rank = item.rank ?? index + 1;
          const isTop3 = rank <= 3;
          const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
          return (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('UserProfile', { id: item.id || item.userId })}
            >
              <Text style={[
                styles.rank,
                { color: isTop3 ? medalColors[rank - 1] : colors.text3 },
                isTop3 && { fontWeight: '600' },
              ]}>
                {rank}
              </Text>
              <Avatar src={item.avatarUrl} fallback={item.username ?? '?'} size="sm" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
                <Text style={{ color: colors.text3, fontSize: 12 }}>
                  {item.winRate != null ? `${Math.round(item.winRate)}% win rate` : ''}
                </Text>
              </View>
              <Text style={[styles.elo, { color: colors.accent }]}>
                {item.eloRating ?? item.elo ?? '—'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  rank: { fontSize: 16, width: 28, textAlign: 'center', fontWeight: '400' },
  username: { fontSize: 15, fontWeight: '500' },
  elo: { fontSize: 15, fontWeight: '600' },
});
