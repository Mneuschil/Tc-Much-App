import { View, Text, StyleSheet, SectionList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar, Badge } from '../../src/components/ui';
import { useTeam } from '../../src/features/teams/hooks/useTeams';
import { MOCK_TEAMS } from '../../src/lib/mockData';

const TYPE_LABELS: Record<string, string> = { MATCH_TEAM: 'Mannschaft', TRAINING_GROUP: 'Trainingsgruppe', BOARD_GROUP: 'Vorstandsgruppe' };

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const { data: teamData } = useTeam(id!);
  const team = teamData ?? MOCK_TEAMS.find(t => t.id === id) ?? MOCK_TEAMS[0];

  if (!team) return null;

  const sections = [{ title: `Mitglieder (${team.members?.length ?? 0})`, data: team.members ?? [] }];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: team.name, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary, headerShadowVisible: false }} />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Badge label={TYPE_LABELS[team.type] ?? team.type} variant="dark" />
            {team.league && <Badge label={team.league} variant="neutral" />}
            {team.season && <Badge label={team.season} variant="neutral" />}
          </View>
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(item: any) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.background }}>
              <Text style={[typography.h4, { color: colors.textPrimary }]}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }: { item: any }) => (
            <View style={[styles.memberRow, { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomColor: colors.separator }]}>
              <Avatar firstName={item.user.firstName} lastName={item.user.lastName} imageUrl={item.user.avatarUrl} size="sm" />
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.user.firstName} {item.user.lastName}</Text>
              </View>
              {item.position && <Text style={[typography.captionMedium, { color: colors.textTertiary }]}>Pos. {item.position}</Text>}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<View style={{ padding: spacing.xl }}><Text style={[typography.bodySmall, { color: colors.textTertiary }]}>Keine Mitglieder</Text></View>}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
