import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { Avatar, Badge, Button, FilterPill, EmptyState, QueryError } from '../../src/components/ui';
import { useTeam } from '../../src/features/teams/hooks/useTeams';
import { SpieleTab } from '../../src/components/team/SpieleTab';
import { TodosTab } from '../../src/components/team/TodosTab';
import { DateienTab } from '../../src/components/team/DateienTab';

const TYPE_LABELS: Record<string, string> = {
  MATCH_TEAM: 'Mannschaft',
  TRAINING_GROUP: 'Trainingsgruppe',
  BOARD_GROUP: 'Vorstandsgruppe',
};
const TABS = ['Kader', 'Spiele', 'Chat', 'Todos', 'Dateien'] as const;
type Tab = (typeof TABS)[number];

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

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Kader');

  const { data: teamData, isError, refetch } = useTeam(id!);
  const team = teamData as TeamData | undefined;

  if (!team) return isError ? <QueryError onRetry={refetch} /> : null;

  const channelId = team.channelId ?? team.channels?.[0]?.id;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: team.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {TABS.map((tab) => (
              <FilterPill
                key={tab}
                label={tab}
                isActive={activeTab === tab}
                onPress={() => setActiveTab(tab)}
              />
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

function KaderTab({ members, teamId: _teamId }: { members: MemberData[]; teamId: string }) {
  const { colors, typography, spacing } = useTheme();

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListEmptyComponent={
        <EmptyState title="Keine Mitglieder" description="Noch keine Spieler im Kader" />
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
            size="sm"
          />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
              {item.user.firstName} {item.user.lastName}
            </Text>
          </View>
          {item.position && (
            <Text
              style={[
                typography.captionMedium,
                { color: colors.textTertiary, marginRight: spacing.sm },
              ]}
            >
              Pos. {item.position}
            </Text>
          )}
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
  return <View style={[styles.availabilityDot, { backgroundColor: colors.textTertiary }]} />;
}

/* ─── Chat Tab ──────────────────────────────────────────────────────── */

function ChatTab({ channelId }: { channelId: string | undefined | null }) {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
      }}
    >
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
        <Text style={{ color: colors.textTertiary, marginTop: spacing.md, fontSize: 13 }}>
          Kein Chat-Kanal verknuepft
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  availabilityDot: { width: 10, height: 10, borderRadius: 5 },
});
