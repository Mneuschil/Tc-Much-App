import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TeamDetail } from '@tennis-club/shared';
import { useTheme } from '../../src/theme';
import { QueryError, LoadingSkeleton } from '../../src/components/ui';
import { Ionicons } from '@expo/vector-icons';
import {
  useTeam,
  useEnsureTeamChannel,
  useAddTeamMember,
  useRemoveTeamMember,
  useUpdateTeam,
  useDeleteTeam,
} from '../../src/features/teams/hooks/useTeams';
import { usePermissions } from '../../src/hooks/usePermissions';
import { TeamHeader } from '../../src/components/team/TeamHeader';
import { TeamActionButtons, type TeamTab } from '../../src/components/team/TeamActionButtons';
import { TeamChatTab } from '../../src/components/team/TeamChatTab';
import { KaderSheet } from '../../src/components/team/KaderSheet';
import { SpieleTab } from '../../src/components/team/SpieleTab';
import { TodosTab } from '../../src/components/team/TodosTab';
import { DateienTab } from '../../src/components/team/DateienTab';
import { EditTeamModal } from '../../src/components/team/EditTeamModal';

const BASE_TABS: readonly TeamTab[] = ['Teamchat', 'Todos', 'Dateien'];
const MATCH_TABS: readonly TeamTab[] = ['Teamchat', 'Todos', 'Dateien', 'Spiele'];

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TeamTab>('Teamchat');
  const [kaderOpen, setKaderOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { isBoard, isAdmin, isTeamCaptain } = usePermissions();

  const { data: teamData, isError, refetch } = useTeam(id!);
  const team = teamData as TeamDetail | undefined;

  const ensureChannel = useEnsureTeamChannel();
  const addMember = useAddTeamMember(id!);
  const removeMember = useRemoveTeamMember(id!);
  const updateTeam = useUpdateTeam(id!);
  const deleteTeam = useDeleteTeam();

  const channelId = team?.channels?.[0]?.id ?? null;
  const ensureTriggered = useRef(false);

  useEffect(() => {
    if (team && !channelId && !ensureTriggered.current) {
      ensureTriggered.current = true;
      ensureChannel.mutate(team.id);
    }
  }, [team, channelId, ensureChannel]);

  if (!team) {
    if (isError) return <QueryError onRetry={refetch} />;
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
          <LoadingSkeleton width="60%" height={20} borderRadius={8} />
          <LoadingSkeleton width="40%" height={14} borderRadius={6} />
          <LoadingSkeleton width="100%" height={56} borderRadius={16} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <LoadingSkeleton width="25%" height={64} borderRadius={12} />
            <LoadingSkeleton width="25%" height={64} borderRadius={12} />
            <LoadingSkeleton width="25%" height={64} borderRadius={12} />
          </View>
          <LoadingSkeleton width="100%" height={200} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  const tabs = team.type === 'MATCH_TEAM' ? MATCH_TABS : BASE_TABS;
  const canManage = isBoard || isAdmin || isTeamCaptain;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: team.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerRight: canManage
            ? () => (
                <Pressable onPress={() => setEditOpen(true)} hitSlop={8}>
                  <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={100}
        >
          <TeamHeader team={team} channelId={channelId} onMembersPress={() => setKaderOpen(true)} />
          <TeamActionButtons tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <View style={styles.content}>
            {activeTab === 'Teamchat' && (
              <TeamChatTab channelId={channelId} isCreatingChannel={ensureChannel.isPending} />
            )}
            {activeTab === 'Todos' && <TodosTab teamId={id!} />}
            {activeTab === 'Dateien' && (
              <DateienTab channelId={channelId} isCreatingChannel={ensureChannel.isPending} />
            )}
            {activeTab === 'Spiele' && <SpieleTab teamId={id!} />}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <KaderSheet
        visible={kaderOpen}
        onClose={() => setKaderOpen(false)}
        members={team.members ?? []}
        teamType={team.type}
        teamId={id!}
        canManage={canManage}
        onAddMember={(userId) => addMember.mutate({ userId })}
        onRemoveMember={(userId) => removeMember.mutate(userId)}
      />

      {canManage && (
        <EditTeamModal
          visible={editOpen}
          onClose={() => setEditOpen(false)}
          team={team}
          onSave={(input) => updateTeam.mutate(input, { onSuccess: () => setEditOpen(false) })}
          onDelete={
            isAdmin
              ? () =>
                  deleteTeam.mutate(id!, {
                    onSuccess: () => {
                      setEditOpen(false);
                      router.back();
                    },
                  })
              : undefined
          }
          isPending={updateTeam.isPending}
          canDelete={isAdmin}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
