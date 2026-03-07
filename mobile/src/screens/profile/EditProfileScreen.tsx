import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../api/users';

export function EditProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setAvatarUri(asset.uri);

    // Upload immediately
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      formData.append('avatar', {
        uri: asset.uri,
        name: `avatar.${ext}`,
        type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      } as any);
      const res = await usersApi.uploadAvatar(formData);
      if (user && (res as any)?.avatarUrl) {
        setUser({ ...user, avatarUrl: (res as any).avatarUrl });
      }
    } catch (err: any) {
      Alert.alert('Upload failed', err.message);
      setAvatarUri(null);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      await usersApi.updateProfile({ username: username.trim(), bio: bio.trim() });
      if (user) {
        setUser({ ...user, username: username.trim() });
      }
      Alert.alert('Saved', 'Profile updated.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <View>
            <Avatar src={avatarUri ?? user?.avatarUrl} fallback={user?.username ?? 'U'} size="xl" />
            <TouchableOpacity
              style={[styles.cameraBtn, { backgroundColor: colors.accent }]}
              onPress={pickImage}
              disabled={uploadingAvatar}
            >
              <Camera size={14} color={colors.accentFg} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.changePhoto, { borderColor: colors.border }]} onPress={pickImage} disabled={uploadingAvatar}>
            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '500' }}>
              {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>
        <Input label="Username" value={username} onChangeText={setUsername} />
        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself"
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />
        <Button variant="accent" size="lg" fullWidth loading={loading} onPress={handleSave}>
          Save Changes
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '500' },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  changePhoto: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
