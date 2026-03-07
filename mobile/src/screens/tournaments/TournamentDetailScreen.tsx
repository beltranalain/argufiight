import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, Trophy, Calendar } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Avatar } from '../../components/ui/Avatar';
import { tournamentsApi } from '../../api/tournaments';
import { useAuthStore } from '../../store/authStore';

export function TournamentDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { id } = route.params;
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.get(id),
  });

  const joinMutation = useMutation({
    mutationFn: () => tournamentsApi.join(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      Alert.alert('Joined!', 'You have joined the tournament.');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const isParticipant = data?.participants?.some((p: any) => p.userId === userId);
  const canJoin = data?.status === 'UPCOMING' && !isParticipant;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tournament</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={28} width="60%" />
            <Skeleton height={16} />
            <Skeleton height={200} />
          </View>
        ) : data ? (
          <>
            <View style={styles.titleRow}>
              <Text style={{ fontSize: 22, fontWeight: '500', color: colors.text, flex: 1 }}>
                {data.name}
              </Text>
              <Badge color={data.status === 'ACTIVE' ? 'green' : data.status === 'UPCOMING' ? 'amber' : 'muted'}>
                {data.status}
              </Badge>
            </View>

            {data.description && (
              <Text style={{ fontSize: 14, color: colors.text2, lineHeight: 20, marginTop: 8 }}>
                {data.description}
              </Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Users size={16} color={colors.accent} />
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  {data.participantCount ?? 0} / {data.maxParticipants ?? '∞'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Trophy size={16} color={colors.amber} />
                <Text style={{ color: colors.text, fontSize: 14 }}>{data.category ?? 'General'}</Text>
              </View>
              {data.startDate && (
                <View style={styles.stat}>
                  <Calendar size={16} color={colors.text3} />
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    {new Date(data.startDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            {canJoin && (
              <Button
                variant="accent"
                size="lg"
                fullWidth
                loading={joinMutation.isPending}
                onPress={() => joinMutation.mutate()}
                style={{ marginTop: 16 }}
              >
                Join Tournament
              </Button>
            )}

            {isParticipant && (
              <View style={[styles.joinedBadge, { backgroundColor: colors.greenMuted, borderColor: colors.green + '33' }]}>
                <Text style={{ color: colors.green, fontSize: 14, fontWeight: '500' }}>You're in this tournament</Text>
              </View>
            )}

            {data.participants?.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionTitle, { color: colors.text3 }]}>Participants</Text>
                {data.participants.map((p: any) => (
                  <TouchableOpacity
                    key={p.userId ?? p.id}
                    style={[styles.participantRow, { borderBottomColor: colors.border }]}
                    onPress={() => navigation.navigate('UserProfile', { id: p.userId })}
                  >
                    <Avatar src={p.user?.avatarUrl ?? p.avatarUrl} fallback={p.user?.username ?? p.username ?? '?'} size="sm" />
                    <Text style={{ color: colors.text, fontSize: 14, flex: 1 }}>{p.user?.username ?? p.username}</Text>
                    <Text style={{ color: colors.text3, fontSize: 12 }}>{p.user?.eloRating ?? p.eloRating} ELO</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '500' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  joinedBadge: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 16, alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
});
