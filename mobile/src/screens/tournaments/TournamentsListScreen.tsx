import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { tournamentsApi } from '../../api/tournaments';

export function TournamentsListScreen({ navigation }: any) {
  const { colors } = useTheme();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['tournaments'],
    queryFn: tournamentsApi.getAll,
  });

  const tournaments = Array.isArray(data) ? data : data?.tournaments ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Tournaments</Text>
      </View>

      <FlatList
        data={tournaments}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>{[1, 2, 3].map((i) => <Skeleton key={i} height={100} />)}</View>
          ) : (
            <Text style={{ color: colors.text3, textAlign: 'center', marginTop: 40 }}>No tournaments available</Text>
          )
        }
        renderItem={({ item }: any) => (
          <TouchableOpacity onPress={() => navigation.navigate('TournamentDetail', { id: item.id })}>
            <Card>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                <Badge color={item.status === 'ACTIVE' ? 'green' : item.status === 'UPCOMING' ? 'amber' : 'muted'}>
                  {item.status}
                </Badge>
              </View>
              <Text style={{ color: colors.text3, fontSize: 13, marginTop: 4 }}>
                {item.participantCount ?? 0} / {item.maxParticipants ?? '∞'} participants
              </Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '500' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '500', flex: 1 },
});
