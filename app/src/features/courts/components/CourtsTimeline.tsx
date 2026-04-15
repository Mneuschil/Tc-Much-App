import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
}

const TIME_COL_WIDTH = 48;
const COURT_COL_WIDTH = 96;
const HEADER_HEIGHT = 40;

function clampHourFloat(date: Date) {
  return date.getHours() + date.getMinutes() / 60;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function CourtsTimeline({ slots }: CourtsTimelineProps) {
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          {/* Fixed time column */}
          <View style={{ width: TIME_COL_WIDTH }}>
            <View style={{ height: HEADER_HEIGHT }} />
            {HOURS.map((h) => (
              <View key={h} style={{ height: HOUR_HEIGHT, paddingTop: 4, alignItems: 'center' }}>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  {h.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          {/* Scrollable courts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header row */}
              <View
                style={[
                  styles.headerRow,
                  { height: HEADER_HEIGHT, borderBottomColor: colors.borderLight },
                ]}
              >
                {COURTS.map((c) => (
                  <View key={c} style={[styles.courtHeader, { width: COURT_COL_WIDTH }]}>
                    <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
                      Platz {c}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Court columns */}
              <View style={{ flexDirection: 'row' }}>
                {COURTS.map((courtNum) => (
                  <View
                    key={courtNum}
                    style={[
                      styles.courtColumn,
                      {
                        width: COURT_COL_WIDTH,
                        height: totalHeight,
                        borderLeftColor: colors.borderLight,
                      },
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
                      return (
                        <View
                          key={slot.id}
                          accessibilityRole="text"
                          accessibilityLabel={`${slot.title}, ${formatTime(slot.startTime)} bis ${formatTime(slot.endTime)} auf Platz ${slot.court}`}
                          style={[
                            styles.slot,
                            {
                              top,
                              height,
                              backgroundColor: style.bg,
                              borderLeftColor: style.border,
                              borderRadius: borderRadius.sm,
                            },
                          ]}
                        >
                          <Text
                            numberOfLines={1}
                            style={[typography.caption, { color: style.text, fontWeight: '600' }]}
                          >
                            {slot.title}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={[typography.caption, { color: style.text, opacity: 0.8 }]}
                          >
                            {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
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
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  courtHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtColumn: {
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
    left: 4,
    right: 4,
    borderLeftWidth: 3,
    padding: 6,
    overflow: 'hidden',
  },
});
