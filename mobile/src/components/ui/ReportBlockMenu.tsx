import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, Alert, Pressable,
} from 'react-native';
import { Flag, ShieldBan, X } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { usersApi } from '../../api/users';
import { debatesApi } from '../../api/debates';

const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Hate speech',
  'Inappropriate content',
  'Impersonation',
  'Other',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Report a debate by ID */
  debateId?: string;
  /** Block/report a user by ID */
  userId?: string;
  userName?: string;
}

export function ReportBlockMenu({ visible, onClose, debateId, userId, userName }: Props) {
  const { colors } = useTheme();
  const [step, setStep] = useState<'menu' | 'report'>('menu');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: () => {
      if (debateId) {
        return debatesApi.report(debateId, selectedReason!, description || undefined);
      }
      return usersApi.reportUser(userId!, selectedReason!, description || undefined);
    },
    onSuccess: () => {
      Alert.alert('Report submitted', 'Thank you. Our moderators will review this report.');
      handleClose();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => usersApi.block(userId!, 'Blocked by user'),
    onSuccess: () => {
      Alert.alert(
        'User blocked',
        `${userName || 'This user'} has been blocked. Their content will no longer appear in your feed.`
      );
      handleClose();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to block user. Please try again.');
    },
  });

  function handleClose() {
    setStep('menu');
    setSelectedReason(null);
    setDescription('');
    onClose();
  }

  function handleBlock() {
    Alert.alert(
      `Block ${userName || 'this user'}?`,
      'They won\'t be able to see your profile or interact with you. Their content will be hidden from your feed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => blockMutation.mutate() },
      ]
    );
  }

  function handleSubmitReport() {
    if (!selectedReason) return;
    reportMutation.mutate();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {step === 'menu' ? 'Report or Block' : 'Report Content'}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <X size={20} color={colors.text3} />
            </TouchableOpacity>
          </View>

          {step === 'menu' ? (
            <View style={styles.menuItems}>
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => setStep('report')}
              >
                <Flag size={18} color={colors.red} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>Report</Text>
                  <Text style={[styles.menuDesc, { color: colors.text3 }]}>
                    Flag this {debateId ? 'debate' : 'user'} for review by our moderators
                  </Text>
                </View>
              </TouchableOpacity>

              {userId && (
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colors.border }]}
                  onPress={handleBlock}
                >
                  <ShieldBan size={18} color={colors.red} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>
                      Block {userName || 'user'}
                    </Text>
                    <Text style={[styles.menuDesc, { color: colors.text3 }]}>
                      Hide their content and prevent interactions
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.reportForm}>
              <Text style={[styles.reasonLabel, { color: colors.text2 }]}>
                Why are you reporting this?
              </Text>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    {
                      borderColor: selectedReason === reason ? colors.accent : colors.border,
                      backgroundColor: selectedReason === reason ? colors.accent + '14' : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View style={[
                    styles.radio,
                    {
                      borderColor: selectedReason === reason ? colors.accent : colors.text3,
                      backgroundColor: selectedReason === reason ? colors.accent : 'transparent',
                    },
                  ]} />
                  <Text style={{ color: colors.text, fontSize: 14 }}>{reason}</Text>
                </TouchableOpacity>
              ))}

              <TextInput
                style={[styles.descInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.bg }]}
                placeholder="Additional details (optional)"
                placeholderTextColor={colors.text3}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={500}
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: selectedReason ? colors.red : colors.surface2 },
                ]}
                onPress={handleSubmitReport}
                disabled={!selectedReason || reportMutation.isPending}
              >
                <Text style={[styles.submitText, { color: selectedReason ? '#fff' : colors.text3 }]}>
                  {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 17, fontWeight: '600' },
  menuItems: { paddingVertical: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuLabel: { fontSize: 15, fontWeight: '500' },
  menuDesc: { fontSize: 12, marginTop: 2 },
  reportForm: { padding: 20 },
  reasonLabel: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  descInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: 15, fontWeight: '600' },
});
