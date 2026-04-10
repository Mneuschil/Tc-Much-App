import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  imageUrl?: string | null;
  name?: string;
  firstName?: string;
  lastName?: string;
  size?: AvatarSize;
  showOnline?: boolean;
}

const SIZES: Record<AvatarSize, number> = { xs: 28, sm: 32, md: 40, lg: 56, xl: 80 };
const FONT_SIZES: Record<AvatarSize, number> = { xs: 10, sm: 12, md: 15, lg: 20, xl: 28 };

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function Avatar({ imageUrl, name, firstName, lastName, size = 'md' }: AvatarProps) {
  const { colors, radii } = useTheme();
  const dimension = SIZES[size];
  const displayName = name || `${firstName || ''} ${lastName || ''}`.trim() || '??';
  const initials = getInitials(displayName);

  return (
    <View style={{ width: dimension, height: dimension }}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: dimension, height: dimension, borderRadius: radii.pill }}
          accessibilityLabel={`Profilbild von ${displayName}`}
          accessibilityRole="image"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: dimension,
              height: dimension,
              borderRadius: radii.pill,
              backgroundColor: colors.accent,
            },
          ]}
        >
          <Text
            style={{ fontSize: FONT_SIZES[size], fontWeight: '600', color: colors.textInverse }}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
