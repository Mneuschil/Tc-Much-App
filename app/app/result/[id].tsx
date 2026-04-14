import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { getSetsWon } from '../../src/features/match/utils/tennisScoring';
// MOCK: Ersetzen durch useMatchResult(id) Hook wenn Backend-Endpoint bereit
import { getResultById } from '../../src/components/home/mockResults';
import { ResultHeroContent } from '../../src/components/match/ResultHeroContent';
import { PlayerScoreboard } from '../../src/components/match/PlayerScoreboard';
import { SingleMatchCard } from '../../src/components/match/SingleMatchCard';
import { PhotoGrid } from '../../src/components/match/PhotoGrid';

const TYPE_LABELS: Record<string, string> = {
  LEAGUE_MATCH: 'Medenspiel',
  CUP_MATCH: 'Pokal',
  RANKING_MATCH: 'Rangliste',
  CLUB_CHAMPIONSHIP: 'Clubmeisterschaft',
};

const RESULT_PHOTOS: string[] = [];

type Tab = 'ergebnis' | 'bilder';

export default function ResultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('ergebnis');

  const result = getResultById(id ?? '');

  if (!result) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Ergebnis' }} />
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Ergebnis nicht gefunden
          </Text>
        </View>
      </>
    );
  }

  const isTeamMatch = result.type === 'LEAGUE_MATCH' || result.type === 'CUP_MATCH';
  const p1Won = result.winnerId === 'player1';
  const label = TYPE_LABELS[result.type] ?? result.type;
  const homeWins = result.matches.filter((m) => m.winnerId === 'player1').length;
  const awayWins = result.matches.filter((m) => m.winnerId === 'player2').length;
  const setsWon = getSetsWon(result.sets);

  const gradientColors: [string, string] = isDark
    ? ['rgba(14, 166, 90, 0.15)', 'rgba(2, 51, 32, 0.25)']
    : ['rgba(209, 242, 236, 0.7)', 'rgba(237, 249, 246, 0.5)'];

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'ergebnis', label: 'Ergebnis', icon: 'stats-chart-outline' },
    { key: 'bilder', label: 'Bilder', icon: 'images-outline' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: result.title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero */}
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            <View style={{ borderRadius: borderRadius.xl, overflow: 'hidden' }}>
              <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                {Platform.OS === 'ios' ? (
                  <BlurView intensity={50} tint={isDark ? 'dark' : 'light'}>
                    <ResultHeroContent
                      result={result}
                      isTeamMatch={isTeamMatch}
                      p1Won={p1Won}
                      label={label}
                      homeWins={homeWins}
                      awayWins={awayWins}
                      setsWon={setsWon}
                    />
                  </BlurView>
                ) : (
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.75)',
                    }}
                  >
                    <ResultHeroContent
                      result={result}
                      isTeamMatch={isTeamMatch}
                      p1Won={p1Won}
                      label={label}
                      homeWins={homeWins}
                      awayWins={awayWins}
                      setsWon={setsWon}
                    />
                  </View>
                )}
              </LinearGradient>
            </View>
          </View>

          {/* Tab bar */}
          <View style={[styles.tabBar, { marginHorizontal: spacing.xl, marginTop: spacing.xl }]}>
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: active ? colors.textPrimary : colors.backgroundSecondary,
                      borderRadius: borderRadius.full,
                    },
                  ]}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={active ? colors.textInverse : colors.textSecondary}
                  />
                  <Text
                    style={[
                      typography.buttonSmall,
                      { color: active ? colors.textInverse : colors.textSecondary, marginLeft: 6 },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tab content */}
          <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
            {activeTab === 'ergebnis' ? (
              isTeamMatch ? (
                <>
                  <Text
                    style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.lg }]}
                  >
                    Einzelspiele
                  </Text>
                  {[...result.matches]
                    .sort((a, b) => a.position - b.position)
                    .map((m) => (
                      <SingleMatchCard key={m.position} match={m} />
                    ))}
                </>
              ) : (
                <>
                  <Text
                    style={[typography.h4, { color: colors.textPrimary, marginBottom: spacing.lg }]}
                  >
                    Satzergebnisse
                  </Text>
                  <PlayerScoreboard
                    p1={{ firstName: result.player1.firstName, lastName: result.player1.lastName }}
                    p2={{ firstName: result.player2.firstName, lastName: result.player2.lastName }}
                    sets={result.sets}
                    large
                  />
                </>
              )
            ) : (
              <PhotoGrid photos={RESULT_PHOTOS} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    justifyContent: 'center',
  },
});

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';
