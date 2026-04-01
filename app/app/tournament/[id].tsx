import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Badge, Button, Avatar, FilterPill, EmptyState } from '../../src/components/ui';
import { useTournamentDetail, useBracket, useRegistrations, useRegisterForTournament } from '../../src/features/tournaments/hooks/useTournaments';
import { useTeams } from '../../src/features/teams/hooks/useTeams';
import { useAuthStore } from '../../src/stores/authStore';
import { formatDate } from '../../src/utils/formatDate';
import type { TournamentMatch, TournamentStatus, TournamentCategory } from '@tennis-club/shared';

const STATUS_BADGE: Record<TournamentStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  REGISTRATION_OPEN: { label: 'Anmeldung offen', variant: 'success' },
  IN_PROGRESS: { label: 'Laufend', variant: 'warning' },
  COMPLETED: { label: 'Abgeschlossen', variant: 'neutral' },
};

const CATEGORY_LABELS: Record<TournamentCategory, string> = {
  SINGLES: 'Einzel',
  DOUBLES: 'Doppel',
  MIXED: 'Mixed',
};

const TABS = ['Info', 'Bracket', 'Teilnehmer'] as const;
type Tab = typeof TABS[number];

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Info');
  const [showPartnerPicker, setShowPartnerPicker] = useState(false);

  const { data: tournament } = useTournamentDetail(id!);
  const { data: bracket } = useBracket(id!);
  const { data: registrations } = useRegistrations(id!);
  const registerMutation = useRegisterForTournament();
  const currentUserId = useAuthStore(s => s.user?.id);

  const handleRegister = (partnerId?: string) => {
    registerMutation.mutate(
      { tournamentId: id!, partnerId },
      { onSuccess: () => { setShowPartnerPicker(false); Alert.alert('Erfolg', 'Anmeldung erfolgreich'); } },
    );
  };

  if (!tournament) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Turnier', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
        <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
          <EmptyState title="Laden..." description="" />
        </SafeAreaView>
      </>
    );
  }

  const statusInfo = STATUS_BADGE[tournament.status];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: tournament.name, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Tabs */}
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {TABS.map(tab => (
              <FilterPill key={tab} label={tab} isActive={activeTab === tab} onPress={() => setActiveTab(tab)} />
            ))}
          </ScrollView>
        </View>

        {activeTab === 'Info' && (
          <InfoTab
            tournament={tournament}
            statusInfo={statusInfo}
            registrationCount={(registrations as unknown[] | undefined)?.length ?? 0}
            onRegister={() => {
              if (tournament.category === 'DOUBLES') {
                setShowPartnerPicker(true);
              } else {
                handleRegister();
              }
            }}
            isRegistering={registerMutation.isPending}
          />
        )}
        {activeTab === 'Bracket' && (
          <BracketView
            matches={(bracket ?? []) as TournamentMatchWithPlayers[]}
            currentUserId={currentUserId}
          />
        )}
        {activeTab === 'Teilnehmer' && (
          <ParticipantsTab registrations={(registrations ?? []) as RegistrationWithUser[]} />
        )}

        {/* Partner Picker Modal */}
        <PartnerPickerModal
          visible={showPartnerPicker}
          onClose={() => setShowPartnerPicker(false)}
          onSelect={(partnerId) => handleRegister(partnerId)}
        />
      </SafeAreaView>
    </>
  );
}

interface InfoTabProps {
  tournament: {
    name: string;
    category: TournamentCategory;
    status: TournamentStatus;
    startDate: string;
    description: string | null;
    maxParticipants: number | null;
  };
  statusInfo: { label: string; variant: 'success' | 'warning' | 'neutral' };
  registrationCount: number;
  onRegister: () => void;
  isRegistering: boolean;
}

function InfoTab({ tournament, statusInfo, registrationCount, onRegister, isRegistering }: InfoTabProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
        <Badge label={statusInfo.label} variant={statusInfo.variant} />
        <Badge label={CATEGORY_LABELS[tournament.category]} variant="accent" />
      </View>
      <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        Datum: {formatDate(tournament.startDate)}
      </Text>
      {tournament.maxParticipants && (
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          Teilnehmer: {registrationCount}/{tournament.maxParticipants}
        </Text>
      )}
      {tournament.description && (
        <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.md }]}>
          {tournament.description}
        </Text>
      )}
      {tournament.status === 'REGISTRATION_OPEN' && (
        <View style={{ marginTop: spacing.xxl }}>
          <Button title="Anmelden" onPress={onRegister} variant="accent" fullWidth loading={isRegistering} />
        </View>
      )}
    </ScrollView>
  );
}

