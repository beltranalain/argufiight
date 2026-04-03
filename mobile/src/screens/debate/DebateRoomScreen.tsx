import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Keyboard, Platform, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, Send, MessageCircle, Mic, MicOff, MoreHorizontal } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { debatesApi } from '../../api/debates';
import { useAuthStore } from '../../store/authStore';
import { ReportBlockMenu } from '../../components/ui/ReportBlockMenu';

// expo-speech-recognition requires a dev build — not available in Expo Go.
// Load it dynamically so the rest of the app still works in Expo Go.
let _speechModule: any = null;
function _noOpHook(_event: string, _cb: any) { useEffect(() => {}, []); }
let _useSpeechRecognitionEvent: (_event: string, _cb: any) => void = _noOpHook;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sr = require('expo-speech-recognition');
  _speechModule = sr.ExpoSpeechRecognitionModule ?? null;
  if (typeof sr.useSpeechRecognitionEvent === 'function') {
    _useSpeechRecognitionEvent = sr.useSpeechRecognitionEvent;
  }
} catch {}
const speechModule = _speechModule;
const useSpeechRecognitionEvent = _useSpeechRecognitionEvent;

type Tab = 'arguments' | 'chat' | 'verdict';
type VoiceTarget = 'statement' | 'chat' | null;

