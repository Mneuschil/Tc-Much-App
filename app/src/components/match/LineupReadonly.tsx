import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../ui';
import type { LineupEntry } from './types';

interface LineupReadonlyProps {
  starters: LineupEntry[];
  substitutes: LineupEntry[];
}

export function LineupReadonly({ starters, substitutes }: LineupReadonlyProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const renderRow = (item: LineupEntry) => (
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
    </View>
  );

  return (
    <View>
      <Text style={[typography.captionMedium, { color: colors.success, marginBottom: spacing.sm }]}>
        Starter
      </Text>
      {starters.map(renderRow)}
      {substitutes.length > 0 && (
        <>
          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
            ]}
          >
            Ersatz
          </Text>
          {substitutes.map(renderRow)}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lineupRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
