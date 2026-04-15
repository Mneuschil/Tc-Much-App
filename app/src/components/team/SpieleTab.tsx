import { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
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

  type SpieleListItem = { type: 'header'; title: string } | { type: 'item'; data: EventData };

  const sections = useMemo(
    () => [
      ...(upcoming.length > 0 ? [{ title: 'Kommende', data: upcoming }] : []),
      ...(past.length > 0 ? [{ title: 'Vergangene', data: past }] : []),
    ],
    [upcoming, past],
  );

  const flatData = useMemo(() => {
    const result: SpieleListItem[] = [];
    sections.forEach((section) => {
      result.push({ type: 'header', title: section.title });
      section.data.forEach((item) => result.push({ type: 'item', data: item }));
    });
    return result;
  }, [sections]);

  const stickyIndices = useMemo(() => {
    const indices: number[] = [];
    let idx = 0;
    sections.forEach((section) => {
      indices.push(idx);
      idx += 1 + section.data.length;
    });
    return indices;
  }, [sections]);

  const navigateToMatch = useCallback(
    (matchId: string) => {
      router.push({ pathname: '/match/[id]', params: { id: matchId } });
    },
    [router],
  );

  const renderSpieleItem = useCallback(
    ({ item }: { item: SpieleListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[typography.h4, { color: colors.textPrimary }]} accessibilityRole="header">
              {item.title}
            </Text>
          </View>
        );
      }
      const event = item.data;
      return (
        <Pressable
          onPress={() => navigateToMatch(event.id)}
          accessibilityLabel={`Spiel: ${event.title}`}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.matchRow,
            {
              borderBottomColor: colors.separator,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={styles.matchMeta}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {formatDate(event.startDate)} · {formatTime(event.startDate)}
            </Text>
            {event.isHomeGame !== null && (
              <Badge
                label={event.isHomeGame ? 'H' : 'A'}
                variant={event.isHomeGame ? 'success' : 'neutral'}
                size="sm"
              />
            )}
          </View>
        </Pressable>
      );
    },
    [navigateToMatch, colors, typography],
  );

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={flatData}
        getItemType={(item) => item.type}
        stickyHeaderIndices={stickyIndices}
        keyExtractor={(item) => (item.type === 'header' ? `header-${item.title}` : item.data.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          nextMatch ? (
            <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
              <CardElevated>
                <Pressable
                  onPress={() => navigateToMatch(nextMatch.id)}
                  accessibilityLabel={`Nächstes Spiel: ${nextMatch.title}`}
                  accessibilityRole="button"
                >
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
                    style={[
                      typography.body,
                      { color: colors.textSecondary, marginTop: spacing.xs },
                    ]}
                  >
                    {formatRelative(nextMatch.startDate)}
                  </Text>
                  {nextMatch.location && (
                    <Pressable
                      onPress={() => openMaps(nextMatch.location!)}
                      accessibilityLabel={`Spielort: ${nextMatch.location}`}
                      accessibilityRole="link"
                      accessibilityHint="Öffnet die Karten-App"
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
        renderItem={renderSpieleItem}
        ListEmptyComponent={
          <EmptyState title="Keine Spiele" description="Keine Mannschaftsspiele geplant" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  matchRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matchMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
