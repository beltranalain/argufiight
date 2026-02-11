'use client'

import { useState, useRef } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useUpdateProfile, useUploadAvatar } from '@/lib/hooks/mutations/useUpdateProfile'
import { useAuth } from '@/lib/hooks/useAuth'
import type { UserProfile } from '@/lib/hooks/queries/useProfile'

interface ProfileEditFormProps {
  profile: UserProfile
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const { showToast } = useToast()
  const { refetch: refetchAuth } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    username: profile.username || '',
    bio: profile.bio || '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl)

  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast({ type: 'error', title: 'Invalid File', description: 'Please select an image file' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: 'error', title: 'File Too Large', description: 'Image must be less than 5MB' })
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUploadAvatar = () => {
    if (!avatarFile) return
    uploadAvatar.mutate(avatarFile, {
      onSuccess: (data) => {
        setAvatarPreview(data.avatarUrl)
        setAvatarFile(null)
        showToast({ type: 'success', title: 'Avatar Updated', description: 'Your profile picture has been updated' })
        refetchAuth()
      },
      onError: (error: any) => {
        showToast({ type: 'error', title: 'Upload Failed', description: error.message || 'Failed to upload avatar' })
      },
    })
  }

  const handleSave = () => {
    updateProfile.mutate(formData, {
      onSuccess: () => {
        showToast({ type: 'success', title: 'Profile Updated', description: 'Your profile has been saved' })
        refetchAuth()
      },
      onError: (error: any) => {
        showToast({ type: 'error', title: 'Save Failed', description: error.message || 'Failed to update profile' })
      },
    })
  }

  return (
    <>
      {/* Avatar in profile header */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar
            src={avatarPreview || profile.avatarUrl}
            username={profile.username}
            size="xl"
          />
          {avatarFile && (
            <div className="absolute inset-0 bg-bg-primary/50 rounded-full flex items-center justify-center">
              <span className="text-text-primary text-xs">New</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-upload"
          />
          <Button
            variant="secondary"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Change Photo
          </Button>
          {avatarFile && (
            <Button
              variant="primary"
              onClick={handleUploadAvatar}
              isLoading={uploadAvatar.isPending}
            >
              Upload
            </Button>
          )}
        </div>
      </div>

      {/* Edit Form Card */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-text-primary">Edit Profile</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Input
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Your username"
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={updateProfile.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
