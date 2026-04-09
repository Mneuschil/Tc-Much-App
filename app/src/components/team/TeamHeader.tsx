import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar, Badge } from '../ui';
import { useChannel } from '../../features/chat/hooks/useChannels';

const TYPE_LABELS: Record<string, string> = {
  MATCH_TEAM: 'Mannschaft',
  TRAINING_GROUP: 'Trainingsgruppe',
  BOARD_GROUP: 'Organisation',
};

interface MemberData {
  id: string;
  position: number | null;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

interface TeamHeaderProps {
  team: {
    id: string;
    name: string;
    type: string;
    league: string | null;
    season: string | null;
    members?: MemberData[];
  };
  channelId: string | null | undefined;
  onMembersPress: () => void;
}

interface ChannelData {
  id: string;
  name: string;
  description: string | null;
}

export function TeamHeader({ team, channelId, onMembersPress }: TeamHeaderProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { data: channelData } = useChannel(channelId ?? '');
  const channel = channelData as ChannelData | undefined;

  const members = team.members ?? [];
  const visibleAvatars = members.slice(0, 5);
  const overflow = Math.max(0, members.length - visibleAvatars.length);
  const description = channel?.description ?? null;

  return (
    <View
      style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Badge label={TYPE_LABELS[team.type] ?? team.type} variant="dark" />
        {team.league && <Badge label={team.league} variant="neutral" />}
        {team.season && <Badge label={team.season} variant="neutral" />}
      </View>

      {description && (
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.md, lineHeight: 20 },
          ]}
        >
          {description}
        </Text>
      )}

      <Pressable
        onPress={onMembersPress}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing.lg,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: borderRadius.lg,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.avatarStack}>
          {visibleAvatars.map((m, idx) => (
            <View
              key={m.id}
              style={[
                styles.avatarWrap,
                {
                  marginLeft: idx === 0 ? 0 : -10,
                  borderColor: colors.backgroundSecondary,
                  zIndex: visibleAvatars.length - idx,
                },
              ]}
            >
              <Avatar
                firstName={m.user.firstName}
                lastName={m.user.lastName}
                imageUrl={m.user.avatarUrl}
                size="sm"
              />
            </View>
          ))}
          {overflow > 0 && (
            <View
              style={[
                styles.overflowBadge,
                {
                  backgroundColor: colors.backgroundTertiary,
                  borderColor: colors.backgroundSecondary,
                },
              ]}
            >
              <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>
                +{overflow}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
            {members.length} {members.length === 1 ? 'Mitglied' : 'Mitglieder'}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            Tippen für Übersicht
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    borderWidth: 2,
    borderRadius: 999,
  },
  overflowBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
});
