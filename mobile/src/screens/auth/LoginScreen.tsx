import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useTheme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Separator } from '../../components/ui/Separator';
import { authApi } from '../../api/auth';
import { rewardsApi } from '../../api/rewards';
import { useAuthStore } from '../../store/authStore';
import { BASE_URL } from '../../api/client';

/** Generate a random poll ID */
function randomId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/** Poll the server for the OAuth result */
async function pollForToken(pollId: string, maxAttempts = 15): Promise<{ token: string; user: any } | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch(`${BASE_URL}/api/auth/google/mobile-poll?id=${encodeURIComponent(pollId)}`);
      if (res.status === 200) {
        return await res.json();
      }
    } catch {}
  }
  return null;
}

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <Path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </Svg>
  );
}

export function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(email.trim(), password);

      if (data.requires2FA) {
        Alert.alert('2FA Required', 'Two-factor authentication is required.');
        return;
      }

      if (data.token && data.user) {
        await setToken(data.token);
        setUser(data.user);
        rewardsApi.dailyLogin().catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError('');
    try {
      const pollId = randomId();
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'argufight', path: 'auth' });
      const authUrl = `${BASE_URL}/api/auth/google?returnTo=${encodeURIComponent(redirectUri)}&pollId=${encodeURIComponent(pollId)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      // Try to extract token from the redirect URL
      let urlToken: string | null = null;
      if (result.type === 'success' && result.url) {
        try {
          const qsIndex = result.url.indexOf('?');
          if (qsIndex !== -1) {
            const params = new URLSearchParams(result.url.substring(qsIndex));
            urlToken = params.get('token');
          }
        } catch {}
      }

      if (urlToken) {
        // Set auth immediately so the dashboard renders
        await setToken(urlToken);
        // Fetch user data from poll record using raw fetch — NOT apiFetch — so a
        // failed request can never trigger clearAuth() and kick the user out.
        try {
          const res = await fetch(
            `${BASE_URL}/api/auth/google/mobile-poll?id=${encodeURIComponent(pollId)}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data.user) setUser(data.user);
          }
        } catch {}
        // Re-assert token to guard against any concurrent clearAuth from RootNavigator
        await setToken(urlToken);
        rewardsApi.dailyLogin().catch(() => {});
      } else {
        // Fallback: poll for token (used when JS redirect didn't work on device)
        const pollResult = await pollForToken(pollId);
        if (pollResult?.token) {
          await setToken(pollResult.token);
          if (pollResult.user) {
            setUser(pollResult.user);
          }
          rewardsApi.dailyLogin().catch(() => {});
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <ArrowLeft size={18} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo */}
          <Text style={[styles.logo, { color: colors.text }]}>
            Argu<Text style={{ fontWeight: '600', color: colors.accent }}>fight</Text>
          </Text>

          <Text style={[styles.title, { color: colors.text }]}>Sign in</Text>
          <Text style={[styles.subtitle, { color: colors.text3 }]}>
            Welcome back. Enter your credentials to continue.
          </Text>

          {/* Error */}
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.redMuted, borderColor: colors.red + '4D' }]}>
              <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
            </View>
          ) : null}

          {/* Google only */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            loading={googleLoading}
            onPress={handleGoogleLogin}
            icon={<GoogleIcon />}
          >
            Continue with Google
          </Button>

          <Separator text="or" />

          {/* Form */}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword
                  ? <EyeOff size={16} color={colors.text3} />
                  : <Eye size={16} color={colors.text3} />
                }
              </TouchableOpacity>
            }
          />

          <Button
            variant="accent"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleLogin}
          >
            Sign in
          </Button>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotBtn}
          >
            <Text style={[styles.forgotText, { color: colors.text3 }]}>
              Forgot your password?
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text3 }]}>
              No account?{' '}
            </Text>
            <Text
              style={[styles.footerLink, { color: colors.accent }]}
              onPress={() => navigation.navigate('Signup')}
            >
              Create one
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingBottom: 60 },
  logo: {
    fontSize: 19,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  title: { fontSize: 22, fontWeight: '500', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 28 },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13 },
  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 20,
  },
  footerText: { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '500' },
});
