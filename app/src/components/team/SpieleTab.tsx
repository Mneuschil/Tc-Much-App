import { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Badge, CardElevated, EmptyState } from '../ui';
import { useEvents } from '../../features/calendar/hooks/useEvents';
import { formatDate, formatTime, formatRelative } from '../../utils/formatDate';

interface EventData {
  id: string;
  title: string;
  type: string;
  startDate: string;
  location: string | null;
  isHomeGame: boolean | null;
  teamId: string | null;
}

interface SpieleTabProps {
  teamId: string;
}

function openMaps(location: string) {
  const encoded = encodeURIComponent(location);
  const url = Platform.select({
    ios: `https://maps.apple.com/?q=${encoded}`,
    default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
  });
  if (url) Linking.openURL(url);
}

export function SpieleTab({ teamId }: SpieleTabProps) {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { data } = useEvents(undefined, undefined, undefined, teamId);

  const allEvents = useMemo(() => {
    const events = ((data ?? []) as EventData[]).filter(
      (e) => e.type === 'LEAGUE_MATCH' || e.type === 'CUP_MATCH',
    );
    return events;
  }, [data]);

  const { upcoming, past, nextMatch } = useMemo(() => {
    const now = new Date();
    const up = allEvents
      .filter((e) => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const pa = allEvents
      .filter((e) => new Date(e.startDate) < now)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return { upcoming: up, past: pa, nextMatch: up[0] as EventData | undefined };
  }, [allEvents]);

  const sections = [
    ...(upcoming.length > 0 ? [{ title: 'Kommende', data: upcoming }] : []),
    ...(past.length > 0 ? [{ title: 'Vergangene', data: past }] : []),
  ];

  const navigateToMatch = (matchId: string) => {
    router.push({ pathname: '/match/[id]', params: { id: matchId } });
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListHeaderComponent={
        nextMatch ? (
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
            <CardElevated>
              <Pressable onPress={() => navigateToMatch(nextMatch.id)}>
                <Text
                  style={[
                    typography.labelSmall,
                    { color: colors.textSecondary, marginBottom: spacing.xs },
                  ]}
                >
                  NÄCHSTES SPIEL
                </Text>
                <Text style={[typography.h2, { color: colors.textPrimary }]}>
                  {nextMatch.title}
                </Text>
                <Text
                  style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}
                >
                  {formatRelative(nextMatch.startDate)}
                </Text>
                {nextMatch.location && (
                  <Pressable
                    onPress={() => openMaps(nextMatch.location!)}
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}
                  >
                    <Ionicons name="location-outline" size={14} color={colors.accentLight} />
                    <Text
                      style={[typography.bodySmall, { color: colors.accentLight, marginLeft: 4 }]}
                    >
                      {nextMatch.location}
                    </Text>
                  </Pressable>
                )}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
                  {nextMatch.isHomeGame !== null && (
                    <Badge
                      label={nextMatch.isHomeGame ? 'Heim' : 'Auswärts'}
                      variant={nextMatch.isHomeGame ? 'success' : 'neutral'}
                      size="sm"
                    />
                  )}
                </View>
              </Pressable>
            </CardElevated>
          </View>
        ) : null
      }
      renderSectionHeader={({ section }) => (
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
            paddingBottom: spacing.sm,
            backgroundColor: colors.background,
          }}
        >
          <Text style={[typography.h4, { color: colors.textPrimary }]}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigateToMatch(item.id)}
          style={({ pressed }) => [
            {
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.separator,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {formatDate(item.startDate)} · {formatTime(item.startDate)}
            </Text>
            {item.isHomeGame !== null && (
              <Badge
                label={item.isHomeGame ? 'H' : 'A'}
                variant={item.isHomeGame ? 'success' : 'neutral'}
                size="sm"
              />
            )}
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        <EmptyState title="Keine Spiele" description="Keine Mannschaftsspiele geplant" />
      }
    />
  );
}
