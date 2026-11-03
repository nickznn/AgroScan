import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { SyncBadge } from './StatusBadge';

export function ScreenHeader({
  title,
  showSync,
  offline,
  onBack,
}: {
  title: string;
  showSync?: boolean;
  offline?: boolean;
  onBack?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color={colors.onPrimary} />
          </Pressable>
        ) : (
          <MaterialIcons name="agriculture" size={22} color={colors.onPrimary} style={{ marginRight: 8 }} />
        )}
        <Text style={[typography.titleMd, { color: colors.onPrimary, flex: 1 }]} numberOfLines={1}>
          {title}
        </Text>
        {showSync && <SyncBadge offline={!!offline} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
});
