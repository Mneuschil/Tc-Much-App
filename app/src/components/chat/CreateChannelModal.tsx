import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button, FilterPill } from '../ui';
import { useCreateChannel } from '../../features/chat/hooks/useChannels';
import type { ChannelVisibility } from '@tennis-club/shared';

interface CreateChannelModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateChannelModal({ visible, onClose }: CreateChannelModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const createChannel = useCreateChannel();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<ChannelVisibility>('PUBLIC' as ChannelVisibility);

  const handleCreate = () => {
    if (!name.trim()) return;
    createChannel.mutate(
      { name: name.trim(), description: description.trim() || undefined, visibility },
      {
        onSuccess: (data: { id: string }) => {
          setName('');
          setDescription('');
          onClose();
          router.push(`/channel/${data.id}`);
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { padding: spacing.xl }]}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Neuer Channel</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: 0 }}>
          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                color: colors.textPrimary,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Kanalname"
            placeholderTextColor={colors.textTertiary}
          />

          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Beschreibung
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.multiline,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                color: colors.textPrimary,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Beschreibung (optional)"
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
          />

          <Text
            style={[
              typography.captionMedium,
              { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
            ]}
          >
            Sichtbarkeit
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FilterPill
              label="Oeffentlich"
              isActive={visibility === 'PUBLIC'}
              onPress={() => setVisibility('PUBLIC' as ChannelVisibility)}
            />
            <FilterPill
              label="Eingeschraenkt"
              isActive={visibility === 'RESTRICTED'}
              onPress={() => setVisibility('RESTRICTED' as ChannelVisibility)}
            />
          </View>

          <View style={{ marginTop: spacing.xxl }}>
            <Button
              title="Channel erstellen"
              onPress={handleCreate}
              variant="primary"
              fullWidth
              loading={createChannel.isPending}
              disabled={!name.trim()}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { height: 48, paddingHorizontal: 16, fontSize: 15, justifyContent: 'center' },
  multiline: { height: 100, paddingTop: 12, paddingBottom: 12 },
});
