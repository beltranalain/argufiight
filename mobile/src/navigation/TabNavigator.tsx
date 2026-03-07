import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Swords, Trophy, Medal, Clock } from 'lucide-react-native';
import { useTheme } from '../theme';

// Screens
import { DashboardScreen } from '../screens/home/DashboardScreen';
import { TrendingScreen } from '../screens/arena/TrendingScreen';
import { LeaderboardScreen } from '../screens/leaderboard/LeaderboardScreen';
import { TournamentsListScreen } from '../screens/tournaments/TournamentsListScreen';
import { DebateHistoryScreen } from '../screens/debate/DebateHistoryScreen';
import { DebateRoomScreen } from '../screens/debate/DebateRoomScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { TournamentDetailScreen } from '../screens/tournaments/TournamentDetailScreen';

const Tab = createBottomTabNavigator();

// Stack navigators for each tab
const HomeStack = createNativeStackNavigator();
const ArenaStack = createNativeStackNavigator();
const RankingsStack = createNativeStackNavigator();
const TourneysStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="DebateRoom" component={DebateRoomScreen} />
      <HomeStack.Screen name="UserProfile" component={UserProfileScreen} />
    </HomeStack.Navigator>
  );
}

function ArenaStackScreen() {
  return (
    <ArenaStack.Navigator screenOptions={{ headerShown: false }}>
      <ArenaStack.Screen name="Trending" component={TrendingScreen} />
      <ArenaStack.Screen name="DebateRoom" component={DebateRoomScreen} />
    </ArenaStack.Navigator>
  );
}

function RankingsStackScreen() {
  return (
    <RankingsStack.Navigator screenOptions={{ headerShown: false }}>
      <RankingsStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <RankingsStack.Screen name="UserProfile" component={UserProfileScreen} />
    </RankingsStack.Navigator>
  );
}

function TourneysStackScreen() {
  return (
    <TourneysStack.Navigator screenOptions={{ headerShown: false }}>
      <TourneysStack.Screen name="Tournaments" component={TournamentsListScreen} />
      <TourneysStack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
    </TourneysStack.Navigator>
  );
}

function HistoryStackScreen() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="DebateHistory" component={DebateHistoryScreen} />
      <HistoryStack.Screen name="DebateRoom" component={DebateRoomScreen} />
    </HistoryStack.Navigator>
  );
}

export function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg + 'F2', // 95% opacity
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text3,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={20} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="ArenaTab"
        component={ArenaStackScreen}
        options={{
          tabBarLabel: 'Arena',
          tabBarIcon: ({ color }) => <Swords size={20} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tab.Screen
        name="RankingsTab"
        component={RankingsStackScreen}
        options={{
          tabBarLabel: 'Rankings',
          tabBarIcon: ({ color }) => <Trophy size={20} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tab.Screen
        name="TourneysTab"
        component={TourneysStackScreen}
        options={{
          tabBarLabel: 'Tourneys',
          tabBarIcon: ({ color }) => <Medal size={20} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStackScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <Clock size={20} color={color} strokeWidth={1.6} />,
        }}
      />
    </Tab.Navigator>
  );
}
