import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { debatesAPI, Debate } from '../../services/debatesAPI';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import CommentInput from '../../components/CommentInput';
import { votesAPI, VoteData } from '../../services/votesAPI';
import AnimatedCountdownTimer from '../../components/AnimatedCountdownTimer';
import YourTurnBanner from '../../components/YourTurnBanner';
import { insightsAPI, DebateInsights } from '../../services/insightsAPI';
import { tagsAPI } from '../../services/tagsAPI';
import { notificationsAPI } from '../../services/notificationsAPI';
import { haptics } from '../../utils/haptics';
import Pagination from '../../components/Pagination';

interface Statement {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  round: number;
  content: string;
  createdAt: string;
}

interface Verdict {
  id: string;
  debateId: string;
  judgeId: string;
  judge: {
    id: string;
    name: string;
    emoji: string;
    personality: string;
  };
  winnerId: string | null;
  decision: 'CHALLENGER_WINS' | 'OPPONENT_WINS' | 'TIE';
  reasoning: string;
  challengerScore: number | null;
  opponentScore: number | null;
  createdAt: string;
}

export default function DebateDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { debateId } = route.params as { debateId: string };

  const [debate, setDebate] = useState<Debate | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const commentsPerPage = 20;
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [argumentText, setArgumentText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyingToUsername, setReplyingToUsername] = useState<string>('');
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [voting, setVoting] = useState(false);
  const [insights, setInsights] = useState<DebateInsights | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [hasTurnNotification, setHasTurnNotification] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const loadDebate = async () => {
    try {
      if (!debateId) {
        console.error('No debateId provided');
        Alert.alert('Error', 'Invalid debate ID');
        return;
      }
      console.log('Loading debate with ID:', debateId);
      const data = await debatesAPI.getDebate(debateId);
      console.log('Loaded debate:', data);
      setDebate(data);
    } catch (error: any) {
      console.error('Failed to load debate:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to load debate'
      );
    }
  };

  const loadStatements = async () => {
    try {
      const data = await debatesAPI.getStatements(debateId);
      setStatements(data || []);
    } catch (error: any) {
      console.error('Failed to load statements:', error);
    }
  };

  const loadVerdicts = async () => {
    try {
      const data = await debatesAPI.getVerdicts(debateId);
      setVerdicts(data || []);
    } catch (error: any) {
      console.error('Failed to load verdicts:', error);
    }
  };

  const loadLikeStatus = async () => {
    try {
      const data = await debatesAPI.getLikeStatus(debateId);
      setLikeCount(data.likeCount || 0);
      setIsLiked(data.liked || false);
    } catch (error: any) {
      console.error('Failed to load like status:', error);
    }
  };

  const loadSaveStatus = async () => {
    try {
      const data = await debatesAPI.getSaveStatus(debateId);
      setIsSaved(data.saved || false);
      setIsWatching(data.saved || false); // Using saved as watch for now
    } catch (error: any) {
      console.error('Failed to load save status:', error);
    }
  };

  const loadWatchStatus = async () => {
    try {
      const data = await debatesAPI.getWatchStatus(debateId);
      setIsWatching(data.watching || false);
    } catch (error: any) {
      console.error('Failed to load watch status:', error);
    }
  };

  const loadComments = async (page: number = 1) => {
    try {
      const result = await debatesAPI.getComments(debateId, page, commentsPerPage);
      setComments(result.comments || []);
      setCommentsTotalPages(result.totalPages || 1);
      setCommentsTotal(result.total || 0);
    } catch (error: any) {
      console.error('Failed to load comments:', error);
      setComments([]);
    }
  };

  const loadVoteData = async () => {
    if (!user || !debate) return;
    // Only load votes if debate has an opponent (can't vote on debates without opponent)
    if (!debate.opponentId) {
      setVoteData({
        userVote: null,
        voteCounts: {
          challenger: 0,
          opponent: 0,
          total: 0,
        },
      });
      return;
    }
    try {
      // Only load votes for active/waiting debates
      if (debate.status === 'ACTIVE' || debate.status === 'WAITING') {
        const data = await votesAPI.getVote(debateId);
        setVoteData(data);
      }
    } catch (error: any) {
      console.error('Failed to load vote data:', error);
      // Set default empty vote data if loading fails
      setVoteData({
        userVote: null,
        voteCounts: {
          challenger: 0,
          opponent: 0,
          total: 0,
        },
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadDebate(),
      loadStatements(),
      loadVerdicts(),
      loadLikeStatus(),
      loadSaveStatus(),
      loadWatchStatus(),
      loadComments(1),
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [debateId]);

  // Refresh data when screen comes into focus (user returns to this screen)
  useFocusEffect(
    React.useCallback(() => {
      if (debateId) {
        // Refresh debate and statements when screen is focused
        loadDebate();
        loadStatements();
        // Check for turn notifications
        if (user) {
          // Use setTimeout to avoid dependency issues
          setTimeout(() => {
            checkTurnNotifications();
          }, 500);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debateId, user?.id])
  );

  useEffect(() => {
    if (debate) {
      loadVoteData();
      loadInsights();
      loadTags();
    }
  }, [debate, user]);

  // Poll for turn notifications when debate is active and user is participant
  useEffect(() => {
    if (!debate || !user || debate.status !== 'ACTIVE') {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    const isParticipant = debate.challengerId === user.id || debate.opponentId === user.id;
    if (!isParticipant) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    // Check for turn notifications immediately
    checkTurnNotifications();
    // Also refresh debate data immediately to catch any recent changes
    loadDebate();
    loadStatements();

    // Poll every 5 seconds for turn notifications (reduced from 10 for better responsiveness)
    const interval = setInterval(() => {
      checkTurnNotifications();
      // Also refresh debate data periodically to catch state changes
      if (debate.status === 'ACTIVE') {
        loadDebate();
        loadStatements();
      }
    }, 5000);

    setPollingInterval(interval);

    return () => {
      clearInterval(interval);
    };
  }, [debate?.id, debate?.status, user?.id, isUserTurn]);

  const checkTurnNotifications = async () => {
    if (!user) return;

    try {
      const data = await notificationsAPI.getNotifications(true);
      const turnNotifications = data.notifications.filter(
        (n) =>
          (n.type === 'YOUR_TURN' || n.type === 'NEW_STATEMENT' || n.type === 'DEBATE_TURN') &&
          n.debateId === debateId &&
          !n.read
      );

      if (turnNotifications.length > 0) {
        setHasTurnNotification(true);
        // Mark notifications as read after showing
        for (const notif of turnNotifications) {
          try {
            await notificationsAPI.markAsRead(notif.id);
          } catch (error) {
            console.error('Failed to mark notification as read:', error);
          }
        }
      } else {
        setHasTurnNotification(false);
      }
    } catch (error) {
      console.error('Failed to check turn notifications:', error);
    }
  };

  const loadTags = async () => {
    if (!debate) return;
    
    // First check if tags are already in the debate object
    if (debate.tags && debate.tags.length > 0) {
      setTags(debate.tags);
      return;
    }
    
    // Otherwise fetch them
    try {
      const debateTags = await tagsAPI.getTags(debateId);
      setTags(debateTags);
    } catch (error: any) {
      console.error('Failed to load tags:', error);
      setTags([]);
    }
  };

  const loadInsights = async () => {
    if (!debate) return;
    try {
      const data = await insightsAPI.getDebateInsights(debateId);
      setInsights(data);
    } catch (error: any) {
      console.error('Failed to load insights:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAccept = async () => {
    if (!debate) return;

    Alert.alert(
      'Accept Challenge',
      `Accept this debate challenge? You will take the ${debate.challengerPosition === 'FOR' ? 'AGAINST' : 'FOR'} position.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await debatesAPI.acceptDebate(
                debateId,
                debate.challengerPosition === 'FOR' ? 'AGAINST' : 'FOR'
              );
              Alert.alert('Success', 'Debate challenge accepted!');
              loadData();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to accept challenge'
              );
            }
          },
        },
      ]
    );
  };

  const handleSubmitArgument = async () => {
    if (!argumentText.trim() || !debate || !user) {
      Alert.alert('Error', 'Please enter your argument before submitting.');
      return;
    }

    if (submitting) return; // Prevent double submission

    setSubmitting(true);
    try {
      console.log('Submitting argument for debate:', debateId, 'round:', debate.currentRound);
      const response = await debatesAPI.submitStatement(
        debateId,
        argumentText.trim(),
        debate.currentRound
      );
      console.log('Argument submitted successfully:', response);
      
      // Update debate state if returned in response
      if (response.debate) {
        setDebate(response.debate);
      }
      
      setArgumentText('');
      setHasTurnNotification(false);
      
      // Immediately reload all data to get updated debate state
      await loadData();
      
      // Immediately check for turn notifications (opponent might have submitted)
      await checkTurnNotifications();
      
      // Show success alert
      Alert.alert('Success', 'Argument submitted successfully!');
      
      // Small delay to ensure UI updates
      setTimeout(() => {
        setSubmitting(false);
      }, 300);
    } catch (error: any) {
      console.error('Error submitting argument:', error);
      const errorMessage = error.response?.data?.error || 
                           error.message || 
                           'Failed to submit argument. Please check your connection and try again.';
      
      Alert.alert(
        'Submission Failed',
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => {
              setSubmitting(false);
              // Allow retry after a brief delay
              setTimeout(() => {
                handleSubmitArgument();
              }, 500);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setSubmitting(false),
          },
        ]
      );
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to like debates');
      return;
    }

    try {
      const data = await debatesAPI.toggleLike(debateId);
      setLikeCount(data.likeCount);
      setIsLiked(data.liked);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to toggle like'
      );
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save debates');
      return;
    }

    try {
      const data = await debatesAPI.toggleSave(debateId);
      setIsSaved(data.saved);
      setIsWatching(data.saved); // Sync watch status with save
      Alert.alert(
        data.saved ? 'Saved' : 'Unsaved',
        data.saved ? 'Debate saved to your collection' : 'Debate removed from saved'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to toggle save'
      );
    }
  };

  const handleToggleWatch = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to watch debates');
      return;
    }

    try {
      const data = await debatesAPI.toggleWatch(debateId);
      setIsWatching(data.watching);
      setIsSaved(data.watching); // Sync save status with watch
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to toggle watch'
      );
    }
  };

  const handleSubmitComment = async () => {
    haptics.medium();
    if (!commentText.trim() || !user) return;

    setSubmittingComment(true);
    try {
      await debatesAPI.createComment(debateId, commentText.trim(), replyToCommentId || undefined);
      setCommentText('');
      setReplyToCommentId(null);
      setReplyingToUsername('');
      // Reset to page 1 and reload comments after submitting
      setCommentsPage(1);
      await loadComments(1);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to submit comment'
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = await debatesAPI.shareDebate(debateId, 'native_share');
      const shareUrl = shareData.shareUrl || `https://honorable.ai/debate/${debateId}`;
      
      await Share.share({
        message: `Check out this debate: "${debate?.topic}"\n${shareUrl}`,
        title: debate?.topic || 'Debate',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share debate');
      }
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Debate',
      'Are you sure you want to report this debate? Our moderators will review it.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/debates/${debateId}/report`, {
                reason: 'Inappropriate content',
                description: '',
              });
              Alert.alert('Success', 'Report submitted. Our moderators will review it.');
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to submit report'
              );
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#00ff00';
      case 'WAITING':
        return '#ffaa00';
      case 'VERDICT_READY':
        return '#00aaff';
      case 'COMPLETED':
        return '#888';
      default:
        return '#666';
    }
  };

  // Check if this is a GROUP debate (tournament debate)
  const isGroupDebate = debate?.challengeType === 'GROUP' || 
                       (debate?.participants && debate.participants.length > 2);

  // For GROUP debates, check participants array; for regular debates, check challenger/opponent
  const isParticipant = debate && user && (
    isGroupDebate
      ? (debate.participants?.some(p => 
          (p.userId === user.id || (p as any).user?.id === user.id) &&
          ((p as any).status === 'ACTIVE' || (p as any).status === 'ACCEPTED')
        ) || false)
      : (debate.challengerId === user.id || debate.opponentId === user.id)
  );

  const isChallenger = debate && user && debate.challengerId === user.id;
  const isOpponent = debate && user && debate.opponentId === user.id;

  // Check if it's the user's turn to submit
  // First, check if there are any statements in the current round
  const currentRoundStatements = statements.filter(s => s.round === debate?.currentRound);
  const challengerSubmitted = currentRoundStatements.some(s => s.authorId === debate?.challengerId);
  const opponentSubmitted = currentRoundStatements.some(s => s.authorId === debate?.opponentId);
  const userSubmitted = currentRoundStatements.some(s => s.authorId === user?.id);
  const noStatementsInRound = currentRoundStatements.length === 0;

  // For GROUP debates: user can submit if they haven't submitted yet (simultaneous submissions)
  // For regular debates: turn-based logic
  const isUserTurn = debate && user && debate.status === 'ACTIVE' && (
    isGroupDebate
      ? !userSubmitted // For GROUP: anyone can submit if they haven't
      : (
        // First round: challenger goes first if no statements yet
        (noStatementsInRound && isChallenger) ||
        // Challenger's turn: opponent submitted but challenger hasn't
        (isChallenger && opponentSubmitted && !challengerSubmitted) ||
        // Opponent's turn: challenger submitted but opponent hasn't
        (isOpponent && challengerSubmitted && !opponentSubmitted)
      )
  );

  // Can submit if: debate is active, user is participant, hasn't submitted yet, and it's their turn
  const canSubmit = debate && 
    debate.status === 'ACTIVE' && 
    isParticipant &&
    !userSubmitted &&
    isUserTurn;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!debate) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Debate not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Your Turn Banner */}
      {isUserTurn && debate && (
        <YourTurnBanner
          debateTopic={debate.topic}
          round={debate.currentRound}
          onPress={() => {
            // Scroll to submit form if it exists
            setHasTurnNotification(false);
          }}
          visible={isUserTurn && (hasTurnNotification || canSubmit)}
        />
      )}
      
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        contentContainerStyle={{ paddingBottom: 100, paddingTop: isUserTurn && (hasTurnNotification || canSubmit) ? 80 : 0 }}
      >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.category}>{debate.category}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(debate.status) }]}>
            <Text style={styles.statusText}>{debate.status}</Text>
          </View>
        </View>

        {/* Topic */}
        <Text style={styles.topic}>{debate.topic}</Text>
        {debate.description && (
          <Text style={styles.description}>{debate.description}</Text>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View
                key={tag.id}
                style={[styles.tagChip, { backgroundColor: tag.color + '20', borderColor: tag.color }]}
              >
                <Text style={[styles.tagText, { color: tag.color }]}>#{tag.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tournament Badge */}
        {debate.tournamentMatch && (
          <View style={styles.tournamentBadge}>
            <Text style={styles.tournamentBadgeText}>
              Tournament: {debate.tournamentMatch.tournament.name} • Round {debate.tournamentMatch.round.roundNumber}/{debate.tournamentMatch.tournament.totalRounds}
            </Text>
          </View>
        )}

        {/* Participants */}
        <View style={styles.participantsSection}>
          {isGroupDebate && debate.participants && debate.participants.length > 0 ? (
            // GROUP debate: Show all participants
            <>
              <Text style={styles.sectionTitle}>Participants ({debate.participants.length})</Text>
              {debate.participants.map((participant) => {
                const participantUser = (participant as any).user;
                const isEliminated = (participant as any).status === 'ELIMINATED';
                
                return (
                  <TouchableOpacity
                    key={participant.id}
                    style={[
                      styles.participantCard,
                      isEliminated && styles.eliminatedCard,
                    ]}
                    onPress={() =>
                      navigation.navigate('UserProfile' as never, {
                        userId: participant.userId,
                      })
                    }
                  >
                    <Text style={styles.participantName}>
                      {participantUser?.username || 'Unknown'}
                    </Text>
                    <Text style={styles.participantElo}>
                      ELO: {participantUser?.eloRating || 1200}
                    </Text>
                    {isEliminated && (
                      <Text style={styles.eliminatedText}>
                        ✗ Eliminated
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            // Regular 1v1 debate: Show challenger vs opponent
            <>
              <TouchableOpacity
                style={styles.participantCard}
                onPress={() =>
                  debate.challenger &&
                  navigation.navigate('UserProfile' as never, {
                    userId: debate.challenger.id,
                  })
                }
              >
                <Text style={styles.participantLabel}>Challenger</Text>
                <Text style={styles.participantName}>
                  {debate.challenger?.username || 'Unknown'}
                </Text>
                <Text style={styles.participantPosition}>
                  Position: {debate.challengerPosition}
                </Text>
                <Text style={styles.participantElo}>
                  ELO: {debate.challenger?.eloRating || 1200}
                </Text>
                {voteData && (debate.status === 'ACTIVE' || debate.status === 'WAITING') && (
                  <View style={styles.voteCount}>
                    <Ionicons name="people" size={14} color="#888" />
                    <Text style={styles.voteCountText}>
                      {voteData.voteCounts.challenger} votes
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {debate.opponent ? (
                <TouchableOpacity
                  style={styles.participantCard}
                  onPress={() =>
                    navigation.navigate('UserProfile' as never, {
                      userId: debate.opponent!.id,
                    })
                  }
                >
                  <Text style={styles.participantLabel}>Opponent</Text>
                  <Text style={styles.participantName}>
                    {debate.opponent.username}
                  </Text>
                  <Text style={styles.participantPosition}>
                    Position: {debate.opponentPosition}
                  </Text>
                  <Text style={styles.participantElo}>
                    ELO: {debate.opponent.eloRating}
              </Text>
              {voteData && (debate.status === 'ACTIVE' || debate.status === 'WAITING') && (
                <View style={styles.voteCount}>
                  <Ionicons name="people" size={14} color="#888" />
                  <Text style={styles.voteCountText}>
                    {voteData.voteCounts.opponent} votes
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.participantCard}>
              <Text style={styles.participantLabel}>Waiting for opponent</Text>
              {!isParticipant && (
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={handleAccept}
                >
                  <Text style={styles.acceptButtonText}>Accept Challenge</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Round Info */}
        <View style={styles.roundInfo}>
          <View style={styles.roundHeader}>
            <Text style={styles.roundText}>
              Round {debate.tournamentMatch 
                ? debate.tournamentMatch.round.roundNumber 
                : debate.currentRound} / {debate.tournamentMatch 
                ? debate.tournamentMatch.tournament.totalRounds 
                : debate.totalRounds}
            </Text>
            {debate.status === 'ACTIVE' && isUserTurn && (
              <View style={styles.turnIndicator}>
                <Text style={styles.turnText}>Your Turn!</Text>
              </View>
            )}
          </View>
          {debate.roundDeadline && (
            <View style={styles.deadlineContainer}>
              <Text style={styles.deadlineLabel}>Round Deadline:</Text>
              <AnimatedCountdownTimer
                deadline={new Date(debate.roundDeadline)}
                size="small"
                showDays={true}
                onExpire={() => {
                  // Reload debate when deadline expires
                  loadDebate();
                  loadStatements();
                }}
              />
            </View>
          )}
          {debate.status === 'ACTIVE' && !isUserTurn && isParticipant && (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="small" color="#ffaa00" style={{ marginRight: 8 }} />
              <Text style={styles.waitingText}>
                Waiting for {isChallenger ? debate.opponent?.username : debate.challenger?.username} to submit...
              </Text>
            </View>
          )}
        </View>

        {/* Voting Section - Only for active/waiting debates and non-participants */}
        {user &&
          !isParticipant &&
          (debate.status === 'ACTIVE' || debate.status === 'WAITING') &&
          debate.opponent && (
            <View style={styles.votingSection}>
              <Text style={styles.votingTitle}>Who do you think will win?</Text>
              <View style={styles.votingButtons}>
                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    voteData?.userVote?.predictedWinnerId === debate.challengerId &&
                      styles.voteButtonActive,
                  ]}
                  onPress={async () => {
                    if (!debate.challengerId) return;
                    setVoting(true);
                    try {
                      const result = await votesAPI.vote(debateId, debate.challengerId);
                      setVoteData(result);
                      Alert.alert('Vote Recorded', 'Your prediction has been saved!');
                    } catch (error: any) {
                      Alert.alert(
                        'Error',
                        error.response?.data?.error || 'Failed to vote'
                      );
                    } finally {
                      setVoting(false);
                    }
                  }}
                  disabled={voting}
                >
                  <Ionicons
                    name={
                      voteData?.userVote?.predictedWinnerId === debate.challengerId
                        ? 'checkmark-circle'
                        : 'radio-button-off'
                    }
                    size={20}
                    color={
                      voteData?.userVote?.predictedWinnerId === debate.challengerId
                        ? '#00ff00'
                        : '#fff'
                    }
                  />
                  <Text style={styles.voteButtonText}>
                    {debate.challenger?.username}
                  </Text>
                  {voteData && (
                    <Text style={styles.votePercentage}>
                      {voteData.voteCounts.total > 0
                        ? Math.round(
                            (voteData.voteCounts.challenger / voteData.voteCounts.total) * 100
                          )
                        : 0}
                      %
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    voteData?.userVote?.predictedWinnerId === debate.opponentId &&
                      styles.voteButtonActive,
                  ]}
                  onPress={async () => {
                    if (!debate.opponentId) return;
                    setVoting(true);
                    try {
                      const result = await votesAPI.vote(debateId, debate.opponentId);
                      setVoteData(result);
                      Alert.alert('Vote Recorded', 'Your prediction has been saved!');
                    } catch (error: any) {
                      Alert.alert(
                        'Error',
                        error.response?.data?.error || 'Failed to vote'
                      );
                    } finally {
                      setVoting(false);
                    }
                  }}
                  disabled={voting}
                >
                  <Ionicons
                    name={
                      voteData?.userVote?.predictedWinnerId === debate.opponentId
                        ? 'checkmark-circle'
                        : 'radio-button-off'
                    }
                    size={20}
                    color={
                      voteData?.userVote?.predictedWinnerId === debate.opponentId
                        ? '#00ff00'
                        : '#fff'
                    }
                  />
                  <Text style={styles.voteButtonText}>
                    {debate.opponent.username}
                  </Text>
                  {voteData && (
                    <Text style={styles.votePercentage}>
                      {voteData.voteCounts.total > 0
                        ? Math.round(
                            (voteData.voteCounts.opponent / voteData.voteCounts.total) * 100
                          )
                        : 0}
                      %
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              {voteData && voteData.voteCounts.total > 0 && (
                <Text style={styles.voteTotal}>
                  {voteData.voteCounts.total} {voteData.voteCounts.total === 1 ? 'vote' : 'votes'} total
                </Text>
              )}
            </View>
          )}

        {/* Like, Save, and Share Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleLike}
            disabled={!user}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? '#ff0000' : '#fff'}
            />
            <Text style={styles.actionButtonText}>{likeCount} likes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleSave}
            disabled={!user}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? '#00aaff' : '#fff'}
            />
            <Text style={styles.actionButtonText}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleWatch}
            disabled={!user}
          >
            <Ionicons
              name={isWatching ? 'eye' : 'eye-outline'}
              size={20}
              color={isWatching ? '#00ff00' : '#fff'}
            />
            <Text style={styles.actionButtonText}>
              {isWatching ? 'Watching' : 'Watch'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color="#fff"
            />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Insights Section */}
        {insights && (
          <View style={styles.insightsSection}>
            <TouchableOpacity
              style={styles.insightsHeader}
              onPress={() => setShowInsights(!showInsights)}
            >
              <View style={styles.insightsHeaderLeft}>
                <Ionicons name="analytics-outline" size={20} color="#00aaff" />
                <Text style={styles.insightsTitle}>Debate Insights</Text>
                {insights.insights.isPopular && (
                  <View style={styles.popularBadge}>
                    <Ionicons name="flame" size={12} color="#ffaa00" />
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                )}
              </View>
              <Ionicons
                name={showInsights ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>

            {showInsights && (
              <View style={styles.insightsContent}>
                <View style={styles.insightsStats}>
                  <View style={styles.insightStat}>
                    <Ionicons name="chatbubbles-outline" size={16} color="#00aaff" />
                    <Text style={styles.insightStatValue}>
                      {insights.statistics.comments}
                    </Text>
                    <Text style={styles.insightStatLabel}>Comments</Text>
                  </View>
                  <View style={styles.insightStat}>
                    <Ionicons name="heart-outline" size={16} color="#ff0000" />
                    <Text style={styles.insightStatValue}>
                      {insights.statistics.likes}
                    </Text>
                    <Text style={styles.insightStatLabel}>Likes</Text>
                  </View>
                  <View style={styles.insightStat}>
                    <Ionicons name="people-outline" size={16} color="#00ff00" />
                    <Text style={styles.insightStatValue}>
                      {insights.statistics.votes}
                    </Text>
                    <Text style={styles.insightStatLabel}>Votes</Text>
                  </View>
                  <View style={styles.insightStat}>
                    <Ionicons name="eye-outline" size={16} color="#888" />
                    <Text style={styles.insightStatValue}>
                      {insights.statistics.views}
                    </Text>
                    <Text style={styles.insightStatLabel}>Views</Text>
                  </View>
                </View>

                <View style={styles.engagementBar}>
                  <Text style={styles.engagementLabel}>Engagement</Text>
                  <View style={styles.engagementBarContainer}>
                    <View
                      style={[
                        styles.engagementBarFill,
                        {
                          width: `${Math.min(
                            (insights.statistics.engagementScore / 200) * 100,
                            100
                          )}%`,
                          backgroundColor:
                            insights.insights.engagementLevel === 'high'
                              ? '#00ff00'
                              : insights.insights.engagementLevel === 'medium'
                              ? '#ffaa00'
                              : '#666',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.engagementScore}>
                    {insights.statistics.engagementScore} points
                  </Text>
                </View>

                {insights.recentActivity.statements > 0 ||
                  insights.recentActivity.comments > 0 ||
                  (insights.recentActivity.likes > 0 && (
                    <View style={styles.recentActivity}>
                      <Text style={styles.recentActivityTitle}>
                        Recent Activity (24h)
                      </Text>
                      <View style={styles.recentActivityStats}>
                        {insights.recentActivity.statements > 0 && (
                          <Text style={styles.recentActivityText}>
                            {insights.recentActivity.statements} new statements
                          </Text>
                        )}
                        {insights.recentActivity.comments > 0 && (
                          <Text style={styles.recentActivityText}>
                            {insights.recentActivity.comments} new comments
                          </Text>
                        )}
                        {insights.recentActivity.likes > 0 && (
                          <Text style={styles.recentActivityText}>
                            {insights.recentActivity.likes} new likes
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* Additional Actions */}
        {user && (
          <View style={styles.additionalActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={async () => {
                try {
                  const markdown = await debatesAPI.exportDebate(debateId);
                  await Share.share({
                    message: markdown,
                    title: `Debate: ${debate?.topic}`,
                  });
                } catch (error: any) {
                  if (error.message !== 'User did not share') {
                    Alert.alert('Error', 'Failed to export debate');
                  }
                }
              }}
            >
              <Ionicons name="download-outline" size={16} color="#00aaff" />
              <Text style={styles.secondaryButtonText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleReport}
            >
              <Ionicons name="flag-outline" size={16} color="#ff0000" />
              <Text style={styles.secondaryButtonText}>Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Statements/Arguments */}
        <Text style={styles.sectionTitle}>Arguments</Text>
        {statements.length === 0 ? (
          <Text style={styles.emptyText}>No arguments submitted yet.</Text>
        ) : (
          statements.map((stmt) => (
            <View key={stmt.id} style={styles.statementCard}>
              <View style={styles.statementHeader}>
                <Text style={styles.statementAuthor}>{stmt.author.username}</Text>
                <Text style={styles.statementRound}>Round {stmt.round}</Text>
              </View>
              <Text style={styles.statementContent}>{stmt.content}</Text>
              <Text style={styles.statementDate}>
                {new Date(stmt.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}

        {/* Submit Argument Form */}
        {canSubmit && (
          <View style={styles.submitSection}>
            <View style={styles.submitHeader}>
              <Text style={styles.submitTitle}>Submit Your Argument</Text>
              {isUserTurn && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>Your Turn!</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[
                styles.argumentInput,
                submitting && styles.argumentInputDisabled,
              ]}
              placeholder="Write your argument..."
              placeholderTextColor="#666"
              value={argumentText}
              onChangeText={setArgumentText}
              multiline
              numberOfLines={6}
              editable={!submitting}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!argumentText.trim() || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitArgument}
              disabled={!argumentText.trim() || submitting}
            >
              {submitting ? (
                <View style={styles.submitButtonLoading}>
                  <ActivityIndicator color="#000" size="small" />
                  <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                    Submitting...
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Submit Argument</Text>
              )}
            </TouchableOpacity>
            {submitting && (
              <Text style={styles.submitHint}>
                Please wait while we submit your argument...
              </Text>
            )}
          </View>
        )}

        {/* Verdict Section */}
        {debate.verdictReached && (
          <View style={styles.verdictSection}>
            <Text style={styles.sectionTitle}>Verdict</Text>
            
            {/* Overall Winner */}
            {debate.winnerId && (
              <View style={styles.winnerCard}>
                <Text style={styles.winnerLabel}>Winner</Text>
                <Text style={styles.winnerName}>
                  {debate.winnerId === debate.challengerId
                    ? debate.challenger?.username
                    : debate.opponent?.username}
                </Text>
                {debate.verdictDate && (
                  <Text style={styles.verdictDate}>
                    {new Date(debate.verdictDate).toLocaleString()}
                  </Text>
                )}
              </View>
            )}

            {/* ELO Changes */}
            {(debate.challengerEloChange !== null || debate.opponentEloChange !== null) && (
              <View style={styles.eloChangesCard}>
                <Text style={styles.eloChangesTitle}>ELO Changes</Text>
                <View style={styles.eloChangeRow}>
                  <Text style={styles.eloChangeLabel}>
                    {debate.challenger?.username}:
                  </Text>
                  <Text
                    style={[
                      styles.eloChangeValue,
                      (debate.challengerEloChange || 0) >= 0
                        ? styles.eloPositive
                        : styles.eloNegative,
                    ]}
                  >
                    {(debate.challengerEloChange || 0) >= 0 ? '+' : ''}
                    {debate.challengerEloChange || 0}
                  </Text>
                </View>
                {debate.opponent && (
                  <View style={styles.eloChangeRow}>
                    <Text style={styles.eloChangeLabel}>
                      {debate.opponent.username}:
                    </Text>
                    <Text
                      style={[
                        styles.eloChangeValue,
                        (debate.opponentEloChange || 0) >= 0
                          ? styles.eloPositive
                          : styles.eloNegative,
                      ]}
                    >
                      {(debate.opponentEloChange || 0) >= 0 ? '+' : ''}
                      {debate.opponentEloChange || 0}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Individual Judge Verdicts */}
            {verdicts.length > 0 && (
              <View style={styles.judgesSection}>
                <Text style={styles.judgesTitle}>Judge Decisions</Text>
                {verdicts.map((verdict) => (
                  <View key={verdict.id} style={styles.judgeVerdictCard}>
                    <View style={styles.judgeHeader}>
                      <Text style={styles.judgeEmoji}>{verdict.judge.emoji}</Text>
                      <View style={styles.judgeInfo}>
                        <Text style={styles.judgeName}>{verdict.judge.name}</Text>
                        <Text style={styles.judgePersonality}>
                          {verdict.judge.personality}
                        </Text>
                      </View>
                      <View style={styles.decisionBadge}>
                        <Text
                          style={[
                            styles.decisionText,
                            verdict.decision === 'CHALLENGER_WINS' && styles.decisionChallenger,
                            verdict.decision === 'OPPONENT_WINS' && styles.decisionOpponent,
                            verdict.decision === 'TIE' && styles.decisionTie,
                          ]}
                        >
                          {verdict.decision === 'CHALLENGER_WINS'
                            ? 'Challenger'
                            : verdict.decision === 'OPPONENT_WINS'
                            ? 'Opponent'
                            : 'Tie'}
                        </Text>
                      </View>
                    </View>
                    {verdict.challengerScore !== null &&
                      verdict.opponentScore !== null && (
                        <View style={styles.scoresRow}>
                          <Text style={styles.scoreText}>
                            {debate.challenger?.username}: {verdict.challengerScore}
                          </Text>
                          <Text style={styles.scoreText}>
                            {debate.opponent?.username}: {verdict.opponentScore}
                          </Text>
                        </View>
                      )}
                    <Text style={styles.reasoningText}>{verdict.reasoning}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments ({commentsTotal || comments.length})</Text>


          {/* Comments List */}
          {comments.length === 0 ? (
            <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
          ) : (
            <>
              {comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('UserProfile' as never, {
                        userId: comment.user.id,
                      })
                    }
                  >
                    <Text style={styles.commentAuthor}>{comment.user.username}</Text>
                  </TouchableOpacity>
                  <Text style={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>

                {/* Reply Button */}
                {user && (
                  <TouchableOpacity
                    style={styles.replyButton}
                    onPress={() => {
                      setReplyToCommentId(comment.id);
                      setReplyingToUsername(comment.user.username);
                    }}
                  >
                    <Ionicons name="arrow-undo-outline" size={14} color="#00aaff" />
                    <Text style={styles.replyButtonText}>Reply</Text>
                  </TouchableOpacity>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {comment.replies.map((reply: any) => (
                      <View key={reply.id} style={styles.replyCard}>
                        <View style={styles.replyHeader}>
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate('UserProfile' as never, {
                                userId: reply.user.id,
                              })
                            }
                          >
                            <Text style={styles.replyAuthor}>{reply.user.username}</Text>
                          </TouchableOpacity>
                          <Text style={styles.replyDate}>
                            {new Date(reply.createdAt).toLocaleString()}
                          </Text>
                        </View>
                        <Text style={styles.replyContent}>{reply.content}</Text>
                        {user && (
                          <TouchableOpacity
                            style={styles.replyButton}
                            onPress={() => {
                              setReplyToCommentId(comment.id);
                              setReplyingToUsername(reply.user.username);
                            }}
                          >
                            <Ionicons name="arrow-undo-outline" size={14} color="#00aaff" />
                            <Text style={styles.replyButtonText}>Reply</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
              ))}
              {commentsTotalPages > 1 && (
                <Pagination
                  currentPage={commentsPage}
                  totalPages={commentsTotalPages}
                  onPageChange={(page) => {
                    haptics.selection();
                    setCommentsPage(page);
                    loadComments(page);
                  }}
                  itemsPerPage={commentsPerPage}
                  totalItems={commentsTotal}
                />
              )}
            </>
          )}
        </View>
      </View>

      {/* Fixed Comment Input at Bottom */}
      {user && (
        <CommentInput
          value={commentText}
          onChangeText={setCommentText}
          onSubmit={handleSubmitComment}
          submitting={submittingComment}
          placeholder={replyToCommentId ? `Reply to ${replyingToUsername}...` : 'Add a comment...'}
          replyingTo={replyingToUsername || undefined}
          onCancelReply={() => {
            setReplyToCommentId(null);
            setReplyingToUsername('');
          }}
        />
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#000',
    fontWeight: '600',
  },
  topic: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
    lineHeight: 22,
  },
  participantsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  tournamentBadge: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  tournamentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  eliminatedCard: {
    backgroundColor: '#2a1111',
    borderColor: '#ff4444',
    opacity: 0.7,
  },
  eliminatedText: {
    fontSize: 12,
    color: '#ff6666',
    marginTop: 4,
    fontWeight: '600',
  },
  participantCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  participantLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  participantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  participantPosition: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  participantElo: {
    fontSize: 12,
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  roundInfo: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roundText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  turnIndicator: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  turnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  deadlineText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
  },
  waitingText: {
    fontSize: 14,
    color: '#ffaa00',
    fontStyle: 'italic',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  statementCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statementAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statementRound: {
    fontSize: 12,
    color: '#888',
  },
  statementContent: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  statementDate: {
    fontSize: 11,
    color: '#666',
  },
  submitSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  submitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  submitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: '#00d9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  urgentBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  argumentInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  argumentInputDisabled: {
    opacity: 0.6,
    backgroundColor: '#0a0a0a',
  },
  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitHint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  verdictSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  winnerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
  },
  winnerLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  winnerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  verdictDate: {
    fontSize: 12,
    color: '#666',
  },
  eloChangesCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  eloChangesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  eloChangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eloChangeLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  eloChangeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  eloPositive: {
    color: '#00ff00',
  },
  eloNegative: {
    color: '#ff0000',
  },
  judgesSection: {
    marginTop: 16,
  },
  judgesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  judgeVerdictCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  judgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  judgeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  judgeInfo: {
    flex: 1,
  },
  judgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  judgePersonality: {
    fontSize: 12,
    color: '#888',
  },
  decisionBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  decisionText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  decisionChallenger: {
    color: '#00ff00',
  },
  decisionOpponent: {
    color: '#ff0000',
  },
  decisionTie: {
    color: '#ffaa00',
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scoreText: {
    fontSize: 14,
    color: '#ccc',
  },
  reasoningText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    paddingTop: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 40,
    maxHeight: 100,
    marginRight: 8,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  commentSubmitButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  commentCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  commentDate: {
    fontSize: 11,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  repliesContainer: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#333',
  },
  replyCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  replyDate: {
    fontSize: 10,
    color: '#666',
  },
  replyContent: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  additionalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  votingSection: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  votingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#333',
    gap: 8,
  },
  voteButtonActive: {
    borderColor: '#00ff00',
    backgroundColor: '#00ff0020',
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  votePercentage: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  voteTotal: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  voteCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  voteCountText: {
    fontSize: 12,
    color: '#888',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  deadlineLabel: {
    fontSize: 14,
    color: '#ffaa00',
    fontWeight: '600',
  },
  insightsSection: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffaa0020',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    color: '#ffaa00',
    fontWeight: '600',
  },
  insightsContent: {
    marginTop: 16,
  },
  insightsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  insightStat: {
    alignItems: 'center',
    gap: 4,
  },
  insightStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  insightStatLabel: {
    fontSize: 11,
    color: '#888',
  },
  engagementBar: {
    marginBottom: 16,
  },
  engagementLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  engagementBarContainer: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  engagementBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  engagementScore: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  recentActivity: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  recentActivityTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  recentActivityStats: {
    gap: 4,
  },
  recentActivityText: {
    fontSize: 13,
    color: '#888',
  },
});

