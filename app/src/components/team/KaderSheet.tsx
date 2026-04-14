import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { TeamMemberWithUser } from '@tennis-club/shared';
import { useTheme } from '../../theme';
import { EmptyState, SearchInput } from '../ui';
import { useClubMembers } from '../../hooks/useProfile';
import { TeamMemberRow } from './KaderMemberRow';
import { KaderAddMemberRow } from './KaderAddMemberRow';

interface KaderSheetProps {
  visible: boolean;
  onClose: () => void;
  members: TeamMemberWithUser[];
  teamType: string;
  teamId: string;
  canManage: boolean;
  onAddMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
}

export function KaderSheet({
  visible,
  onClose,
  members,
  teamType,
  canManage,
  onAddMember,
  onRemoveMember,
}: KaderSheetProps) {
  const { colors, typography, spacing } = useTheme();
  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [search, setSearch] = useState('');
  const showPosition = teamType === 'MATCH_TEAM';

  const { data: clubMembersData } = useClubMembers();

  const sortedMembers = useMemo(
    () =>
      showPosition ? [...members].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)) : members,
    [members, showPosition],
  );

  const existingMemberIds = useMemo(() => new Set(members.map((m) => m.user.id)), [members]);

  const availableMembers = useMemo(() => {
    const all = (clubMembersData ?? []) as {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    }[];
    const filtered = all.filter((m) => !existingMemberIds.has(m.id));
    if (!search.trim()) return filtered;
    const q = search.toLowerCase();
    return filtered.filter(
      (m) => m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q),
    );
  }, [clubMembersData, existingMemberIds, search]);

  const confirmRemove = useCallback(
    (member: TeamMemberWithUser) => {
      const name = `${member.user.firstName} ${member.user.lastName}`;
      Alert.alert('Mitglied entfernen', `${name} wirklich aus dem Team entfernen?`, [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Entfernen', style: 'destructive', onPress: () => onRemoveMember(member.user.id) },
      ]);
    },
    [onRemoveMember],
  );

  const handleAddSelect = useCallback(
    (userId: string) => {
      onAddMember(userId);
      setMode('list');
      setSearch('');
    },
    [onAddMember],
  );

  const handleClose = () => {
    setMode('list');
    setSearch('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View
          style={[styles.header, { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }]}
        >
          {mode === 'add' && (
            <Pressable
              onPress={() => {
                setMode('list');
                setSearch('');
              }}
              hitSlop={12}
              accessibilityLabel="Zurück zur Mitgliederliste"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
            </Pressable>
          )}
          <Text
            style={[
              typography.h2,
              { color: colors.textPrimary, flex: 1, marginLeft: mode === 'add' ? spacing.md : 0 },
            ]}
            accessibilityRole="header"
          >
            {mode === 'add' ? 'Mitglied hinzufügen' : 'Mitglieder'}
          </Text>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            accessibilityLabel="Modal schließen"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
        </View>

        {mode === 'add' ? (
          <>
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <SearchInput
                placeholder="Vereinsmitglieder durchsuchen..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <FlashList
              data={availableMembers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: spacing.xxxl }}
              renderItem={({ item }) => (
                <KaderAddMemberRow item={item} onSelect={handleAddSelect} />
              )}
              ListEmptyComponent={
                <EmptyState
                  title="Keine Mitglieder"
                  description={
                    search.trim()
                      ? 'Keine passenden Vereinsmitglieder gefunden'
                      : 'Alle Vereinsmitglieder sind bereits im Team'
                  }
                />
              }
            />
          </>
        ) : (
          <>
            {canManage && (
              <Pressable
                onPress={() => setMode('add')}
                accessibilityLabel="Mitglied hinzufügen"
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: colors.accent,
                    borderRadius: spacing.md,
                    marginHorizontal: spacing.xl,
                    marginBottom: spacing.md,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.textInverse} />
                <Text
                  style={[typography.button, { color: colors.textInverse, marginLeft: spacing.sm }]}
                >
                  Mitglied hinzufügen
                </Text>
              </Pressable>
            )}
            <FlashList
              data={sortedMembers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: spacing.xxxl }}
              ListEmptyComponent={
                <EmptyState
                  title="Keine Mitglieder"
                  description="Noch keine Personen in diesem Team"
                />
              }
              renderItem={({ item }) => (
                <TeamMemberRow
                  item={item}
                  showPosition={showPosition}
                  canManage={canManage}
                  onRemove={confirmRemove}
                />
              )}
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  addButton: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
