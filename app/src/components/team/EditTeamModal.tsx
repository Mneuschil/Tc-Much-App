import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { TeamDetail } from '@tennis-club/shared';
import { useTheme } from '../../theme';

interface EditTeamModalProps {
  visible: boolean;
  onClose: () => void;
  team: Pick<TeamDetail, 'id' | 'name' | 'league' | 'season'>;
  onSave: (input: { name?: string; league?: string | null; season?: string | null }) => void;
  onDelete?: () => void;
  isPending: boolean;
  canDelete: boolean;
}

export function EditTeamModal({
  visible,
  onClose,
  team,
  onSave,
  onDelete,
  isPending,
  canDelete,
}: EditTeamModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [name, setName] = useState(team.name);
  const [league, setLeague] = useState(team.league ?? '');
  const [season, setSeason] = useState(team.season ?? '');

  useEffect(() => {
    if (visible) {
      setName(team.name);
      setLeague(team.league ?? '');
      setSeason(team.season ?? '');
    }
  }, [visible, team]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      league: league.trim() || null,
      season: season.trim() || null,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Team löschen',
      `"${team.name}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: onDelete },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View
          style={[styles.header, { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }]}
        >
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Team bearbeiten</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
          <View>
            <Text
              style={[
                typography.captionMedium,
                { color: colors.textSecondary, marginBottom: spacing.xs },
              ]}
            >
              Teamname *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.md,
                  color: colors.textPrimary,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Teamname"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View>
            <Text
              style={[
                typography.captionMedium,
                { color: colors.textSecondary, marginBottom: spacing.xs },
              ]}
            >
              Liga
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.md,
                  color: colors.textPrimary,
                },
              ]}
              value={league}
              onChangeText={setLeague}
              placeholder="z.B. Bezirksliga, Kreisliga..."
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View>
            <Text
              style={[
                typography.captionMedium,
                { color: colors.textSecondary, marginBottom: spacing.xs },
              ]}
            >
              Saison
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.md,
                  color: colors.textPrimary,
                },
              ]}
              value={season}
              onChangeText={setSeason}
              placeholder="z.B. 2026"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!name.trim() || isPending}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: name.trim() ? colors.accent : colors.surface,
                borderRadius: borderRadius.md,
                opacity: isPending ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                typography.button,
                { color: name.trim() ? colors.textInverse : colors.textTertiary },
              ]}
            >
              {isPending ? 'Wird gespeichert...' : 'Speichern'}
            </Text>
          </Pressable>

          {canDelete && onDelete && (
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text
                style={[typography.bodyMedium, { color: colors.danger, marginLeft: spacing.sm }]}
              >
                Team löschen
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { height: 48, paddingHorizontal: 16, fontSize: 15 },
  saveBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});
