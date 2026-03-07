import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';

export function PrivacyScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
          Your privacy is important to us. This Privacy Policy explains how ArguFight collects, uses, and protects your information when you use our mobile application.
          {'\n\n'}
          For the full privacy policy, please visit www.argufight.com/privacy
        </Text>
        <TouchableOpacity
          style={{ marginTop: 24 }}
          onPress={() => navigation.navigate('Terms')}
        >
          <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '500' }}>
            View Terms of Service
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '500' },
});
