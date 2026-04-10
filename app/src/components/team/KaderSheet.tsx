import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { TeamMemberWithUser } from '@tennis-club/shared';
import { useTheme } from '../../theme';
import { Avatar, EmptyState, SearchInput } from '../ui';
import { useClubMembers } from '../../hooks/useProfile';

interface ClubMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

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
  // teamId reserved for future position-editing feature
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

  const existingMemberIds = useMemo(() => members.map((m) => m.user.id), [members]);

  const availableMembers = useMemo(() => {
    const existingSet = new Set(existingMemberIds);
    const all = (clubMembersData ?? []) as ClubMember[];
    const filtered = all.filter((m) => !existingSet.has(m.id));
    if (!search.trim()) return filtered;
    const q = search.toLowerCase();
    return filtered.filter(
      (m) => m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q),
    );
  }, [clubMembersData, existingMemberIds, search]);

  const confirmRemove = (member: TeamMemberWithUser) => {
    const name = `${member.user.firstName} ${member.user.lastName}`;
    Alert.alert('Mitglied entfernen', `${name} wirklich aus dem Team entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: () => onRemoveMember(member.user.id) },
    ]);
  };

  const handleAddSelect = (userId: string) => {
    onAddMember(userId);
    setMode('list');
    setSearch('');
  };

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
          {mode === 'add' ? (
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
          ) : null}
          <Text
            style={[
              typography.h2,
              { color: colors.textPrimary, flex: 1, marginLeft: mode === 'add' ? spacing.md : 0 },
            ]}
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
            <FlatList
              data={availableMembers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: spacing.xxxl }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleAddSelect(item.id)}
                  accessibilityLabel={`${item.firstName} ${item.lastName} hinzufügen`}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.memberRow,
                    {
                      paddingHorizontal: spacing.xl,
                      paddingVertical: spacing.md,
                      borderBottomColor: colors.separator,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Avatar
                    firstName={item.firstName}
                    lastName={item.lastName}
                    imageUrl={item.avatarUrl}
                    size="md"
                  />
                  <Text
                    style={[
                      typography.bodyMedium,
                      { color: colors.textPrimary, flex: 1, marginLeft: spacing.md },
                    ]}
                  >
                    {item.firstName} {item.lastName}
                  </Text>
                  <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
                </Pressable>
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
            <FlatList
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
                <View
                  style={[
                    styles.memberRow,
                    {
                      paddingHorizontal: spacing.xl,
                      paddingVertical: spacing.md,
                      borderBottomColor: colors.separator,
                    },
                  ]}
                >
                  <Avatar
                    firstName={item.user.firstName}
                    lastName={item.user.lastName}
                    imageUrl={item.user.avatarUrl}
                    size="md"
                  />
                  <View style={{ marginLeft: spacing.md, flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                      {item.user.firstName} {item.user.lastName}
                    </Text>
                    {showPosition && item.position && (
                      <Text
                        style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}
                      >
                        Position {item.position}
                      </Text>
                    )}
                  </View>
                  {canManage && (
                    <Pressable
                      onPress={() => confirmRemove(item)}
                      hitSlop={12}
                      accessibilityLabel={`${item.user.firstName} ${item.user.lastName} entfernen`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                  )}
                </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  addButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
