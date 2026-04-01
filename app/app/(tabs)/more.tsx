import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';
import { usePermissions } from '../../src/hooks/usePermissions';
import { queryClient } from '../../src/lib/queryClient';
import { UserRole } from '@tennis-club/shared';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.MEMBER]: 'Mitglied',
  [UserRole.TRAINER]: 'Trainer',
  [UserRole.BOARD_MEMBER]: 'Vorstand',
  [UserRole.TEAM_CAPTAIN]: 'Mannschaftsführer',
  [UserRole.PARENT]: 'Elternteil',
  [UserRole.CLUB_ADMIN]: 'Admin',
  [UserRole.SYSTEM_ADMIN]: 'System-Admin',
};

const MENU_ITEMS = [
  { title: 'Kanäle verwalten', icon: 'chatbubbles-outline' as const, route: '/channels-manage' },
  { title: 'Aufgaben', icon: 'checkbox-outline' as const, route: '/todo' },
  { title: 'Dateien', icon: 'folder-outline' as const, route: '/files' },
  { title: 'Formulare', icon: 'document-text-outline' as const, route: '/forms' },
  { title: 'Rangliste', icon: 'stats-chart-outline' as const, route: '/ranking' },
  { title: 'Einstellungen', icon: 'settings-outline' as const, route: '/settings' },
];

export default function MoreScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isAdmin } = usePermissions();

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 100 }}>
        {/* Profile Header */}
        <Pressable
          onPress={() => router.push('/profile' as never)}
          style={({ pressed }) => [styles.profileHeader, { marginBottom: spacing.xxl, opacity: pressed ? 0.7 : 1 }]}
        >
          <Avatar
            imageUrl={user?.avatarUrl}
            firstName={user?.firstName}
            lastName={user?.lastName}
            size="lg"
          />
          <View style={{ marginLeft: spacing.lg, flex: 1 }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <View style={[styles.badgeRow, { marginTop: spacing.xs }]}>
              {user?.roles.map((role) => (
                <Badge key={role} label={ROLE_LABELS[role]} variant="accent" size="sm" />
              ))}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </Pressable>

        {/* Menu Items */}
        {MENU_ITEMS.map((item, index) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as never)}
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
            <View style={[styles.menuIcon, { backgroundColor: colors.backgroundSecondary, borderRadius: radii.lg }]}>
              <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
            </View>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.md }]}>
              {item.title}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        ))}

        {/* Admin Menu */}
        {isAdmin && (
          <Pressable
            onPress={() => router.push('/admin/members' as never)}
            style={({ pressed }) => [
              styles.menuItem,
              {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.separator,
                paddingVertical: spacing.lg,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.backgroundSecondary, borderRadius: radii.lg }]}>
              <Ionicons name="people-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: spacing.md }]}>
              Mitglieder verwalten
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        )}

        {/* Logout */}
        <View style={{ marginTop: spacing.xxxl }}>
          <Button title="Abmelden" onPress={handleLogout} variant="destructive" fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
