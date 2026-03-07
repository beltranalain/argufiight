import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, User, Lock, Shield, Bell, Sun, Gem, HelpCircle, FileText, LogOut, ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, title, desc, onPress, danger }: SettingsRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.redMuted : colors.surface2 }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: danger ? colors.red : colors.text }]}>{title}</Text>
        {desc && <Text style={[styles.rowDesc, { color: colors.text3 }]}>{desc}</Text>}
      </View>
      {!danger && <ChevronRight size={16} color={colors.text3} />}
    </TouchableOpacity>
  );
}

export function SettingsScreen({ navigation }: any) {
  const { colors, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try { await authApi.logout(); } catch {}
          await clearAuth();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile summary */}
        <TouchableOpacity
          style={[styles.profileRow, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('MyProfile')}
        >
          <Avatar src={user?.avatarUrl} fallback={user?.username ?? 'U'} size="lg" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.username}</Text>
            <Text style={{ color: colors.text3, fontSize: 13 }}>{user?.email}</Text>
          </View>
          <ChevronRight size={18} color={colors.text3} />
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: colors.text3 }]}>Account</Text>
        <SettingsRow icon={<User size={18} color={colors.text2} />} title="Edit Profile" desc="Username, bio, avatar" onPress={() => navigation.navigate('EditProfile')} />
        <SettingsRow icon={<Lock size={18} color={colors.text2} />} title="Change Password" desc="Update your password" onPress={() => navigation.navigate('ChangePassword')} />
        <SettingsRow icon={<Shield size={18} color={colors.text2} />} title="Two-Factor Auth" desc="Secure your account with 2FA" onPress={() => navigation.navigate('TwoFactor')} />

        <Text style={[styles.sectionLabel, { color: colors.text3 }]}>Preferences</Text>
        <SettingsRow icon={<Bell size={18} color={colors.text2} />} title="Notifications" desc="Push & email preferences" onPress={() => navigation.navigate('NotificationPrefs')} />
        <SettingsRow icon={<Sun size={18} color={colors.text2} />} title="Appearance" desc="Dark mode, theme" onPress={() => toggleTheme()} />

        <Text style={[styles.sectionLabel, { color: colors.text3 }]}>Subscription</Text>
        <SettingsRow icon={<Gem size={18} color={colors.accent} />} title="Manage Subscription" desc="View or upgrade your plan" onPress={() => navigation.navigate('Upgrade')} />

        <Text style={[styles.sectionLabel, { color: colors.text3 }]}>Support</Text>
        <SettingsRow icon={<HelpCircle size={18} color={colors.text2} />} title="Help & Support" desc="FAQs, contact us" onPress={() => navigation.navigate('Support')} />
        <SettingsRow icon={<FileText size={18} color={colors.text2} />} title="Legal" desc="Privacy Policy, Terms" onPress={() => navigation.navigate('Privacy')} />

        <View style={{ height: 24 }} />
        <SettingsRow icon={<LogOut size={18} color={colors.red} />} title="Sign Out" onPress={handleSignOut} danger />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '500' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1 },
  profileName: { fontSize: 17, fontWeight: '500' },
  sectionLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.96, paddingHorizontal: 24, marginTop: 24, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1 },
  rowIcon: { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '500' },
  rowDesc: { fontSize: 12, marginTop: 1 },
});
