import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swords } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Button } from '../../components/ui/Button';

export function SplashScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: colors.accent }]}>
          <Swords size={40} color={colors.accentFg} strokeWidth={1.4} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Argu<Text style={{ fontWeight: '600', color: colors.accent }}>fight</Text>
        </Text>
        <Text style={[styles.heading, { color: colors.text }]}>
          Argue. Win.{'\n'}Prove it.
        </Text>
        <Text style={[styles.desc, { color: colors.text2 }]}>
          The premier AI-judged debate platform. Challenge opponents, earn championship belts, and climb the global leaderboard.
        </Text>
      </View>

      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          <View style={[styles.dotActive, { backgroundColor: colors.accent }]} />
          <View style={[styles.dot, { backgroundColor: colors.border2 }]} />
          <View style={[styles.dot, { backgroundColor: colors.border2 }]} />
        </View>

        <Button
          onPress={() => navigation.navigate('Signup')}
          variant="accent"
          size="lg"
          fullWidth
        >
          Get Started
        </Button>

        <View style={styles.signinRow}>
          <Text style={[styles.signinText, { color: colors.text3 }]}>
            Already have an account?{' '}
          </Text>
          <Text
            style={[styles.signinLink, { color: colors.accent }]}
            onPress={() => navigation.navigate('Login')}
          >
            Sign in
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  heading: {
    fontSize: 32,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 12,
  },
  desc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signinText: { fontSize: 14 },
  signinLink: { fontSize: 14, fontWeight: '500' },
});
