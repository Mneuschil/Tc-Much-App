import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { QueryError } from '../../src/components/ui';
import { useTeam } from '../../src/features/teams/hooks/useTeams';
import { TeamHeader } from '../../src/components/team/TeamHeader';
import { TeamActionButtons, type TeamTab } from '../../src/components/team/TeamActionButtons';
import { TeamChatTab } from '../../src/components/team/TeamChatTab';
import { KaderSheet } from '../../src/components/team/KaderSheet';
import { SpieleTab } from '../../src/components/team/SpieleTab';
import { TodosTab } from '../../src/components/team/TodosTab';
import { DateienTab } from '../../src/components/team/DateienTab';

interface MemberData {
  id: string;
  position: number | null;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

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

const BASE_TABS: readonly TeamTab[] = ['Teamchat', 'Todos', 'Dateien'];
const MATCH_TABS: readonly TeamTab[] = ['Teamchat', 'Todos', 'Dateien', 'Spiele'];

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TeamTab>('Teamchat');
  const [kaderOpen, setKaderOpen] = useState(false);

  const { data: teamData, isError, refetch } = useTeam(id!);
  const team = teamData as TeamData | undefined;

  if (!team) return isError ? <QueryError onRetry={refetch} /> : null;

  const channelId = team.channelId ?? team.channels?.[0]?.id ?? null;
  const tabs = team.type === 'MATCH_TEAM' ? MATCH_TABS : BASE_TABS;

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
        <TeamHeader team={team} channelId={channelId} onMembersPress={() => setKaderOpen(true)} />
        <TeamActionButtons tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <View style={styles.content}>
          {activeTab === 'Teamchat' && <TeamChatTab channelId={channelId} />}
          {activeTab === 'Todos' && <TodosTab teamId={id!} />}
          {activeTab === 'Dateien' && <DateienTab channelId={channelId} />}
          {activeTab === 'Spiele' && <SpieleTab teamId={id!} />}
        </View>
      </SafeAreaView>

      <KaderSheet
        visible={kaderOpen}
        onClose={() => setKaderOpen(false)}
        members={team.members ?? []}
        teamType={team.type}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
