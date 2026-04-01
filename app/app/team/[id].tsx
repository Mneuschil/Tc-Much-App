import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SectionList, Pressable, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, Badge, Button, CardElevated, FilterPill, EmptyState } from '../../src/components/ui';
import { useTeam } from '../../src/features/teams/hooks/useTeams';
import { useEvents } from '../../src/features/calendar/hooks/useEvents';
import { useTodos } from '../../src/features/todo/hooks/useTodos';
import { useChannelFiles } from '../../src/features/files/hooks/useFiles';
import { usePermissions } from '../../src/hooks/usePermissions';
import { formatDate, formatTime, formatRelative } from '../../src/utils/formatDate';
import { MOCK_TEAMS } from '../../src/lib/mockData';

const TYPE_LABELS: Record<string, string> = { MATCH_TEAM: 'Mannschaft', TRAINING_GROUP: 'Trainingsgruppe', BOARD_GROUP: 'Vorstandsgruppe' };
const TABS = ['Kader', 'Spiele', 'Chat', 'Todos', 'Dateien'] as const;
type Tab = typeof TABS[number];

interface TeamData {
  id: string;
  name: string;
  type: string;
  league: string | null;
  season: string | null;
  channelId?: string | null;
  members?: MemberData[];
  channels?: Array<{ id: string }>;
}

interface MemberData {
  id: string;
  position: number | null;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

interface EventData {
  id: string;
  title: string;
  type: string;
  startDate: string;
  location: string | null;
  isHomeGame: boolean | null;
  teamId: string | null;
}

interface TodoData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
}

interface FileData {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing, radii } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Kader');

  const { data: teamData } = useTeam(id!);
  const team = (teamData ?? MOCK_TEAMS.find(t => t.id === id) ?? MOCK_TEAMS[0]) as TeamData;

  if (!team) return null;

  const channelId = team.channelId ?? team.channels?.[0]?.id;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: team.name, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header badges */}
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Badge label={TYPE_LABELS[team.type] ?? team.type} variant="dark" />
            {team.league && <Badge label={team.league} variant="neutral" />}
            {team.season && <Badge label={team.season} variant="neutral" />}
          </View>
        </View>

        {/* Filter tabs */}
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {TABS.map(tab => (
              <FilterPill key={tab} label={tab} isActive={activeTab === tab} onPress={() => setActiveTab(tab)} />
            ))}
          </ScrollView>
        </View>

        {activeTab === 'Kader' && <KaderTab members={team.members ?? []} teamId={id!} />}
        {activeTab === 'Spiele' && <SpieleTab teamId={id!} />}
        {activeTab === 'Chat' && <ChatTab channelId={channelId} />}
        {activeTab === 'Todos' && <TodosTab teamId={id!} />}
        {activeTab === 'Dateien' && <DateienTab channelId={channelId} />}
      </SafeAreaView>
    </>
  );
}

/* ─── Kader Tab ─────────────────────────────────────────────────────── */

function KaderTab({ members, teamId }: { members: MemberData[]; teamId: string }) {
  const { colors, typography, spacing } = useTheme();

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListEmptyComponent={<EmptyState title="Keine Mitglieder" description="Noch keine Spieler im Kader" />}
      renderItem={({ item }) => (
        <View style={[styles.memberRow, { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomColor: colors.separator }]}>
          <Avatar firstName={item.user.firstName} lastName={item.user.lastName} imageUrl={item.user.avatarUrl} size="sm" />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.user.firstName} {item.user.lastName}</Text>
          </View>
          {item.position && <Text style={[typography.captionMedium, { color: colors.textTertiary, marginRight: spacing.sm }]}>Pos. {item.position}</Text>}
          <AvailabilityDot />
        </View>
      )}
    />
  );
}

function AvailabilityDot() {
  // Availability status would come from next match availability query
  // Using gray (unknown) as default since we don't have the specific event context
  const { colors } = useTheme();
  return (
    <View style={[styles.availabilityDot, { backgroundColor: colors.textTertiary }]} />
  );
}

/* ─── Spiele Tab ────────────────────────────────────────────────────── */

