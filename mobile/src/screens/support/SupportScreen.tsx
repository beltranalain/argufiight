import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Mail, Plus, ChevronRight } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { supportApi } from '../../api/support';
import { timeAgo } from '../../utils/notifications';

export function SupportScreen({ navigation }: any) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: tickets } = useQuery({
    queryKey: ['supportTickets'],
    queryFn: supportApi.getTickets,
  });

  const ticketList = Array.isArray(tickets) ? tickets : (tickets as any)?.tickets ?? [];

  async function handleCreateTicket() {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in subject and description.');
      return;
    }
    setSubmitting(true);
    try {
      await supportApi.createTicket({ subject: subject.trim(), description: description.trim() });
      setSubject('');
      setDescription('');
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      Alert.alert('Ticket created', 'We\'ll get back to you soon.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Help & Support</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <View style={styles.cardRow}>
            <MessageCircle size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>FAQs</Text>
              <Text style={{ color: colors.text3, fontSize: 13 }}>Find answers to common questions</Text>
            </View>
          </View>
        </Card>
        <Card>
          <View style={styles.cardRow}>
            <Mail size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Contact Us</Text>
              <Text style={{ color: colors.text3, fontSize: 13 }}>support@argufight.com</Text>
            </View>
          </View>
        </Card>

        <Button
          variant="outline"
          size="md"
          fullWidth
          icon={<Plus size={16} color={colors.accent} />}
          onPress={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancel' : 'Create Support Ticket'}
        </Button>

        {showCreate && (
          <Card>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500', marginBottom: 12 }}>New Ticket</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }]}
              placeholder="Subject"
              placeholderTextColor={colors.text3}
              value={subject}
              onChangeText={setSubject}
            />
            <TextInput
              style={[styles.input, styles.textarea, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe your issue..."
              placeholderTextColor={colors.text3}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Button variant="accent" size="md" fullWidth loading={submitting} onPress={handleCreateTicket}>
              Submit Ticket
            </Button>
          </Card>
        )}

        {ticketList.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text3 }]}>Your Tickets</Text>
            {ticketList.map((ticket: any) => (
              <Card key={ticket.id}>
                <View style={styles.ticketRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{ticket.subject}</Text>
                    <View style={styles.ticketMeta}>
                      <Badge
                        color={ticket.status === 'OPEN' ? 'green' : ticket.status === 'CLOSED' ? 'muted' : 'amber'}
                      >
                        {ticket.status}
                      </Badge>
                      {ticket.createdAt && (
                        <Text style={{ color: colors.text3, fontSize: 11 }}>{timeAgo(ticket.createdAt)}</Text>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.text3} />
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '500' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardTitle: { fontSize: 15, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 8 },
  ticketRow: { flexDirection: 'row', alignItems: 'center' },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
});
