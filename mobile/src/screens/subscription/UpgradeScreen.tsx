import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    features: ['3 debates/day', 'AI opponents', 'Basic stats'],
    current: true,
  },
  {
    name: 'Pro',
    price: '$9.99/mo',
    features: ['Unlimited debates', 'Advanced analytics', 'Priority matchmaking', 'Appeal verdicts'],
    recommended: true,
  },
  {
    name: 'Elite',
    price: '$19.99/mo',
    features: ['Everything in Pro', 'Custom AI judges', 'Tournament creation', 'Creator tools'],
  },
];

export function UpgradeScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Upgrade</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            style={plan.recommended ? { borderColor: colors.accent } : undefined}
          >
            {plan.recommended && (
              <Text style={[styles.recommended, { color: colors.accent }]}>Recommended</Text>
            )}
            <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
            <Text style={[styles.planPrice, { color: colors.accent }]}>{plan.price}</Text>
            <View style={{ gap: 6, marginTop: 12 }}>
              {plan.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Check size={14} color={colors.green} />
                  <Text style={{ color: colors.text2, fontSize: 14 }}>{f}</Text>
                </View>
              ))}
            </View>
            {!plan.current && (
              <Button
                variant={plan.recommended ? 'accent' : 'outline'}
                size="md"
                fullWidth
                style={{ marginTop: 16 }}
                onPress={() => Linking.openURL('https://www.argufight.com/upgrade')}
              >
                Subscribe on Web
              </Button>
            )}
            {plan.current && (
              <Text style={{ color: colors.text3, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
                Current Plan
              </Text>
            )}
          </Card>
        ))}
        <Text style={[styles.note, { color: colors.text3 }]}>
          Manage your subscription at argufight.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '500' },
  recommended: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  planName: { fontSize: 20, fontWeight: '500' },
  planPrice: { fontSize: 28, fontWeight: '600', marginTop: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  note: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
