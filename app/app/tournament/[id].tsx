import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { Badge, Button, Avatar, FilterPill, EmptyState } from '../../src/components/ui';
import { BracketView } from '../../src/components/tournament/BracketView';
import { PartnerPickerModal } from '../../src/components/tournament/PartnerPickerModal';
import {
  useTournamentDetail,
  useBracket,
  useRegistrations,
  useRegisterForTournament,
} from '../../src/features/tournaments/hooks/useTournaments';
import { useAuthStore } from '../../src/stores/authStore';
import { formatDate } from '../../src/utils/formatDate';
import type { TournamentStatus, TournamentCategory } from '@tennis-club/shared';
import type { TournamentMatchWithPlayers } from '../../src/components/tournament/BracketView';

const STATUS_BADGE: Record<
  TournamentStatus,
  { label: string; variant: 'success' | 'warning' | 'neutral' }
> = {
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
type Tab = (typeof TABS)[number];

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Info');
  const [showPartnerPicker, setShowPartnerPicker] = useState(false);

  const { data: tournament } = useTournamentDetail(id!);
  const { data: bracket } = useBracket(id!);
  const { data: registrations } = useRegistrations(id!);
  const registerMutation = useRegisterForTournament();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const handleRegister = (partnerId?: string) => {
    registerMutation.mutate(
      { tournamentId: id!, partnerId },
      {
        onSuccess: () => {
          setShowPartnerPicker(false);
        },
      },
    );
  };

  if (!tournament) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Turnier',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
            headerShadowVisible: false,
          }}
        />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <EmptyState title="Laden..." description="" />
        </SafeAreaView>
      </>
    );
  }

  const statusInfo = STATUS_BADGE[tournament.status];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: tournament.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Tabs */}
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

function InfoTab({
  tournament,
  statusInfo,
  registrationCount,
  onRegister,
  isRegistering,
}: InfoTabProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
        <Badge label={statusInfo.label} variant={statusInfo.variant} />
        <Badge label={CATEGORY_LABELS[tournament.category]} variant="accent" />
      </View>
      <Text
        style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.sm }]}
      >
        Datum: {formatDate(tournament.startDate)}
      </Text>
      {tournament.maxParticipants && (
        <Text
          style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.sm }]}
        >
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
          <Button
            title="Anmelden"
            onPress={onRegister}
            variant="accent"
            fullWidth
            loading={isRegistering}
          />
        </View>
      )}
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
    <FlashList
      data={registrations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
      renderItem={({ item }) => (
        <View
          style={[
            styles.participantRow,
            { paddingVertical: spacing.md, borderBottomColor: colors.separator },
          ]}
        >
          <Avatar
            firstName={item.user?.firstName}
            lastName={item.user?.lastName}
            imageUrl={item.user?.avatarUrl}
            size="sm"
          />
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.textPrimary, flex: 1, marginLeft: spacing.md },
            ]}
          >
            {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unbekannt'}
          </Text>
          {item.seed && <Badge label={`#${item.seed}`} variant="accent" size="sm" />}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
