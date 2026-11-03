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
  tone = 'default',
  badge,
}: {
  title: string;
  showSync?: boolean;
  offline?: boolean;
  onBack?: () => void;
  /** 'admin' pinta o cabeçalho com a cor da área do administrador. */
  tone?: 'default' | 'admin';
  badge?: string;
}) {
  return (
    <View style={[styles.container, tone === 'admin' && { backgroundColor: colors.admin }]}>
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
        {badge ? (
          <View style={styles.badge}>
            <Text style={[typography.labelCaps, { color: '#fff', fontSize: 10 }]}>{badge}</Text>
          </View>
        ) : null}
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
  badge: { backgroundColor: colors.adminAccent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
});
