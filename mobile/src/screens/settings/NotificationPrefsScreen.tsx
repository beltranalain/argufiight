import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { notificationsApi } from '../../api/notifications';

const PREF_ITEMS = [
  { key: 'debate_your_turn', label: 'Your Turn', desc: 'When it\'s your turn to respond' },
  { key: 'debate_challenge', label: 'New Challenges', desc: 'When someone challenges you' },
  { key: 'debate_verdict', label: 'Verdicts', desc: 'When a debate verdict is ready' },
  { key: 'message_received', label: 'Messages', desc: 'When you receive a new message' },
  { key: 'tournament_update', label: 'Tournaments', desc: 'Tournament match updates' },
  { key: 'follow_new', label: 'New Followers', desc: 'When someone follows you' },
  { key: 'rematch_request', label: 'Rematch Requests', desc: 'When someone requests a rematch' },
];

export function NotificationPrefsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.getPreferences().then((res: any) => {
      setPrefs(res ?? {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function toggle(key: string) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    notificationsApi.updatePreferences(updated).catch(() => {});
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notification Preferences</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {PREF_ITEMS.map((item) => (
          <View key={item.key} style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>{item.label}</Text>
              <Text style={{ color: colors.text3, fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
            </View>
            <Switch
              value={prefs[item.key] !== false}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: colors.surface2, true: colors.accent + '66' }}
              thumbColor={prefs[item.key] !== false ? colors.accent : colors.text3}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
});
