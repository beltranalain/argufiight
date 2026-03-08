import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swords, Trophy, Users } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Button } from '../../components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    icon: Swords,
    heading: 'Argue. Win.\nProve it.',
    desc: 'The premier AI-judged debate platform. Challenge opponents, earn championship belts, and climb the global leaderboard.',
  },
  {
    key: '2',
    icon: Trophy,
    heading: 'Earn Belts.\nClaim Glory.',
    desc: 'Win debates to collect championship belts. Rise through the ranks and become the undisputed debate champion.',
  },
  {
    key: '3',
    icon: Users,
    heading: 'Challenge\nAnyone.',
    desc: 'Pick any topic, challenge real opponents, and let our AI judge declare a winner based on logic and evidence.',
  },
];

export function SplashScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigation.navigate('Signup');
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={[styles.slide]}>
              <View style={[styles.iconBox, { backgroundColor: colors.accent }]}>
                <Icon size={40} color={colors.accentFg} strokeWidth={1.4} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Argu<Text style={{ fontWeight: '600', color: colors.accent }}>fight</Text>
              </Text>
              <Text style={[styles.heading, { color: colors.text }]}>
                {item.heading}
              </Text>
              <Text style={[styles.desc, { color: colors.text2 }]}>
                {item.desc}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                i === activeIndex
                  ? [styles.dotActive, { backgroundColor: colors.accent }]
                  : [styles.dot, { backgroundColor: colors.border2 }],
              ]}
            />
          ))}
        </View>

        <Button
          onPress={handleNext}
          variant="accent"
          size="lg"
          fullWidth
        >
          {isLast ? 'Get Started' : 'Next'}
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
  slide: {
    width: SCREEN_WIDTH,
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
