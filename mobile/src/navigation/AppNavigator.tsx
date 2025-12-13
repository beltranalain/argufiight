import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationsAPI } from '../services/notificationsAPI';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';

// Main Screens
import HomeScreen from '../screens/Home/HomeScreen';
import DebatesScreen from '../screens/Debates/DebatesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import LeaderboardScreen from '../screens/Leaderboard/LeaderboardScreen';
import CreateDebateScreen from '../screens/Create/CreateDebateScreen';
import DebateDetailScreen from '../screens/DebateDetail/DebateDetailScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import UserProfileScreen from '../screens/UserProfile/UserProfileScreen';
import SavedDebatesScreen from '../screens/Saved/SavedDebatesScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import StatsScreen from '../screens/Stats/StatsScreen';
import DebateHistoryScreen from '../screens/History/DebateHistoryScreen';
import RecommendedDebatesScreen from '../screens/Recommended/RecommendedDebatesScreen';
import AchievementsScreen from '../screens/Achievements/AchievementsScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import CategoriesScreen from '../screens/Categories/CategoriesScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import RemindersScreen from '../screens/Reminders/RemindersScreen';
import ActivityScreen from '../screens/Activity/ActivityScreen';
import ChallengesScreen from '../screens/Challenges/ChallengesScreen';
import FollowersScreen from '../screens/Followers/FollowersScreen';
import PreviewDebateScreen from '../screens/Preview/PreviewDebateScreen';
import TournamentsScreen from '../screens/Tournaments/TournamentsScreen';
import TournamentDetailScreen from '../screens/Tournaments/TournamentDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const data = await notificationsAPI.getNotifications(true);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={({ navigation }) => ({ 
          title: 'Arena',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications' as never)}
              style={{ position: 'relative', marginRight: 16 }}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen 
        name="Debates" 
        component={DebatesScreen}
        options={{ 
          title: 'Debates',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="CreateDebate" 
        component={CreateDebateScreen}
        options={{ 
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{ 
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#000',
      },
      headerTintColor: '#fff',
    }}
  >
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="DebateDetail" 
      component={DebateDetailScreen}
      options={{ title: 'Debate Details' }}
    />
    <Stack.Screen 
      name="Notifications" 
      component={NotificationsScreen}
      options={{ title: 'Notifications' }}
    />
    <Stack.Screen 
      name="UserProfile" 
      component={UserProfileScreen}
      options={{ title: 'User Profile' }}
    />
    <Stack.Screen 
      name="SavedDebates" 
      component={SavedDebatesScreen}
      options={{ title: 'Saved Debates' }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
    <Stack.Screen 
      name="Stats" 
      component={StatsScreen}
      options={{ title: 'Statistics' }}
    />
    <Stack.Screen 
      name="DebateHistory" 
      component={DebateHistoryScreen}
      options={{ title: 'Debate History' }}
    />
    <Stack.Screen 
      name="RecommendedDebates" 
      component={RecommendedDebatesScreen}
      options={{ title: 'Recommended' }}
    />
    <Stack.Screen 
      name="Achievements" 
      component={AchievementsScreen}
      options={{ title: 'Achievements' }}
    />
    <Stack.Screen 
      name="Search" 
      component={SearchScreen}
      options={{ title: 'Search' }}
    />
    <Stack.Screen 
      name="Categories" 
      component={CategoriesScreen}
      options={{ title: 'Categories' }}
    />
    <Stack.Screen 
      name="Analytics" 
      component={AnalyticsScreen}
      options={{ title: 'Analytics' }}
    />
    <Stack.Screen 
      name="Reminders" 
      component={RemindersScreen}
      options={{ title: 'Upcoming Deadlines' }}
    />
    <Stack.Screen 
      name="Activity" 
      component={ActivityScreen}
      options={{ title: 'Activity Feed' }}
    />
          <Stack.Screen
            name="Challenges"
            component={ChallengesScreen}
            options={{ title: 'Challenges & Streaks' }}
          />
          <Stack.Screen
            name="Followers"
            component={FollowersScreen}
            options={({ route }) => ({
              title: (route.params as any)?.type === 'followers' ? 'Followers' : 'Following',
            })}
          />
          <Stack.Screen
            name="PreviewDebate"
            component={PreviewDebateScreen}
            options={{ title: 'Preview Debate' }}
          />
          <Stack.Screen
            name="Tournaments"
            component={TournamentsScreen}
            options={{ title: 'Tournaments' }}
          />
          <Stack.Screen
            name="TournamentDetail"
            component={TournamentDetailScreen}
            options={{ title: 'Tournament Details' }}
          />
        </Stack.Navigator>
);

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ff0000',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

