import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { CATEGORY_LABEL, getCategoryStyle } from '../utils/courtConstants';
import type { CourtCategory } from '../services/courtsService';

const CATEGORIES: CourtCategory[] = ['TRAINING', 'MEDENSPIEL', 'WETTSPIEL'];

export function CategoryLegend() {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={[styles.container, { gap: spacing.l }]}>
      {CATEGORIES.map((cat) => {
        const style = getCategoryStyle(cat, colors);
        return (
          <View key={cat} style={styles.item}>
            <View
              style={[
                styles.dot,
                { backgroundColor: style.bg, borderColor: style.border, marginRight: spacing.xs },
              ]}
            />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {CATEGORY_LABEL[cat]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