export function DebateRoomScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { id } = route.params;
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const [tab, setTab] = useState<Tab>('arguments');
  const [statement, setStatement] = useState('');
  const [chatMsg, setChatMsg] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const [reportMenuVisible, setReportMenuVisible] = useState(false);

  // Track keyboard height manually — more reliable than KeyboardAvoidingView on Android
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKbHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Append recognized speech to the active input
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    if (!text) return;
    if (voiceTarget === 'statement') {
      setStatement((prev) => (prev ? `${prev} ${text}` : text));
    } else if (voiceTarget === 'chat') {
      setChatMsg((prev) => (prev ? `${prev} ${text}` : text));
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setVoiceTarget(null);
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
    setVoiceTarget(null);
  });

  const startVoice = useCallback(async (target: 'statement' | 'chat') => {
    if (!speechModule) {
      Alert.alert('Voice input unavailable', 'Install a development build to use voice-to-text.');
      return;
    }
    if (isListening) {
      speechModule.stop();
      setIsListening(false);
      setVoiceTarget(null);
      return;
    }
    try {
      const perm = await speechModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Microphone access is needed for voice input.');
        return;
      }
      setVoiceTarget(target);
      setIsListening(true);
      speechModule.start({ lang: 'en-US', interimResults: true, continuous: false });
    } catch {
      Alert.alert('Voice input unavailable', 'Speech recognition is not supported on this device.');
      setIsListening(false);
      setVoiceTarget(null);
    }
  }, [isListening]);

  const { data: debate, isLoading } = useQuery({
    queryKey: ['debate', id],
    queryFn: () => debatesApi.getDebate(id),
    staleTime: 15000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'CANCELLED') return false;
      return 30000; // 30s polling (reduced from 10s)
    },
  });

  const { data: chat = [] } = useQuery({
    queryKey: ['debateChat', id],
    queryFn: () => debatesApi.getChat(id),
    staleTime: 10000,
    refetchInterval: tab === 'chat' && debate?.status !== 'COMPLETED' ? 15000 : false, // 15s (reduced from 5s)
  });

  const { data: verdicts = [] } = useQuery({
    queryKey: ['debateVerdicts', id],
    queryFn: () => debatesApi.getVerdicts(id),
    enabled: debate?.status === 'COMPLETED' || debate?.status === 'VERDICT_READY',
  });

  const [optimisticStatements, setOptimisticStatements] = useState<any[]>([]);

  const submitMutation = useMutation({
    mutationFn: (content: string) => debatesApi.submitStatement(id, content),
    onSuccess: () => {
      // Server confirmed — clear optimistic entry and refresh
      setOptimisticStatements([]);
      queryClient.invalidateQueries({ queryKey: ['debate', id] });
    },
    onError: (err: any) => {
      // Rollback optimistic entry
      setOptimisticStatements([]);
      Alert.alert('Failed to submit', err.message ?? 'Please try again.');
    },
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
  const canAccept = user && debate?.status === 'WAITING' && debate?.challengerId !== user.id;

  const acceptMutation = useMutation({
    mutationFn: () => debatesApi.accept(id),
    onSuccess: () => {
      Alert.alert('Challenge Accepted', 'The debate is now active!');
      queryClient.invalidateQueries({ queryKey: ['debate', id] });
    },
    onError: (err: any) => {
      Alert.alert('Failed to accept', err.message ?? 'Please try again.');
    },
  });

  const handleSubmitStatement = useCallback(() => {
    const text = statement.trim();
    if (!text) return;
    // Optimistic update — show immediately
    setOptimisticStatements([{
      id: `optimistic-${Date.now()}`,
      content: text,
      authorId: user?.id,
      round: debate?.currentRound,
      optimistic: true,
    }]);
    setStatement('');
    submitMutation.mutate(text);
  }, [statement, submitMutation, user, debate]);

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
        <TouchableOpacity onPress={() => setReportMenuVisible(true)} hitSlop={12}>
          <MoreHorizontal size={20} color={colors.text3} />
        </TouchableOpacity>
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

      {/* Content area — input bars are absolutely positioned above the keyboard */}
      <View style={{ flex: 1 }}>
        {/* Arguments tab */}
        {tab === 'arguments' && (
          <>
            <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: canSubmit ? (kbHeight + 100) : 40 }}>
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

              {/* Accept banner for WAITING debates */}
              {canAccept && (
                <View style={[styles.acceptBanner, { backgroundColor: colors.accent + '14', borderColor: colors.accent + '33' }]}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: 2 }}>
                    {debate?.opponentId === user?.id ? "You've been challenged!" : "Open challenge — join the debate"}
                  </Text>
                  <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 10 }}>{debate?.topic}</Text>
                  <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: colors.accent }]}
                    onPress={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                  >
                    {acceptMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.accentFg} />
                    ) : (
                      <Text style={{ color: colors.accentFg, fontSize: 14, fontWeight: '600' }}>Accept Challenge</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Statements */}
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.sectionLabel, { color: colors.text3 }]}>Statements</Text>
                {[...(debate?.statements ?? []), ...optimisticStatements].length > 0 ? (
                  [...(debate?.statements ?? []), ...optimisticStatements].map((stmt: any, i: number) => {
                    const isMe = stmt.authorId === user?.id;
                    return (
                      <View
                        key={stmt.id ?? i}
                        style={[
                          styles.statement,
                          {
                            backgroundColor: isMe ? colors.accent + '14' : colors.surface,
                            borderColor: stmt.optimistic ? colors.accent + '66' : isMe ? colors.accent + '33' : colors.border,
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            opacity: stmt.optimistic ? 0.7 : 1,
                          },
                        ]}
                      >
                        <View style={styles.stmtHeader}>
                          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>
                            Round {stmt.round}{stmt.optimistic ? ' · Sending…' : ''}
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

            {/* Submit argument input — absolutely positioned above keyboard */}
            {canSubmit && (
              <View style={[styles.submitBar, { backgroundColor: colors.bg, borderTopColor: colors.border, bottom: kbHeight }]}>
                <Text style={{ color: colors.text3, fontSize: 12, marginBottom: 6 }}>
                  Round {debate?.currentRound ?? 1} — Your argument
                  {isListening && voiceTarget === 'statement' && (
                    <Text style={{ color: '#ef4444' }}> ● Listening...</Text>
                  )}
                </Text>
                <View style={styles.submitRow}>
                  <TextInput
                    style={[styles.submitInput, { backgroundColor: colors.surface, borderColor: isListening && voiceTarget === 'statement' ? '#ef4444' : colors.border, color: colors.text }]}
                    placeholder="Type your argument..."
                    placeholderTextColor={colors.text3}
                    value={statement}
                    onChangeText={setStatement}
                    multiline
                    maxLength={5000}
                  />
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: isListening && voiceTarget === 'statement' ? '#ef4444' : colors.surface2 }]}
                    onPress={() => startVoice('statement')}
                  >
                    {isListening && voiceTarget === 'statement' ? (
                      <MicOff size={16} color="#fff" />
                    ) : (
                      <Mic size={16} color={colors.text3} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sendBtn, {
                      backgroundColor: submitMutation.isPending ? colors.accent + '80'
                        : statement.trim() ? colors.accent : colors.surface2,
                    }]}
                    onPress={handleSubmitStatement}
                    disabled={!statement.trim() || submitMutation.isPending}
                  >
                    {submitMutation.isPending
                      ? <ActivityIndicator size="small" color={colors.accentFg} />
                      : <Send size={18} color={statement.trim() ? colors.accentFg : colors.text3} />}
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
              contentContainerStyle={{ padding: 16, paddingBottom: kbHeight + 80 }}
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
            <View style={[styles.chatInputBar, { backgroundColor: colors.bg, borderTopColor: colors.border, bottom: kbHeight }]}>
              <TextInput
                style={[styles.chatInput, { backgroundColor: colors.surface, borderColor: isListening && voiceTarget === 'chat' ? '#ef4444' : colors.border, color: colors.text }]}
                placeholder={isListening && voiceTarget === 'chat' ? '● Listening...' : 'Send a message...'}
                placeholderTextColor={isListening && voiceTarget === 'chat' ? '#ef4444' : colors.text3}
                value={chatMsg}
                onChangeText={setChatMsg}
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: isListening && voiceTarget === 'chat' ? '#ef4444' : colors.surface2 }]}
                onPress={() => startVoice('chat')}
              >
                {isListening && voiceTarget === 'chat' ? (
                  <MicOff size={16} color="#fff" />
                ) : (
                  <Mic size={16} color={colors.text3} />
                )}
              </TouchableOpacity>
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
                {/* Overall result with total scores + avatars */}
                {(() => {
                  const cWins = verdictList.filter((v: any) => v.decision === 'CHALLENGER_WINS').length;
                  const oWins = verdictList.filter((v: any) => v.decision === 'OPPONENT_WINS').length;
                  const totalC = verdictList.reduce((sum: number, v: any) => sum + (v.challengerScore ?? 0), 0);
                  const totalO = verdictList.reduce((sum: number, v: any) => sum + (v.opponentScore ?? 0), 0);
                  const winnerName = cWins > oWins ? debate?.challenger?.username
                    : oWins > cWins ? debate?.opponent?.username : null;
                  return (
                    <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.resultTitle, { color: colors.text }]}>
                        {winnerName ? `${winnerName} Wins`.toUpperCase() : 'DRAW'}
                      </Text>
                      <Text style={{ color: colors.text3, fontSize: 13, marginBottom: 20 }}>
                        ({cWins}–{oWins} judges)
                      </Text>
                      <View style={styles.totalScoreRow}>
                        <View style={styles.totalScoreCol}>
                          <Avatar src={debate?.challenger?.avatarUrl} fallback={debate?.challenger?.username ?? '?'} size="lg" />
                          <Text style={{ color: colors.text2, fontSize: 12, marginTop: 6 }} numberOfLines={1}>{debate?.challenger?.username}</Text>
                          <Text style={{ color: totalC >= totalO ? colors.accent : colors.text2, fontSize: 32, fontWeight: '700' }}>{totalC}</Text>
                          <Text style={{ color: colors.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>FOR</Text>
                        </View>
                        <View style={styles.totalScoreCol}>
                          <Avatar src={debate?.opponent?.avatarUrl} fallback={debate?.opponent?.username ?? '?'} size="lg" />
                          <Text style={{ color: colors.text2, fontSize: 12, marginTop: 6 }} numberOfLines={1}>{debate?.opponent?.username}</Text>
                          <Text style={{ color: totalO > totalC ? colors.accent : colors.text2, fontSize: 32, fontWeight: '700' }}>{totalO}</Text>
                          <Text style={{ color: colors.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>AGAINST</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* Per-judge verdicts */}
                <Text style={[styles.sectionLabel, { color: colors.text3, marginTop: 8, marginBottom: 12 }]}>
                  JUDGE VERDICTS ({verdictList.length})
                </Text>
                {verdictList.map((v: any) => (
                  <View key={v.id} style={[styles.verdictCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.judgeRow}>
                      <Avatar src={v.judge?.avatarUrl} fallback={v.judge?.name?.[0] ?? 'J'} size="md" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{v.judge?.name ?? 'Judge'}</Text>
                        <Text style={{ color: colors.text3, fontSize: 12 }}>{v.judge?.personality ?? v.judge?.focus}</Text>
                      </View>
                      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                        {v.decision === 'CHALLENGER_WINS' ? 'WINS' : v.decision === 'OPPONENT_WINS' ? 'WINS' : 'TIE'}
                      </Text>
                    </View>
                    <View style={[styles.scoreRow, { borderTopColor: colors.border }]}>
                      <View style={styles.judgeScoreBox}>
                        <Avatar src={debate?.challenger?.avatarUrl} fallback={debate?.challenger?.username ?? '?'} size="sm" />
                        <Text style={{ color: colors.text3, fontSize: 11, marginTop: 4 }} numberOfLines={1}>{debate?.challenger?.username}</Text>
                        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{v.challengerScore ?? '-'}</Text>
                      </View>
                      <View style={styles.judgeScoreBox}>
                        <Avatar src={debate?.opponent?.avatarUrl} fallback={debate?.opponent?.username ?? '?'} size="sm" />
                        <Text style={{ color: colors.text3, fontSize: 11, marginTop: 4 }} numberOfLines={1}>{debate?.opponent?.username}</Text>
                        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{v.opponentScore ?? '-'}</Text>
                      </View>
                    </View>
                    {v.reasoning && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={{ color: colors.text3, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>REASONING</Text>
                        <Text style={{ color: colors.text2, fontSize: 13, lineHeight: 20 }}>{v.reasoning}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </View>

      <ReportBlockMenu
        visible={reportMenuVisible}
        onClose={() => setReportMenuVisible(false)}
        debateId={id}
      />
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
  // Submit bar — absolutely positioned so it floats above the keyboard
  submitBar: { position: 'absolute', left: 0, right: 0, padding: 12, borderTopWidth: 1 },
  submitRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  submitInput: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, maxHeight: 120, textAlignVertical: 'top' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  // Chat
  chatBubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  chatBubble: { maxWidth: '75%', padding: 10, borderRadius: 10, borderWidth: 1 },
  chatInputBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
  chatInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, fontSize: 14 },
  // Verdicts
  resultCard: { padding: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
  totalScoreRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', gap: 16 },
  totalScoreCol: { alignItems: 'center', flex: 1 },
  verdictCard: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  judgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, paddingTop: 12, gap: 8 },
  scoreCol: { alignItems: 'center' },
  judgeScoreBox: { alignItems: 'center', flex: 1 },
  acceptBanner: { padding: 16, borderRadius: 10, borderWidth: 1, marginTop: 16, alignItems: 'center' },
  acceptButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 160 },
});