interface TournamentMatchWithPlayers extends TournamentMatch {
  player1?: { id: string; firstName: string; lastName: string } | null;
  player2?: { id: string; firstName: string; lastName: string } | null;
  winner?: { id: string; firstName: string; lastName: string } | null;
}

interface BracketViewProps {
  matches: TournamentMatchWithPlayers[];
  currentUserId: string | undefined;
}

function BracketView({ matches, currentUserId }: BracketViewProps) {
  const { colors, typography, spacing, radii } = useTheme();

  const rounds = useMemo(() => {
    const roundMap = new Map<number, TournamentMatchWithPlayers[]>();
    for (const match of matches) {
      const existing = roundMap.get(match.round) ?? [];
      existing.push(match);
      roundMap.set(match.round, existing);
    }
    return Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, roundMatches]) => ({
        round,
        matches: roundMatches.sort((a, b) => a.position - b.position),
      }));
  }, [matches]);

  if (matches.length === 0) {
    return <EmptyState title="Kein Bracket" description="Das Bracket wird nach der Auslosung angezeigt" />;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>
      {rounds.map(({ round, matches: roundMatches }) => (
        <View key={round} style={{ width: 160, marginRight: spacing.lg }}>
          <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.md, textAlign: 'center' }]}>
            Runde {round}
          </Text>
          {roundMatches.map(match => {
            const isOwn = currentUserId && (match.player1Id === currentUserId || match.player2Id === currentUserId);
            const p1Name = match.player1 ? `${match.player1.firstName} ${match.player1.lastName.charAt(0)}.` : 'TBD';
            const p2Name = match.player2 ? `${match.player2.firstName} ${match.player2.lastName.charAt(0)}.` : 'TBD';
            const isP1Winner = match.winnerId && match.player1Id === match.winnerId;
            const isP2Winner = match.winnerId && match.player2Id === match.winnerId;

            return (
              <View
                key={match.id}
                style={[
                  styles.bracketCard,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: radii.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.md,
                    borderWidth: isOwn ? 1.5 : 0,
                    borderColor: isOwn ? colors.accent : 'transparent',
                  },
                ]}
              >
                <Text style={[typography.bodySmall, { color: colors.textPrimary, fontWeight: isP1Winner ? '700' : '400' }]} numberOfLines={1}>
                  {p1Name}
                </Text>
                <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center', marginVertical: 2 }]}>vs</Text>
                <Text style={[typography.bodySmall, { color: colors.textPrimary, fontWeight: isP2Winner ? '700' : '400' }]} numberOfLines={1}>
                  {p2Name}
                </Text>
                {match.score && (
                  <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
                    {match.score}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

interface RegistrationWithUser {
  id: string;
  userId: string;
  seed: number | null;
  user?: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

function ParticipantsTab({ registrations }: { registrations: RegistrationWithUser[] }) {
  const { colors, typography, spacing } = useTheme();

  if (registrations.length === 0) {
    return <EmptyState title="Keine Teilnehmer" description="Noch keine Anmeldungen" />;
  }

  return (
    <FlatList
      data={registrations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
      renderItem={({ item }) => (
        <View style={[styles.participantRow, { paddingVertical: spacing.md, borderBottomColor: colors.separator }]}>
          <Avatar
            firstName={item.user?.firstName}
            lastName={item.user?.lastName}
            imageUrl={item.user?.avatarUrl}
            size="sm"
          />
          <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.md }]}>
            {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unbekannt'}
          </Text>
          {item.seed && <Badge label={`#${item.seed}`} variant="accent" size="sm" />}
        </View>
      )}
    />
  );
}

interface PartnerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (partnerId: string) => void;
}

function PartnerPickerModal({ visible, onClose, onSelect }: PartnerPickerModalProps) {
  const { colors, typography, spacing, radii } = useTheme();
  const { data: teams } = useTeams();
  const members = useMemo(() => {
    const allMembers: Array<{ id: string; firstName: string; lastName: string }> = [];
    const seen = new Set<string>();
    for (const team of (teams ?? []) as Array<{ members?: Array<{ user: { id: string; firstName: string; lastName: string } }> }>) {
      for (const member of team.members ?? []) {
        if (!seen.has(member.user.id)) {
          seen.add(member.user.id);
          allMembers.push(member.user);
        }
      }
    }
    return allMembers;
  }, [teams]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Partner waehlen</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [styles.participantRow, { paddingVertical: spacing.md, borderBottomColor: colors.separator, opacity: pressed ? 0.7 : 1 }]}
            >
              <Avatar firstName={item.firstName} lastName={item.lastName} size="sm" />
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.md }]}>
                {item.firstName} {item.lastName}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState title="Keine Mitglieder" description="Keine Vereinsmitglieder gefunden" />}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bracketCard: { overflow: 'hidden' },
  participantRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
