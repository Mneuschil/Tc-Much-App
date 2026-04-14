import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WeekDayStrip } from './WeekDayStrip';
import type { CalendarEvent } from '../../utils/calendarUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const heroBg = require('../../../assets/images/hero-bg.jpg') as number;

type WeekEvent = Pick<CalendarEvent, 'id' | 'startDate' | 'type'>;

interface HeroHeaderProps {
  displayName: string;
  unreadCount: number;
  events: WeekEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
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

  return (
    <View style={styles.hero}>
      <Image
        source={heroBg}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        accessibilityElementsHidden
      />
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
        <View style={styles.topRow}>
          <Pressable
            style={styles.glassBtn}
            onPress={() => router.push('/channels' as never)}
            accessibilityLabel="Suchen"
            accessibilityRole="button"
          >
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <View style={styles.topRight}>
            <Pressable
              style={styles.glassBtn}
              onPress={() => router.push('/notifications' as never)}
              accessibilityLabel={
                unreadCount > 0
                  ? `${unreadCount} ungelesene Benachrichtigungen`
                  : 'Benachrichtigungen'
              }
              accessibilityRole="button"
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
              accessibilityLabel="Kalender öffnen"
              accessibilityRole="button"
            >
              <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>
        </View>

        <WeekDayStrip events={events} selectedDate={selectedDate} onDateSelect={onDateSelect} />
      </LinearGradient>
    </View>
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
});
