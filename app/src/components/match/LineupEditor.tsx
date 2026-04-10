import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';
import type { LineupEntry } from './types';

interface LineupEditorProps {
  starters: LineupEntry[];
  substitutes: LineupEntry[];
  onStartersChange: (items: LineupEntry[]) => void;
  onSubsChange: (items: LineupEntry[]) => void;
  onAutoGenerate: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function LineupEditor({
  starters,
  substitutes,
  onStartersChange,
  onSubsChange,
  onAutoGenerate,
  onConfirm,
  isLoading,
}: LineupEditorProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const moveItem = (
    list: LineupEntry[],
    index: number,
    direction: -1 | 1,
    onChange: (items: LineupEntry[]) => void,
  ) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    const updated = [...list];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((d, i) => ({ ...d, position: i + 1 })));
  };

  const renderRow = (
    item: LineupEntry,
    index: number,
    list: LineupEntry[],
    onChange: (items: LineupEntry[]) => void,
  ) => (
    <View
      key={item.userId}
      style={[
        styles.lineupRow,
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.xs,
        },
      ]}
    >
      <Text
        style={[
          typography.bodyMedium,
          { color: colors.textSecondary, width: 24, textAlign: 'center' },
        ]}
      >
        {item.position}
      </Text>
      <Avatar
        firstName={item.user.firstName}
        lastName={item.user.lastName}
        imageUrl={item.user.avatarUrl}
        size="xs"
      />
      <Text
        style={[
          typography.bodySmall,
          { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm },
        ]}
      >
        {item.user.firstName} {item.user.lastName}
      </Text>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        <Pressable
          onPress={() => moveItem(list, index, -1, onChange)}
          disabled={index === 0}
          accessibilityLabel={`${item.user.firstName} nach oben`}
          accessibilityRole="button"
          style={{ padding: 6, opacity: index === 0 ? 0.3 : 1 }}
        >
          <Ionicons name="chevron-up" size={20} color={colors.textTertiary} />
        </Pressable>
        <Pressable
          onPress={() => moveItem(list, index, 1, onChange)}
          disabled={index === list.length - 1}
          accessibilityLabel={`${item.user.firstName} nach unten`}
          accessibilityRole="button"
          style={{ padding: 6, opacity: index === list.length - 1 ? 0.3 : 1 }}
        >
          <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View>
      <Text style={[typography.captionMedium, { color: colors.success, marginBottom: spacing.sm }]}>
        Starter
      </Text>
      {starters.map((item, i) => renderRow(item, i, starters, onStartersChange))}
      <Text
        style={[
          typography.captionMedium,
          { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
        ]}
      >
        Ersatz
      </Text>
      {substitutes.map((item, i) => renderRow(item, i, substitutes, onSubsChange))}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
        <Pressable
          onPress={onAutoGenerate}
          disabled={isLoading}
          accessibilityLabel="Aufstellungsvorschlag laden"
          accessibilityRole="button"
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.surface, borderRadius: borderRadius.lg, flex: 1 },
          ]}
        >
          <Text style={[typography.buttonSmall, { color: colors.textPrimary }]}>
            Vorschlag laden
          </Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={isLoading}
          accessibilityLabel="Aufstellung bestätigen"
          accessibilityRole="button"
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.chipActive, borderRadius: borderRadius.lg, flex: 1 },
          ]}
        >
          <Text style={[typography.buttonSmall, { color: colors.textInverse }]}>Bestaetigen</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lineupRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtn: { paddingVertical: 14, alignItems: 'center' },
});
