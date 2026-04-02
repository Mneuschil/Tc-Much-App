import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_NAMES = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const heroBg = require('../../../assets/images/hero-bg.jpg') as number;

interface WeekEvent {
  id: string;
  startDate: string;
  type: string;
}

interface HeroHeaderProps {
  displayName: string;
  unreadCount: number;
  events: WeekEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

function getWeekDays(base: Date): Date[] {
  const d = base.getDay();
  const off = d === 0 ? -6 : 1 - d;
  const mon = new Date(base);
  mon.setDate(base.getDate() + off);
  mon.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    return day;
  });
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function same(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function HeroHeader({
  displayName: _displayName,
  unreadCount,
  events,
  selectedDate,
  onDateSelect,
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, WeekEvent[]>();
    for (const ev of events) {
      const k = toKey(new Date(ev.startDate));
      const arr = map.get(k);
      if (arr) {
        arr.push(ev);
      } else {
        map.set(k, [ev]);
      }
    }
    return map;
  }, [events]);

  const dotColor = (type: string): string => {
    if (type.includes('MATCH')) return '#FF453A';
    if (type === 'TOURNAMENT' || type === 'CLUB_CHAMPIONSHIP') return '#0EA65A';
    if (type === 'TRAINING') return '#34D058';
    return 'rgba(255,255,255,0.5)';
  };

  const isToday = same(selectedDate, today);

  const calendarStrip = (
    <View style={styles.calendarSection}>
      {/* Today label + month */}
      <View style={styles.metaRow}>
        <Text style={styles.todayLabel}>{isToday ? 'Heute' : ''}</Text>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
      </View>

      {/* Week strip */}
      <View style={styles.weekRow}>
        {weekDays.map((day, index) => {
          const isTodayDay = same(day, today);
          const isSelected = same(day, selectedDate);
          const key = toKey(day);
          const dayEvts = eventsByDate.get(key) ?? [];

          return (
            <Pressable key={key} onPress={() => onDateSelect(day)} style={styles.dayCol}>
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                {DAY_LABELS[index]}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  isSelected && styles.dayCircleActive,
                  isTodayDay && !isSelected && styles.dayCircleToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberActive,
                    isTodayDay && !isSelected && styles.dayNumberToday,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
              <View style={styles.dotsRow}>
                {dayEvts.length > 0 ? (
                  dayEvts
                    .slice(0, 3)
                    .map((ev) => (
                      <View
                        key={ev.id}
                        style={[styles.dot, { backgroundColor: dotColor(ev.type) }]}
                      />
                    ))
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <ImageBackground source={heroBg} style={styles.hero} resizeMode="cover">
      {/* Single continuous gradient: transparent → dark hint → green */}
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.08)',
          'rgba(0,0,0,0.05)',
          'rgba(2,51,32,0.2)',
          'rgba(2,51,32,0.55)',
          'rgba(2,51,32,0.82)',
          'rgba(2,51,32,0.92)',
        ]}
        locations={[0, 0.25, 0.45, 0.6, 0.78, 1]}
        style={[styles.overlay, { paddingTop: insets.top }]}
      >
        {/* Top action row */}
        <View style={styles.topRow}>
          <Pressable style={styles.glassBtn} onPress={() => router.push('/search' as never)}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <View style={styles.topRight}>
            <Pressable
              style={styles.glassBtn}
              onPress={() => router.push('/notifications' as never)}
            >
              <Ionicons name="notifications-outline" size={18} color="rgba(255,255,255,0.9)" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.glassBtn}
              onPress={() => router.push('/(tabs)/calendar' as never)}
            >
              <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>
        </View>

        {/* Calendar strip — sits in the green zone */}
        {calendarStrip}
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  overlay: { paddingHorizontal: 20 },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 80,
  },
  topRight: { flexDirection: 'row', gap: 10 },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(2,51,32,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF453A',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  calendarSection: { paddingTop: 14, paddingBottom: 16 },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  todayLabel: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  monthLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },

  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  dayCol: { alignItems: 'center', flex: 1 },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayLabelActive: { color: '#fff' },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: 'rgba(255,255,255,0.95)' },
  dayCircleToday: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  dayNumber: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  dayNumberActive: { color: '#023320', fontWeight: '700' },
  dayNumberToday: { color: '#fff' },
  dotsRow: { flexDirection: 'row', marginTop: 6, gap: 3, height: 6, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotPlaceholder: { height: 5 },
});