function SpieleTab({ teamId }: { teamId: string }) {
  const { colors, typography, spacing, radii, shadows } = useTheme();
  const router = useRouter();
  const { data } = useEvents(undefined);
  const allEvents = ((data ?? []) as EventData[]).filter(e => e.teamId === teamId && (e.type === 'LEAGUE_MATCH' || e.type === 'CUP_MATCH'));

  const now = new Date();
  const upcoming = allEvents.filter(e => new Date(e.startDate) >= now).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const past = allEvents.filter(e => new Date(e.startDate) < now).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const nextMatch = upcoming[0];

  const sections = [
    ...(upcoming.length > 0 ? [{ title: 'Kommende', data: upcoming }] : []),
    ...(past.length > 0 ? [{ title: 'Vergangene', data: past }] : []),
  ];

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListHeaderComponent={nextMatch ? (
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
          <CardElevated>
            <Pressable onPress={() => router.push(`/match/${nextMatch.id}` as never)}>
              <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>NAECHSTES SPIEL</Text>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{nextMatch.title}</Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {formatRelative(nextMatch.startDate)}
              </Text>
              {nextMatch.location && (
                <Pressable onPress={() => Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(nextMatch.location!)}`)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                  <Ionicons name="location-outline" size={14} color={colors.accentLight} />
                  <Text style={[typography.bodySmall, { color: colors.accentLight, marginLeft: 4 }]}>{nextMatch.location}</Text>
                </Pressable>
              )}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
                {nextMatch.isHomeGame !== null && (
                  <Badge label={nextMatch.isHomeGame ? 'Heim' : 'Auswärts'} variant={nextMatch.isHomeGame ? 'success' : 'neutral'} size="sm" />
                )}
              </View>
            </Pressable>
          </CardElevated>
        </View>
      ) : null}
      renderSectionHeader={({ section }) => (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.background }}>
          <Text style={[typography.h4, { color: colors.textPrimary }]}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/match/${item.id}` as never)}
          style={({ pressed }) => [
            { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{formatDate(item.startDate)} · {formatTime(item.startDate)}</Text>
            {item.isHomeGame !== null && (
              <Badge label={item.isHomeGame ? 'H' : 'A'} variant={item.isHomeGame ? 'success' : 'neutral'} size="sm" />
            )}
          </View>
        </Pressable>
      )}
      ListEmptyComponent={<EmptyState title="Keine Spiele" description="Keine Mannschaftsspiele geplant" />}
    />
  );
}

/* ─── Chat Tab ──────────────────────────────────────────────────────── */

function ChatTab({ channelId }: { channelId: string | undefined | null }) {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl }}>
      <Button
        title="Team-Chat oeffnen"
        onPress={() => {
          if (channelId) {
            router.push(`/channel/${channelId}` as never);
          }
        }}
        variant="accent"
        disabled={!channelId}
      />
      {!channelId && (
        <Text style={{ color: colors.textTertiary, marginTop: spacing.md, fontSize: 13 }}>Kein Chat-Kanal verknuepft</Text>
      )}
    </View>
  );
}

/* ─── Todos Tab ─────────────────────────────────────────────────────── */

function TodosTab({ teamId }: { teamId: string }) {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: todos } = useTodos(undefined, teamId);
  const { isTeamCaptain, isBoard } = usePermissions();
  const canCreate = isTeamCaptain || isBoard;

  const todoList = (todos ?? []) as TodoData[];

  return (
    <FlatList
      data={todoList}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
      ListEmptyComponent={<EmptyState title="Keine Aufgaben" description="Keine offenen Aufgaben fuer dieses Team" />}
      ListFooterComponent={canCreate ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title="Aufgabe erstellen"
            onPress={() => router.push('/todo' as never)}
            variant="secondary"
          />
        </View>
      ) : null}
      renderItem={({ item }) => (
        <View style={[styles.todoCard, { backgroundColor: colors.backgroundSecondary, borderRadius: radii.lg, padding: spacing.l, marginBottom: spacing.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={item.status === 'DONE' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={item.status === 'DONE' ? colors.success : colors.textTertiary}
            />
            <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>{item.title}</Text>
          </View>
          {item.dueDate && (
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs, marginLeft: 28 }]}>
              Fällig: {formatDate(item.dueDate)}
            </Text>
          )}
          {item.assignee && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, marginLeft: 28 }}>
              <Avatar firstName={item.assignee.firstName} lastName={item.assignee.lastName} size="xs" />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                {item.assignee.firstName} {item.assignee.lastName}
              </Text>
            </View>
          )}
        </View>
      )}
    />
  );
}

/* ─── Dateien Tab ───────────────────────────────────────────────────── */

function DateienTab({ channelId }: { channelId: string | undefined | null }) {
  const { colors, typography, spacing } = useTheme();
  const { data } = useChannelFiles(channelId ?? '');
  const files = (data ?? []) as FileData[];

  if (!channelId) {
    return <EmptyState title="Keine Dateien" description="Kein Kanal verknuepft" />;
  }

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListEmptyComponent={<EmptyState title="Keine Dateien" description="Noch keine Dateien in diesem Team" />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => Linking.openURL(item.url)}
          style={({ pressed }) => [styles.fileRow, { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderBottomColor: colors.separator, opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.fileIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons
              name={item.mimeType.startsWith('image/') ? 'image-outline' : item.mimeType.startsWith('video/') ? 'film-outline' : 'document-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{formatDate(item.createdAt)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  availabilityDot: { width: 10, height: 10, borderRadius: 5 },
  todoCard: { overflow: 'hidden' },
  fileRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  fileIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
