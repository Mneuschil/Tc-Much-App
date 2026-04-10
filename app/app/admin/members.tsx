import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { SearchInput } from '../../src/components/ui/SearchInput';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useClubMembers, useUpdateRoles } from '../../src/hooks/useProfile';
import { UserRole } from '@tennis-club/shared';
import type { User } from '@tennis-club/shared';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.MEMBER]: 'Mitglied',
  [UserRole.TRAINER]: 'Trainer',
  [UserRole.BOARD_MEMBER]: 'Vorstand',
  [UserRole.TEAM_CAPTAIN]: 'Mannschaftsführer',
  [UserRole.PARENT]: 'Elternteil',
  [UserRole.CLUB_ADMIN]: 'Admin',
  [UserRole.SYSTEM_ADMIN]: 'System-Admin',
};

const ASSIGNABLE_ROLES: UserRole[] = [
  UserRole.MEMBER,
  UserRole.TRAINER,
  UserRole.BOARD_MEMBER,
  UserRole.TEAM_CAPTAIN,
  UserRole.PARENT,
  UserRole.CLUB_ADMIN,
];

export default function AdminMembersScreen() {
  const { colors, spacing, radii, typography } = useTheme();
  const router = useRouter();
  const { isAdmin } = usePermissions();
  const { data: members, isLoading, refetch } = useClubMembers();
  const updateRoles = useUpdateRoles();

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);

  const filtered = useMemo(
    () =>
      (members ?? []).filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [members, search],
  );

  if (!isAdmin) {
    router.replace('/(tabs)/more');
    return null;
  }

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRoles([...(user.roles ?? [])]);
  };

  const toggleRole = (role: UserRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const saveRoles = () => {
    if (!selectedUser || selectedRoles.length === 0) return;
    updateRoles.mutate(
      { userId: selectedUser.id, input: { roles: selectedRoles } },
      { onSuccess: () => setSelectedUser(null) },
    );
  };

  const renderMember = ({ item }: { item: User }) => (
    <Pressable
      onPress={() => openRoleModal(item)}
      style={({ pressed }) => [
        styles.memberRow,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.separator,
          paddingVertical: spacing.md,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Avatar
        imageUrl={item.avatarUrl}
        firstName={item.firstName}
        lastName={item.lastName}
        size="sm"
      />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
          {item.firstName} {item.lastName}
        </Text>
        <View style={[styles.badgeRow, { marginTop: spacing.xs }]}>
          {(item.roles ?? []).map((role) => (
            <Badge key={role} label={ROLE_LABELS[role]} variant="accent" size="sm" />
          ))}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}
      >
        <View style={styles.headerRow}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Mitglieder</Text>
          <Badge label={`${members?.length ?? 0}`} variant="neutral" size="md" />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <SearchInput value={search} onChangeText={setSearch} placeholder="Nach Name suchen..." />
        </View>
      </View>

      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
        refreshing={isLoading}
        onRefresh={refetch}
      />

      {/* Role Edit Modal */}
      <Modal visible={selectedUser !== null} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, borderRadius: radii.xl, padding: spacing.xl },
            ]}
          >
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.lg }]}>
              Rollen für {selectedUser?.firstName} {selectedUser?.lastName}
            </Text>

            {ASSIGNABLE_ROLES.map((role) => {
              const isChecked = selectedRoles.includes(role);
              return (
                <Pressable
                  key={role}
                  onPress={() => toggleRole(role)}
                  style={[styles.roleRow, { paddingVertical: spacing.sm }]}
                >
                  <Ionicons
                    name={isChecked ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={isChecked ? colors.accent : colors.textTertiary}
                  />
                  <Text
                    style={[
                      typography.bodyMedium,
                      { color: colors.textPrimary, marginLeft: spacing.md },
                    ]}
                  >
                    {ROLE_LABELS[role]}
                  </Text>
                </Pressable>
              );
            })}

            <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
              <Button
                title="Speichern"
                onPress={saveRoles}
                variant="primary"
                fullWidth
                loading={updateRoles.isPending}
                disabled={selectedRoles.length === 0}
              />
              <Pressable
                onPress={() => setSelectedUser(null)}
                style={{ paddingVertical: spacing.sm }}
              >
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  roleRow: { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { maxHeight: '70%' },
});
