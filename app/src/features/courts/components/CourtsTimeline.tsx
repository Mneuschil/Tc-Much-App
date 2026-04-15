import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useTheme } from '../../../theme';
import {
  COURTS,
  HOURS,
  HOUR_HEIGHT,
  HOUR_START,
  HOUR_END,
  getCategoryStyle,
} from '../utils/courtConstants';
import type { CourtSlot } from '../services/courtsService';

interface CourtsTimelineProps {
  slots: CourtSlot[];
  onSlotPress?: (slot: CourtSlot) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  bottomInset?: number;
}

const TIME_COL_WIDTH = 48;
const HEADER_HEIGHT = 40;

function clampHourFloat(date: Date) {
  return date.getHours() + date.getMinutes() / 60;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function slotBadge(slot: CourtSlot): string {
  if (slot.category === 'TRAINING') {
    if (slot.trainingType === 'MANNSCHAFTSTRAINING' && slot.teamShortCode)
      return slot.teamShortCode;
    if (slot.trainingType === 'JUGENDTRAINING') return 'Jugend';
    if (slot.trainingType === 'SCHNUPPERSTUNDE') return 'Schnupper';
    if (slot.trainingType === 'PRIVATGRUPPE') return 'Privat';
    return slot.title;
  }
  if (slot.category === 'MEDENSPIEL') {
    if (slot.teamShortCode) return slot.teamShortCode;
    return slot.opponentName ? `vs ${slot.opponentName}` : slot.title;
  }
  if (slot.category === 'WETTSPIEL') {
    return slot.title.replace(/^DEMO:\s*/, '');
  }
  return slot.title;
}

export function CourtsTimeline({
  slots,
  onSlotPress,
  onRefresh,
  refreshing = false,
  bottomInset = 0,
}: CourtsTimelineProps) {
  const { colors, typography, borderRadius } = useTheme();

  const slotsByCourt = useMemo(() => {
    const map = new Map<number, CourtSlot[]>();
    for (const s of slots) {
      if (!COURTS.includes(s.court as (typeof COURTS)[number])) continue;
      const arr = map.get(s.court) ?? [];
      arr.push(s);
      map.set(s.court, arr);
    }
    return map;
  }, [slots]);

  const totalHeight = HOUR_HEIGHT * (HOUR_END - HOUR_START + 1);

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg },
      ]}
    >
      <View
        style={[
          styles.headerRow,
          {
            height: HEADER_HEIGHT,
            borderBottomColor: colors.borderLight,
            backgroundColor: colors.backgroundSecondary,
          },
        ]}
      >
        <View style={{ width: TIME_COL_WIDTH }} />
        {COURTS.map((c) => (
          <View key={c} style={styles.courtHeader}>
            <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Platz {c}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator
        contentContainerStyle={{ paddingBottom: bottomInset }}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
        }
      >
        <View style={styles.scrollBody}>
          <View style={{ width: TIME_COL_WIDTH }}>
            {HOURS.map((h) => (
              <View key={h} style={{ height: HOUR_HEIGHT, paddingTop: 4, alignItems: 'center' }}>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  {h.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          {COURTS.map((courtNum) => (
            <View
              key={courtNum}
              style={[
                styles.courtColumn,
                { height: totalHeight, borderLeftColor: colors.borderLight },
              ]}
            >
              {HOURS.map((h, i) =>
                i === 0 ? null : (
                  <View
                    key={h}
                    style={[
                      styles.hourLine,
                      { top: i * HOUR_HEIGHT, backgroundColor: colors.borderLight },
                    ]}
                  />
                ),
              )}
              {(slotsByCourt.get(courtNum) ?? []).map((slot) => {
                const start = new Date(slot.startTime);
                const end = new Date(slot.endTime);
                const startHour = clampHourFloat(start);
                const endHour = clampHourFloat(end);
                const top = (Math.max(HOUR_START, startHour) - HOUR_START) * HOUR_HEIGHT;
                const height = Math.max(
                  24,
                  (Math.min(HOUR_END + 1, endHour) - Math.max(HOUR_START, startHour)) *
                    HOUR_HEIGHT -
                    2,
                );
                const style = getCategoryStyle(slot.category, colors);
                const badge = slotBadge(slot);
                return (
                  <Pressable
                    key={slot.id}
                    onPress={() => onSlotPress?.(slot)}
                    accessibilityRole="button"
                    accessibilityLabel={`${slot.title}, ${formatTime(slot.startTime)} bis ${formatTime(slot.endTime)} auf Platz ${slot.court}. Antippen für Details.`}
                    style={({ pressed }) => [
                      styles.slot,
                      {
                        top,
                        height,
                        backgroundColor: style.bg,
                        borderLeftColor: style.border,
                        borderRadius: borderRadius.sm,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[typography.caption, { color: style.text, fontWeight: '700' }]}
                    >
                      {badge}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[typography.caption, { color: style.text, opacity: 0.8 }]}
                    >
                      {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  courtHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flexDirection: 'row',
  },
  courtColumn: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  slot: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderLeftWidth: 3,
    padding: 4,
    overflow: 'hidden',
  },
});
