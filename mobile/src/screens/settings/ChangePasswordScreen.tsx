import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';

export function ChangePasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPw !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await authApi.changePassword(current, newPw);
      Alert.alert('Success', 'Password updated.');
      navigation.goBack();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Input
          label="Current Password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry={!showCurrent}
          rightIcon={
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? <EyeOff size={18} color={colors.text3} /> : <Eye size={18} color={colors.text3} />}
            </TouchableOpacity>
          }
        />
        <Input
          label="New Password"
          value={newPw}
          onChangeText={setNewPw}
          secureTextEntry={!showNew}
          rightIcon={
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff size={18} color={colors.text3} /> : <Eye size={18} color={colors.text3} />}
            </TouchableOpacity>
          }
        />
        <Input
          label="Confirm New Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          error={error || undefined}
        />
        <Button variant="accent" size="lg" fullWidth loading={loading} onPress={handleSave}>
          Update Password
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '500' },
});
