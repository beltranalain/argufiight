import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Plus, Swords } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthStore } from '../../store/authStore';
import { debatesApi } from '../../api/debates';
import { CreateDebateSheet } from '../../components/debate/CreateDebateSheet';

export function DashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showCreateDebate, setShowCreateDebate] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: debatesApi.getDashboardData,
    refetchInterval: 60000,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Topnav */}
      <View style={[styles.topnav, { borderBottomColor: colors.border }]}>
        <Text style={[styles.logo, { color: colors.text }]}>
          Argu<Text style={{ fontWeight: '600', color: colors.accent }}>fight</Text>
        </Text>
        <View style={styles.topnavRight}>
          {user && (
            <Text style={[styles.coins, { color: colors.amber }]}>
              {(user.coins ?? 0).toLocaleString()} coins
            </Text>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
            <Bell size={18} color={colors.text2} />
            <View style={[styles.notifDot, { backgroundColor: colors.red, borderColor: colors.bg }]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MyProfile')}>
            <Avatar src={user?.avatarUrl} fallback={user?.username ?? 'U'} size="sm" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {isLoading ? (
          <View style={{ gap: 16 }}>
            <Skeleton height={44} />
            <Skeleton height={120} />
            <Skeleton height={200} />
          </View>
        ) : (
          <>
            {/* Empty state */}
            {!data?.yourTurnDebate &&
              !data?.myActiveDebates?.length &&
              !data?.dailyChallenge &&
              !data?.openChallenges?.length && (
              <View style={styles.emptyState}>
                <Swords size={48} color={colors.text3} strokeWidth={1} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No active debates</Text>
                <Text style={[styles.emptySubtitle, { color: colors.text3 }]}>
                  Start your first debate by tapping the + button below
                </Text>
              </View>
            )}

            {/* Your Turn alert */}
            {data?.yourTurnDebate && (
              <TouchableOpacity
                onPress={() => navigation.navigate('DebateRoom', { id: data.yourTurnDebate.id })}
                style={[styles.alertBanner, { borderColor: colors.red + '33', backgroundColor: colors.red + '0A' }]}
              >
                <View style={[styles.alertDot, { backgroundColor: colors.red }]} />
                <Text style={[styles.alertLabel, { color: colors.red }]}>Your Turn</Text>
                <Text style={[styles.alertSlash, { color: colors.text3 }]}>/</Text>
                <Text style={[styles.alertTopic, { color: colors.text2 }]} numberOfLines={1}>
                  "{data.yourTurnDebate.topic}"
                </Text>
                <View style={[styles.alertBtn, { backgroundColor: colors.red }]}>
                  <Text style={styles.alertBtnText}>Respond</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Active debates */}
            {(data?.myActiveDebates?.length ?? 0) > 0 && (
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text3 }]}>
                    Your Active Debates{' '}
                    <Text style={{ fontWeight: '400' }}>{data!.myActiveDebates.length}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('HistoryTab')}>
                    <Text style={[styles.sectionLink, { color: colors.text3 }]}>History</Text>
                  </TouchableOpacity>
                </View>
                {data!.myActiveDebates.map((debate: any) => (
                  <TouchableOpacity
                    key={debate.id}
                    style={[styles.debateRow, { borderBottomColor: colors.border }]}
                    onPress={() => navigation.navigate('DebateRoom', { id: debate.id })}
                  >
                    <View style={styles.debateAvatars}>
                      <Avatar src={debate.challenger?.avatarUrl} fallback={debate.challenger?.username ?? '?'} size="sm" />
                      <Text style={[styles.debateVs, { color: colors.text3 }]}>vs</Text>
                      <Avatar src={debate.opponent?.avatarUrl} fallback={debate.opponent?.username ?? '?'} size="sm" />
                    </View>
                    <Text style={[styles.debateTopic, { color: colors.text }]} numberOfLines={1}>
                      "{debate.topic}"
                    </Text>
                    {debate.status === 'ACTIVE' ? (
                      <Text style={[styles.debateRound, { color: colors.text3 }]}>
                        R{debate.currentRound}/{debate.totalRounds}
                      </Text>
                    ) : (
                      <Text style={[styles.debateWaiting, { color: colors.red }]}>Waiting</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Daily Challenge */}
            {data?.dailyChallenge && (
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dailyLabel, { color: colors.text3 }]}>Daily Challenge</Text>
                <Text style={[styles.dailyHeadline, { color: colors.text }]}>
                  {data.dailyChallenge.topic?.split(' ').slice(0, -3).join(' ')}{' '}
                  <Text style={{ fontWeight: '600', color: colors.accent }}>
                    {data.dailyChallenge.topic?.split(' ').slice(-3).join(' ')}
                  </Text>
                </Text>
                <View style={styles.dailyMeta}>
                  <Text style={[styles.dailyMetaText, { color: colors.text2 }]}>Community debate</Text>
                  <Text style={{ color: colors.border2 }}>/</Text>
                  <Text style={[styles.dailyBadge, { color: colors.accent }]}>Today only</Text>
                </View>
              </View>
            )}

            {/* Open Challenges */}
            {(data?.openChallenges?.length ?? 0) > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text3 }]}>
                    Open Challenges{' '}
                    <Text style={{ fontWeight: '400' }}>{data!.openChallenges.length}</Text>
                  </Text>
                </View>
                {data!.openChallenges.slice(0, 5).map((debate: any, i: number) => (
                  <TouchableOpacity
                    key={debate.id}
                    style={[styles.challengeRow, { borderBottomColor: colors.border }]}
                    onPress={() => navigation.navigate('DebateRoom', { id: debate.id })}
                  >
                    <Text style={[styles.challengeNum, { color: colors.text3 }]}>
                      {String(i + 1).padStart(2, '0')}
                    </Text>
                    <Text style={[styles.challengeTopic, { color: colors.text }]} numberOfLines={1}>
                      "{debate.topic}"
                    </Text>
                    <View style={[styles.acceptBtn, { borderColor: colors.accent }]}>
                      <Text style={[styles.acceptBtnText, { color: colors.accent }]}>Accept</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setShowCreateDebate(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color={colors.accentFg} />
      </TouchableOpacity>

      <CreateDebateSheet
        visible={showCreateDebate}
        onClose={() => setShowCreateDebate(false)}
        onCreated={(debate) => {
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          navigation.navigate('DebateRoom', { id: debate.id });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topnav: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 1,
  },
  logo: { fontSize: 17, fontWeight: '300', letterSpacing: 4, textTransform: 'uppercase' },
  topnavRight: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
  coins: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, borderWidth: 2 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 100 },
  // Alert
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  alertDot: { width: 6, height: 6, borderRadius: 3 },
  alertLabel: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  alertSlash: { fontSize: 16 },
  alertTopic: { flex: 1, fontSize: 14 },
  alertBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  alertBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  // Sections
  section: { marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5 },
  sectionLink: { fontSize: 13, fontWeight: '500' },
  // Debate rows
  debateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  debateAvatars: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  debateVs: { fontSize: 12 },
  debateTopic: { flex: 1, fontSize: 15 },
  debateRound: { fontSize: 13, fontWeight: '500' },
  debateWaiting: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  // Daily challenge
  dailyLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  dailyHeadline: { fontSize: 28, fontWeight: '200', letterSpacing: -1, lineHeight: 34, marginBottom: 8 },
  dailyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dailyMetaText: { fontSize: 14 },
  dailyBadge: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  // Challenges
  challengeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  challengeNum: { fontSize: 14, fontWeight: '300', width: 20, textAlign: 'right' },
  challengeTopic: { flex: 1, fontSize: 15 },
  acceptBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  acceptBtnText: { fontSize: 14, fontWeight: '500' },
  // Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '500' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
  // FAB
  fab: {
    position: 'absolute', right: 16, bottom: 76, width: 52, height: 52,
    borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#d4f050', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
});
