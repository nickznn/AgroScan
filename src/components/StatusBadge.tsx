import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../theme';
import { Severity } from '../types';

const SEVERITY_MAP: Record<Severity, { bg: string; fg: string; label: string; dot: string }> = {
  critical: { bg: colors.errorContainer, fg: colors.onErrorContainer, label: 'ALTA PRIORIDADE', dot: colors.error },
  moderate: { bg: '#ffe9cc', fg: '#7a4a00', label: 'MONITORAR', dot: colors.warning },
  low: { bg: '#dcf1e8', fg: colors.success, label: 'BAIXO RISCO', dot: colors.success },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_MAP[severity];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[typography.labelCaps, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

export function SyncBadge({ offline }: { offline: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: offline ? '#ffe9cc' : colors.surfaceContainerHigh }]}>
      <View style={[styles.dot, { backgroundColor: offline ? colors.warning : colors.success }]} />
      <Text style={[typography.labelCaps, { color: offline ? '#7a4a00' : colors.primary }]}>
        {offline ? 'OFFLINE · QUEUED' : 'SYNCED'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
});
