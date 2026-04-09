import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export type TeamTab = 'Teamchat' | 'Todos' | 'Dateien' | 'Spiele';

const ICONS: Record<TeamTab, keyof typeof Ionicons.glyphMap> = {
  Teamchat: 'chatbubbles',
  Todos: 'checkmark-done-circle',
  Dateien: 'folder-open',
  Spiele: 'tennisball',
};

interface TeamActionButtonsProps {
  tabs: readonly TeamTab[];
  activeTab: TeamTab;
  onChange: (tab: TeamTab) => void;
}

export function TeamActionButtons({ tabs, activeTab, onChange }: TeamActionButtonsProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.sm },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: isActive ? colors.accent : colors.backgroundSecondary,
                borderRadius: borderRadius.lg,
                paddingVertical: spacing.md,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name={ICONS[tab]}
              size={22}
              color={isActive ? colors.textInverse : colors.textPrimary}
            />
            <Text
              style={[
                typography.captionMedium,
                {
                  color: isActive ? colors.textInverse : colors.textSecondary,
                  marginTop: 4,
                },
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
});
