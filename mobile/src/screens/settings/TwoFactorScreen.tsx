import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authApi } from '../../api/auth';

export function TwoFactorScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    authApi.get2FAStatus().then((res) => {
      setEnabled(res.enabled);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSetup() {
    try {
      const res = await authApi.setup2FA();
      setQrCode(res.qrCode);
      setSecret(res.secret);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleVerify() {
    if (code.length < 6) return;
    setVerifying(true);
    try {
      await authApi.verify2FA(code);
      setEnabled(true);
      setQrCode(null);
      Alert.alert('Success', '2FA has been enabled.');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Invalid code');
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisable() {
    Alert.alert('Disable 2FA', 'Enter your 2FA code to disable.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: async () => {
          try {
            await authApi.disable2FA(code);
            setEnabled(false);
            setCode('');
            Alert.alert('Disabled', '2FA has been turned off.');
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
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
        <Text style={[styles.title, { color: colors.text }]}>Two-Factor Auth</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {loading ? null : enabled ? (
          <Card>
            <View style={styles.statusRow}>
              <ShieldCheck size={24} color={colors.green} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>2FA is enabled</Text>
                <Text style={{ color: colors.text3, fontSize: 13 }}>Your account is protected with two-factor authentication.</Text>
              </View>
            </View>
            <View style={{ marginTop: 16 }}>
              <Input label="Enter code to disable" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
              <Button variant="danger" size="md" fullWidth onPress={handleDisable}>
                Disable 2FA
              </Button>
            </View>
          </Card>
        ) : qrCode ? (
          <Card>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500', marginBottom: 12 }}>Scan QR Code</Text>
            <Text style={{ color: colors.text3, fontSize: 13, marginBottom: 16 }}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </Text>
            <View style={styles.qrWrap}>
              <Image source={{ uri: qrCode }} style={{ width: 200, height: 200 }} />
            </View>
            <Text style={{ color: colors.text3, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              Manual key: {secret}
            </Text>
            <View style={{ marginTop: 20 }}>
              <Input label="Verification Code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="Enter 6-digit code" />
              <Button variant="accent" size="lg" fullWidth loading={verifying} onPress={handleVerify}>
                Verify & Enable
              </Button>
            </View>
          </Card>
        ) : (
          <Card>
            <View style={styles.statusRow}>
              <Shield size={24} color={colors.text3} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>2FA is not enabled</Text>
                <Text style={{ color: colors.text3, fontSize: 13 }}>
                  Add an extra layer of security to your account.
                </Text>
              </View>
            </View>
            <Button variant="accent" size="md" fullWidth style={{ marginTop: 16 }} onPress={handleSetup}>
              Set Up 2FA
            </Button>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '500' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qrWrap: { alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 10, alignSelf: 'center' },
});
