import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  replyTo: { id: string; content: string } | null;
  onCancelReply: () => void;
  disabled?: boolean;
  disabledText?: string;
}

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  replyTo,
  onCancelReply,
  disabled,
  disabledText,
}: ChatInputBarProps) {
  const { colors, spacing, borderRadius, isDark, typography } = useTheme();
  const canSend = value.trim().length > 0;

  if (disabled) {
    return (
      <View style={[styles.disabledBar, { paddingVertical: spacing.lg }]}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center' }]}>
          {disabledText}
        </Text>
      </View>
    );
  }

  return (
    <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.blurWrap}>
      <View
        style={[
          styles.greenOverlay,
          { backgroundColor: isDark ? 'rgba(14,166,90,0.08)' : 'rgba(2,51,32,0.06)' },
        ]}
      />

      {replyTo && (
        <View
          style={[
            styles.replyBar,
            { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xs },
          ]}
        >
          <View
            style={[
              styles.replyIndicator,
              { backgroundColor: colors.accentLight, borderRadius: 2 },
            ]}
          />
          <Text
            style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}
            numberOfLines={1}
          >
            {replyTo.content}
          </Text>
          <Pressable onPress={onCancelReply} hitSlop={10}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}

      <View
        style={[styles.inputRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}
      >
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              borderRadius: borderRadius.full,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.textPrimary, paddingHorizontal: spacing.lg }]}
            value={value}
            onChangeText={onChangeText}
            placeholder="Nachricht..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={5000}
          />
        </View>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          style={[
            styles.sendBtn,
            {
              backgroundColor: canSend ? colors.accent : 'transparent',
              borderRadius: borderRadius.full,
            },
          ]}
        >
          <Ionicons name="arrow-up" size={20} color={canSend ? '#FFFFFF' : colors.textTertiary} />
        </Pressable>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurWrap: { overflow: 'hidden' },
  greenOverlay: { ...StyleSheet.absoluteFillObject },
  replyBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyIndicator: { width: 3, height: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  inputWrap: { flex: 1, minHeight: 38, justifyContent: 'center' },
  input: { fontSize: 15, maxHeight: 100, paddingVertical: 8 },
  sendBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  disabledBar: { alignItems: 'center' },
});
