import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';
import Constants from 'expo-constants';

export function AboutScreen({ navigation }: any) {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>About</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        <Text style={[styles.appName, { color: colors.text }]}>
          Argu<Text style={{ color: colors.accent, fontWeight: '600' }}>fight</Text>
        </Text>
        <Text style={{ color: colors.text3, fontSize: 14, marginTop: 4 }}>Version {version}</Text>

        <Text style={{ color: colors.text2, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 24 }}>
          ArguFight is a competitive debate platform where you can challenge opponents, sharpen your arguments, and climb the leaderboards.
        </Text>

        <View style={[styles.linksSection, { borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.argufight.com')}>
            <Text style={[styles.link, { color: colors.accent }]}>Visit Website</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
            <Text style={[styles.link, { color: colors.accent }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
            <Text style={[styles.link, { color: colors.accent }]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.text3, fontSize: 12, marginTop: 24 }}>
          Made with love by the ArguFight team
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '500' },
  appName: { fontSize: 28, fontWeight: '300', letterSpacing: 4, textTransform: 'uppercase' },
  linksSection: { width: '100%', marginTop: 24, paddingTop: 24, borderTopWidth: 1, gap: 16 },
  link: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
});
