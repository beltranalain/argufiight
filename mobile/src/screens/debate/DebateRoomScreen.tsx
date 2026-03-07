import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, Send, MessageCircle } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { debatesApi } from '../../api/debates';
import { useAuthStore } from '../../store/authStore';

type Tab = 'arguments' | 'chat' | 'verdict';

export function DebateRoomScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { id } = route.params;
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const [tab, setTab] = useState<Tab>('arguments');
  const [statement, setStatement] = useState('');
  const [chatMsg, setChatMsg] = useState('');

  const { data: debate, isLoading } = useQuery({
    queryKey: ['debate', id],
    queryFn: () => debatesApi.getDebate(id),
    refetchInterval: 10000,
  });

  const { data: chat = [] } = useQuery({
    queryKey: ['debateChat', id],
    queryFn: () => debatesApi.getChat(id),
    refetchInterval: tab === 'chat' ? 5000 : false,
  });

  const { data: verdicts = [] } = useQuery({
    queryKey: ['debateVerdicts', id],
    queryFn: () => debatesApi.getVerdicts(id),
    enabled: debate?.status === 'COMPLETED' || debate?.status === 'VERDICT_READY',
  });

  const submitMutation = useMutation({
    mutationFn: (content: string) => debatesApi.submitStatement(id, content),
    onSuccess: () => {
      setStatement('');
      queryClient.invalidateQueries({ queryKey: ['debate', id] });
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const chatMutation = useMutation({
    mutationFn: (content: string) => debatesApi.sendChat(id, content),
    onSuccess: () => {
      setChatMsg('');
      queryClient.invalidateQueries({ queryKey: ['debateChat', id] });
    },
  });

  const isParticipant = user && (debate?.challengerId === user.id || debate?.opponentId === user.id);
  const canSubmit = isParticipant && debate?.status === 'ACTIVE';

  const handleSubmitStatement = useCallback(() => {
    if (!statement.trim()) return;
    submitMutation.mutate(statement.trim());
  }, [statement, submitMutation]);

  const handleSendChat = useCallback(() => {
    if (!chatMsg.trim()) return;
    chatMutation.mutate(chatMsg.trim());
  }, [chatMsg, chatMutation]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={24} width="60%" />
          <Skeleton height={100} />
          <Skeleton height={200} />
        </View>
      </SafeAreaView>
    );
  }

  const chatMessages = Array.isArray(chat) ? chat : [];
  const verdictList = Array.isArray(verdicts) ? verdicts : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {debate?.topic ?? 'Debate'}
          </Text>
          <Text style={{ color: colors.text3, fontSize: 12 }}>
            Round {debate?.currentRound ?? 1} of {debate?.totalRounds ?? 3}
          </Text>
        </View>
        <View style={styles.spectators}>
          <Eye size={14} color={colors.text3} />
          <Text style={{ color: colors.text3, fontSize: 12 }}>{debate?.spectatorCount ?? 0}</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(['arguments', 'chat', 'verdict'] as Tab[]).map((t) => {
          const label = t === 'arguments' ? `Arguments${debate?.statements?.length ? ` (${debate.statements.length})` : ''}` :
                        t === 'chat' ? 'Chat' :
                        `Verdict${verdictList.length ? ` (${verdictList.length})` : ''}`;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.accent : colors.text3 }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Arguments tab */}
        {tab === 'arguments' && (
          <>
            <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: canSubmit ? 120 : 40 }}>
              {/* Players card */}
              <View style={[styles.players, { borderBottomColor: colors.border }]}>
                <View style={styles.player}>
                  <Avatar src={debate?.challenger?.avatarUrl} fallback={debate?.challenger?.username ?? '?'} size="lg" />
                  <Text style={[styles.playerName, { color: colors.text }]}>{debate?.challenger?.username}</Text>
                  <Text style={[styles.playerRole, { color: colors.accent }]}>Challenger</Text>
                </View>
                <Text style={[styles.vs, { color: colors.text3 }]}>VS</Text>
                <View style={styles.player}>
                  <Avatar src={debate?.opponent?.avatarUrl} fallback={debate?.opponent?.username ?? '?'} size="lg" />
                  <Text style={[styles.playerName, { color: colors.text }]}>{debate?.opponent?.username ?? 'Waiting...'}</Text>
                  <Text style={[styles.playerRole, { color: colors.red }]}>Opponent</Text>
                </View>
              </View>

              {/* Statements */}
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionLabel, { color: colors.text3 }]}>Statements</Text>
                {(debate?.statements?.length ?? 0) > 0 ? (
                  debate!.statements!.map((stmt: any, i: number) => {
                    const isMe = stmt.authorId === user?.id;
                    return (
                      <View
                        key={stmt.id ?? i}
                        style={[
                          styles.statement,
                          {
                            backgroundColor: isMe ? colors.accent + '14' : colors.surface,
                            borderColor: isMe ? colors.accent + '33' : colors.border,
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                          },
                        ]}
                      >
                        <View style={styles.stmtHeader}>
                          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>
                            Round {stmt.round}
                          </Text>
                          <Text style={{ color: colors.text3, fontSize: 12 }}>
                            {stmt.authorUsername ?? (isMe ? 'You' : 'Opponent')}
                          </Text>
                        </View>
                        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{stmt.content}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{ color: colors.text3, fontSize: 14, marginTop: 8 }}>No statements yet</Text>
                )}
              </View>
            </ScrollView>

            {/* Submit argument input */}
            {canSubmit && (
              <View style={[styles.submitBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
                <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 6 }}>
                  Round {debate?.currentRound ?? 1} — Your argument
                </Text>
                <View style={styles.submitRow}>
                  <TextInput
                    style={[styles.submitInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="Type your argument..."
                    placeholderTextColor={colors.text3}
                    value={statement}
                    onChangeText={setStatement}
                    multiline
                    maxLength={5000}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: statement.trim() ? colors.accent : colors.surface2 }]}
                    onPress={handleSubmitStatement}
                    disabled={!statement.trim() || submitMutation.isPending}
                  >
                    <Send size={18} color={statement.trim() ? colors.accentFg : colors.text3} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* Chat tab */}
        {tab === 'chat' && (
          <>
            <FlatList
              data={chatMessages}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
              renderItem={({ item }: any) => {
                const isMe = item.authorId === user?.id;
                return (
                  <View style={[styles.chatBubbleWrap, { flexDirection: isMe ? 'row-reverse' : 'row' }]}>
                    <Avatar src={item.author?.avatarUrl} fallback={item.author?.username ?? '?'} size="sm" />
                    <View style={[
                      styles.chatBubble,
                      { backgroundColor: isMe ? colors.accent + '1A' : colors.surface, borderColor: isMe ? colors.accent + '33' : colors.border },
                    ]}>
                      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '600', marginBottom: 2 }}>
                        {item.author?.username}
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 14 }}>{item.content}</Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingTop: 40 }}>
                  <MessageCircle size={32} color={colors.text3} />
                  <Text style={{ color: colors.text3, fontSize: 14, marginTop: 8 }}>No messages yet</Text>
                </View>
              }
            />
            <View style={[styles.chatInputBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.chatInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Send a message..."
                placeholderTextColor={colors.text3}
                value={chatMsg}
                onChangeText={setChatMsg}
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: chatMsg.trim() ? colors.accent : colors.surface2 }]}
                onPress={handleSendChat}
                disabled={!chatMsg.trim() || chatMutation.isPending}
              >
                <Send size={18} color={chatMsg.trim() ? colors.accentFg : colors.text3} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Verdict tab */}
        {tab === 'verdict' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {verdictList.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Text style={{ color: colors.text3, fontSize: 14 }}>
                  {debate?.status === 'COMPLETED' ? 'Verdicts are being generated...' : 'Debate still in progress'}
                </Text>
              </View>
            ) : (
              <>
                {/* Overall result */}
                <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.resultTitle, { color: colors.text }]}>
                    {(() => {
                      const cWins = verdictList.filter((v: any) => v.decision === 'CHALLENGER_WINS').length;
                      const oWins = verdictList.filter((v: any) => v.decision === 'OPPONENT_WINS').length;
                      if (cWins > oWins) return `${debate?.challenger?.username} Wins`;
                      if (oWins > cWins) return `${debate?.opponent?.username} Wins`;
                      return 'Draw';
                    })()}
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 13 }}>
                    {verdictList.length} judge{verdictList.length > 1 ? 's' : ''} voted
                  </Text>
                </View>

                {/* Per-judge verdicts */}
                {verdictList.map((v: any) => (
                  <View key={v.id} style={[styles.verdictCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.judgeRow}>
                      <Text style={{ fontSize: 18 }}>{v.judge?.emoji ?? ''}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{v.judge?.name ?? 'Judge'}</Text>
                        <Text style={{ color: colors.text3, fontSize: 12 }}>{v.judge?.personality}</Text>
                      </View>
                    </View>
                    <View style={[styles.scoreRow, { borderTopColor: colors.border }]}>
                      <View style={styles.scoreCol}>
                        <Text style={{ color: colors.text2, fontSize: 12 }}>{debate?.challenger?.username}</Text>
                        <Text style={{ color: colors.accent, fontSize: 20, fontWeight: '600' }}>{v.challengerScore ?? '-'}</Text>
                      </View>
                      <Text style={{ color: colors.text3, fontSize: 12, fontWeight: '600' }}>
                        {v.decision === 'CHALLENGER_WINS' ? 'Challenger Wins' : v.decision === 'OPPONENT_WINS' ? 'Opponent Wins' : 'Tie'}
                      </Text>
                      <View style={styles.scoreCol}>
                        <Text style={{ color: colors.text2, fontSize: 12 }}>{debate?.opponent?.username}</Text>
                        <Text style={{ color: colors.red, fontSize: 20, fontWeight: '600' }}>{v.opponentScore ?? '-'}</Text>
                      </View>
                    </View>
                    {v.reasoning && (
                      <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 18, marginTop: 10 }}>{v.reasoning}</Text>
                    )}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: '500' },
  spectators: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // Tab bar
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '500' },
  // Players
  players: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 20, borderBottomWidth: 1 },
  player: { alignItems: 'center', gap: 6 },
  playerName: { fontSize: 14, fontWeight: '500' },
  playerRole: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  vs: { fontSize: 16, fontWeight: '600' },
  // Statements
  sectionLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  statement: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 10, maxWidth: '85%' },
  stmtHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  // Submit bar
  submitBar: { padding: 12, borderTopWidth: 1 },
  submitRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  submitInput: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, maxHeight: 120, textAlignVertical: 'top' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  // Chat
  chatBubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  chatBubble: { maxWidth: '75%', padding: 10, borderRadius: 10, borderWidth: 1 },
  chatInputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
  chatInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, fontSize: 14 },
  // Verdicts
  resultCard: { padding: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 22, fontWeight: '600', marginBottom: 4 },
  verdictCard: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  judgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 10 },
  scoreCol: { alignItems: 'center' },
});
