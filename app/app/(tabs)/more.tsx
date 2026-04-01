import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';

const MENU_ITEMS = [
  { title: 'Rangliste', subtitle: 'Vereinsinterne Rangliste', icon: 'stats-chart' as const, route: '/ranking' },
  { title: 'Turniere', subtitle: 'Clubmeisterschaften & mehr', icon: 'trophy' as const, route: '/tournaments' },
  { title: 'Todos', subtitle: 'Offene Aufgaben', icon: 'checkbox' as const, route: '/todo' },
  { title: 'Benachrichtigungen', subtitle: 'Alle Mitteilungen', icon: 'notifications' as const, route: '/notifications' },
  { title: 'Training', subtitle: 'Trainingsgruppen & Termine', icon: 'fitness' as const, route: '/training' },
  { title: 'Formulare', subtitle: 'Platzschaden & Medien', icon: 'document-text' as const, route: '/forms' },
];

export default function MoreScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Mehr</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>
        {MENU_ITEMS.map((item, index) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => [
              styles.menuItem,
              {
                borderBottomWidth: index < MENU_ITEMS.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: colors.separator,
                paddingVertical: spacing.lg,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
              <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
