import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Separator } from '../../components/ui/Separator';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { BASE_URL } from '../../api/client';

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

export function SignupScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { setToken, setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  async function handleSignup() {
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (!username.trim() || !email.trim() || !password) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await authApi.signup(username.trim(), email.trim(), password);
      if (data.token && data.user) {
        await setToken(data.token);
        setUser(data.user);
      } else {
        const loginData = await authApi.login(email.trim(), password);
        if (loginData.token && loginData.user) {
          await setToken(loginData.token);
          setUser(loginData.user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    setGoogleLoading(true);
    setError('');
    try {
      const pollId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'argufight', path: 'auth' });
      const authUrl = `${BASE_URL}/api/auth/google?returnTo=${encodeURIComponent(redirectUri)}&pollId=${encodeURIComponent(pollId)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

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
        await setToken(urlToken);
        try {
          const res = await fetch(
            `${BASE_URL}/api/auth/google/mobile-poll?id=${encodeURIComponent(pollId)}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data.user) setUser(data.user);
          }
        } catch {}
        await setToken(urlToken);
      } else {
        // Fallback: poll for token
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const res = await fetch(`${BASE_URL}/api/auth/google/mobile-poll?id=${encodeURIComponent(pollId)}`);
            if (res.status === 200) {
              const data = await res.json();
              if (data.token) {
                await setToken(data.token);
                if (data.user) setUser(data.user);
                break;
              }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google sign up failed');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleAppleSignup() {
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    setAppleLoading(true);
    setError('');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        setError('Apple sign up failed: no identity token');
        return;
      }

      const res = await fetch(`${BASE_URL}/api/auth/apple/mobile-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          fullName: credential.fullName,
          email: credential.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Apple sign up failed');

      if (data.token) {
        await setToken(data.token);
        if (data.user) setUser(data.user);
      }
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        setError(err.message || 'Apple sign up failed');
      }
    } finally {
      setAppleLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
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
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={[styles.logo, { color: colors.text }]}>
            Argu<Text style={{ fontWeight: '600', color: colors.accent }}>fight</Text>
          </Text>

          <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.text3 }]}>
            Join the arena. Start debating today.
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.redMuted, borderColor: colors.red + '4D' }]}>
              <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
            </View>
          ) : null}

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={10}
              style={{ width: '100%', height: 48, marginBottom: 10 }}
              onPress={handleAppleSignup}
            />
          )}

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            loading={googleLoading}
            onPress={handleGoogleSignup}
            icon={<GoogleIcon />}
          >
            Continue with Google
          </Button>

          <Separator text="or" />

          <Input
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
          />
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
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword
                  ? <EyeOff size={16} color={colors.text3} />
                  : <Eye size={16} color={colors.text3} />
                }
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: agreedToTerms ? colors.accent : colors.text3 },
                agreedToTerms && { backgroundColor: colors.accent },
              ]}
            >
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.termsText, { color: colors.text3 }]}>
              I agree to the{' '}
              <Text
                style={{ color: colors.accent, textDecorationLine: 'underline' }}
                onPress={() => WebBrowser.openBrowserAsync(`${BASE_URL}/terms`)}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={{ color: colors.accent, textDecorationLine: 'underline' }}
                onPress={() => WebBrowser.openBrowserAsync(`${BASE_URL}/privacy`)}
              >
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          <Button
            variant="accent"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleSignup}
            disabled={!agreedToTerms}
          >
            Create account
          </Button>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text3 }]}>
              Already have an account?{' '}
            </Text>
            <Text
              style={[styles.footerLink, { color: colors.accent }]}
              onPress={() => navigation.navigate('Login')}
            >
              Sign in
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
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingBottom: 60 },
  logo: { fontSize: 19, fontWeight: '300', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 32 },
  title: { fontSize: 22, fontWeight: '500', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 28 },
  errorBox: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  errorText: { fontSize: 13 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, gap: 10, paddingHorizontal: 4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkmark: { color: '#000', fontSize: 13, fontWeight: '700', lineHeight: 16 },
  termsText: { fontSize: 13, lineHeight: 20, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingTop: 32, paddingBottom: 20 },
  footerText: { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '500' },
});
