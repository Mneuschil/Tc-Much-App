import React from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { useSlotDetail } from '../hooks/useSlotDetail';
import { LoadingSkeleton, QueryError } from '../../../components/ui';
import { CATEGORY_LABEL, TRAINING_TYPE_LABEL, getCategoryStyle } from '../utils/courtConstants';
import type { CourtSlot } from '../services/courtsService';

interface SlotDetailModalProps {
  slot: CourtSlot | null;
  onClose: () => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function SlotDetailModal({ slot, onClose }: SlotDetailModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { data, isLoading, isError, refetch } = useSlotDetail(slot?.id ?? null);
  const visible = slot !== null;

  const d = data ?? slot;
  const categoryStyle = slot ? getCategoryStyle(slot.category, colors) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.m },
          ]}
        >
          <Pressable
            onPress={onClose}
            accessibilityLabel="Schließen"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.l }}>
          {slot && categoryStyle && (
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: categoryStyle.bg,
                  paddingHorizontal: spacing.m,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.full,
                  alignSelf: 'flex-start',
                },
              ]}
            >
              <Text style={[typography.caption, { color: categoryStyle.text, fontWeight: '700' }]}>
                {CATEGORY_LABEL[slot.category]}
              </Text>
            </View>
          )}

          {d && (
            <>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{d.title}</Text>
              <View style={{ gap: spacing.s }}>
                <InfoRow
                  icon="calendar-outline"
                  label={formatDate(d.startTime)}
                  colors={colors}
                  typography={typography}
                />
                <InfoRow
                  icon="time-outline"
                  label={`${formatTime(d.startTime)} – ${formatTime(d.endTime)} Uhr`}
                  colors={colors}
                  typography={typography}
                />
                <InfoRow
                  icon="tennisball-outline"
                  label={`Platz ${d.court}`}
                  colors={colors}
                  typography={typography}
                />
              </View>
            </>
          )}

          {isLoading && <LoadingSkeleton width="100%" height={120} borderRadius={12} />}

          {isError && <QueryError onRetry={refetch} />}

          {data && data.category === 'TRAINING' && <TrainingDetail data={data} />}

          {data && data.category === 'MEDENSPIEL' && <MedenspielDetail data={data} />}

          {data?.description && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.l,
                },
              ]}
            >
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>
                Beschreibung
              </Text>
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                {data.description}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  colors,
  typography,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: { textSecondary: string; textPrimary: string };
  typography: { body: object };
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
      <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>{label}</Text>
    </View>
  );
}

function TrainingDetail({
  data,
}: {
  data: { trainingType: string | null; teamName: string | null; teamShortCode: string | null };
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const label =
    (data.trainingType &&
      TRAINING_TYPE_LABEL[data.trainingType as keyof typeof TRAINING_TYPE_LABEL]) ??
    'Training';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.lg,
          padding: spacing.l,
          gap: spacing.s,
        },
      ]}
    >
      <Text style={[typography.caption, { color: colors.textSecondary }]}>Art</Text>
      <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>{label}</Text>

      {data.trainingType === 'MANNSCHAFTSTRAINING' && data.teamName && (
        <View style={{ marginTop: 8 }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Mannschaft</Text>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
            {data.teamName}
            {data.teamShortCode ? ` (${data.teamShortCode})` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

function MedenspielDetail({
  data,
}: {
  data: {
    opponentName: string | null;
    isHomeGame: boolean | null;
    teamName: string | null;
    lineup: Array<{ position: number; firstName: string; lastName: string }>;
  };
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  return (
    <View style={{ gap: spacing.l }}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: borderRadius.lg,
            padding: spacing.l,
            gap: spacing.s,
          },
        ]}
      >
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Begegnung</Text>
        <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>
          {data.teamName ?? 'TC Much'} {data.isHomeGame ? 'vs' : '@'}{' '}
          {data.opponentName ?? 'Gegner'}
        </Text>
      </View>

      {data.lineup.length > 0 && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.backgroundSecondary,
              borderRadius: borderRadius.lg,
              padding: spacing.l,
            },
          ]}
        >
          <Text
            style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.s }]}
          >
            Aufstellung
          </Text>
          {data.lineup.map((p) => (
            <View key={p.position} style={styles.lineupRow}>
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textSecondary,
                    width: 24,
                    textAlign: 'right',
                    marginRight: 12,
                  },
                ]}
              >
                {p.position}.
              </Text>
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                {p.firstName} {p.lastName}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  header: {
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {},
  card: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
});
