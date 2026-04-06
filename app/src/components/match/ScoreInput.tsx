import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import type { TennisSet } from '@tennis-club/shared';

interface ScoreInputProps {
  sets: TennisSet[];
  onUpdateSet: (index: number, field: keyof TennisSet, value: number | null) => void;
  onAddSet: () => void;
  readOnly: boolean;
}

export function ScoreInput({ sets, onUpdateSet, onAddSet, readOnly }: ScoreInputProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  return (
    <View>
      {sets.map((set, i) => {
        const needsTiebreak = set.games1 >= 6 && set.games2 >= 6;
        return (
          <View key={i} style={{ marginBottom: spacing.md }}>
            <Text
              style={[
                typography.captionMedium,
                { color: colors.textSecondary, marginBottom: spacing.xs },
              ]}
            >
              Satz {i + 1}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <TextInput
                style={[
                  styles.scoreField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: borderRadius.md,
                    color: colors.textPrimary,
                  },
                ]}
                value={String(set.games1)}
                onChangeText={(v) => onUpdateSet(i, 'games1', parseInt(v, 10) || 0)}
                keyboardType="number-pad"
                editable={!readOnly}
                maxLength={1}
              />
              <Text style={[typography.h3, { color: colors.textTertiary }]}>:</Text>
              <TextInput
                style={[
                  styles.scoreField,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: borderRadius.md,
                    color: colors.textPrimary,
                  },
                ]}
                value={String(set.games2)}
                onChangeText={(v) => onUpdateSet(i, 'games2', parseInt(v, 10) || 0)}
                keyboardType="number-pad"
                editable={!readOnly}
                maxLength={1}
              />
            </View>
            {needsTiebreak && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Tiebreak:</Text>
                <TextInput
                  style={[
                    styles.scoreFieldSm,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: borderRadius.sm,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={set.tiebreak1 !== null ? String(set.tiebreak1) : ''}
                  onChangeText={(v) => onUpdateSet(i, 'tiebreak1', v ? parseInt(v, 10) : null)}
                  keyboardType="number-pad"
                  editable={!readOnly}
                  maxLength={2}
                />
                <Text style={[typography.caption, { color: colors.textTertiary }]}>:</Text>
                <TextInput
                  style={[
                    styles.scoreFieldSm,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: borderRadius.sm,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={set.tiebreak2 !== null ? String(set.tiebreak2) : ''}
                  onChangeText={(v) => onUpdateSet(i, 'tiebreak2', v ? parseInt(v, 10) : null)}
                  keyboardType="number-pad"
                  editable={!readOnly}
                  maxLength={2}
                />
              </View>
            )}
          </View>
        );
      })}
      {!readOnly && (
        <Pressable
          onPress={onAddSet}
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.accentLight} />
          <Text
            style={[typography.bodySmall, { color: colors.accentLight, marginLeft: spacing.xs }]}
          >
            Satz hinzufuegen
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scoreField: { width: 48, height: 48, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  scoreFieldSm: { width: 40, height: 36, textAlign: 'center', fontSize: 16 },
});
