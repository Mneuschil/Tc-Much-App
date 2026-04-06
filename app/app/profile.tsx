import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../src/theme';
import { Avatar } from '../src/components/ui/Avatar';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { useProfile, useUpdateProfile } from '../src/hooks/useProfile';
import { useTeams } from '../src/features/teams/hooks/useTeams';
import { userService } from '../src/features/profile/services/userService';
import { appendFileToFormData } from '../src/utils/createFileFormData';
import { UserRole } from '@tennis-club/shared';
import type { Team } from '@tennis-club/shared';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.MEMBER]: 'Mitglied',
  [UserRole.TRAINER]: 'Trainer',
  [UserRole.BOARD_MEMBER]: 'Vorstand',
  [UserRole.TEAM_CAPTAIN]: 'Mannschaftsführer',
  [UserRole.PARENT]: 'Elternteil',
  [UserRole.CLUB_ADMIN]: 'Admin',
  [UserRole.SYSTEM_ADMIN]: 'System-Admin',
};

export default function ProfileScreen() {
  const { colors, spacing, radii, typography } = useTheme();
  const { data: user, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: teams } = useTeams();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const startEditing = () => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setPhone(user?.phone ?? '');
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(
      { firstName, lastName, phone: phone || null },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleAvatarPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const formData = new FormData();
    appendFileToFormData(formData, 'avatar', result.assets[0].uri, 'avatar.jpg', 'image/jpeg');

    try {
      const { url } = await userService.uploadAvatar(formData);
      await updateProfile.mutateAsync({ avatarUrl: url });
      refetch();
    } catch {
      // Error handled by mutation onError
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, alignItems: 'center' }}>
        {/* Avatar */}
        <Pressable onPress={handleAvatarPick} style={styles.avatarWrap}>
          <Avatar
            imageUrl={user.avatarUrl}
            firstName={user.firstName}
            lastName={user.lastName}
            size="xl"
          />
          <View
            style={[
              styles.cameraIcon,
              { backgroundColor: colors.backgroundSecondary, borderRadius: radii.pill },
            ]}
          >
            <Ionicons name="camera" size={14} color={colors.textSecondary} />
          </View>
        </Pressable>

        {/* Name + Info */}
        {!editing ? (
          <>
            <Text
              style={[
                typography.h1,
                { color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
              ]}
            >
              {user.firstName} {user.lastName}
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {user.email}
            </Text>
            {user.phone && (
              <Text
                style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}
              >
                {user.phone}
              </Text>
            )}

            {/* Roles */}
            <View style={[styles.badgeRow, { marginTop: spacing.md }]}>
              {(user.roles ?? []).map((role) => (
                <Badge key={role} label={ROLE_LABELS[role]} variant="accent" size="md" />
              ))}
            </View>

            <View style={{ marginTop: spacing.xl, width: '100%' }}>
              <Button
                title="Profil bearbeiten"
                onPress={startEditing}
                variant="secondary"
                fullWidth
              />
            </View>
          </>
        ) : (
          /* Edit Mode */
          <View style={{ width: '100%', marginTop: spacing.xl, gap: spacing.md }}>
            <View>
              <Text
                style={[typography.label, { color: colors.textPrimary, marginBottom: spacing.xs }]}
              >
                Vorname
              </Text>
              <Input value={firstName} onChangeText={setFirstName} placeholder="Vorname" />
            </View>
            <View>
              <Text
                style={[typography.label, { color: colors.textPrimary, marginBottom: spacing.xs }]}
              >
                Nachname
              </Text>
              <Input value={lastName} onChangeText={setLastName} placeholder="Nachname" />
            </View>
            <View>
              <Text
                style={[typography.label, { color: colors.textPrimary, marginBottom: spacing.xs }]}
              >
                Telefon
              </Text>
              <Input value={phone} onChangeText={setPhone} placeholder="Telefonnummer" />
            </View>
            <Button
              title="Speichern"
              onPress={handleSave}
              variant="primary"
              fullWidth
              loading={updateProfile.isPending}
            />
            <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.textSecondary, textAlign: 'center' },
                ]}
              >
                Abbrechen
              </Text>
            </Pressable>
          </View>
        )}

        {/* Teams */}
        {teams && teams.length > 0 && (
          <View style={{ width: '100%', marginTop: spacing.xxxl }}>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.md }]}>
              Meine Teams
            </Text>
            {teams.map((team: Team) => (
              <View
                key={team.id}
                style={[
                  styles.teamCard,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                  {team.name}
                </Text>
                {team.league && (
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    {team.league}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatarWrap: { position: 'relative' },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  cancelBtn: { paddingVertical: 12 },
  teamCard: {},
});
