import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../../shared/theme';

type IconName = keyof typeof MaterialIcons.glyphMap;

/** Etiqueta pequena e arredondada (papel, status, severidade). */
export function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[typography.labelCaps, { color, fontSize: 10 }]}>{label}</Text>
    </View>
  );
}

/** Número grande do painel, com ícone e uma faixa colorida no topo. */
export function KpiTile({ icon, label, value, hint, color }: { icon: IconName; label: string; value: string | number; hint?: string; color: string }) {
  return (
    <View style={[styles.kpi, { borderTopColor: color }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '1f' }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[typography.headlineMd, { marginTop: 8 }]}>{value}</Text>
      <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>{label}</Text>
      {hint ? <Text style={[typography.monoSm, { color: colors.outline, marginTop: 2 }]}>{hint}</Text> : null}
    </View>
  );
}

/** Barra horizontal proporcional (0 a 1). */
export function HBar({ ratio, color }: { ratio: number; color: string }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.max(ratio, 0) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

/** Botão pequeno de ação (ícone + texto) usado nas linhas de listas do admin. */
export function ActionButton({
  icon,
  label,
  onPress,
  tone = 'default',
  disabled,
  style,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const color = tone === 'danger' ? colors.error : colors.adminAccent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.action, { borderColor: color + '55' }, disabled && { opacity: 0.4 }, pressed && { opacity: 0.7 }, style]}
    >
      <MaterialIcons name={icon} size={16} color={color} />
      <Text style={[typography.bodySm, { color, marginLeft: 4, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.adminAccent} />
      <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 12 }]}>Carregando...</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <MaterialIcons name="cloud-off" size={40} color={colors.error} />
      <Text style={[typography.bodyMd, { textAlign: 'center', marginTop: 12, color: colors.error }]}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.retry}>
        <Text style={[typography.bodySemiBold, { color: colors.onPrimary }]}>TENTAR DE NOVO</Text>
      </Pressable>
    </View>
  );
}

export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.center}>
      <MaterialIcons name={icon} size={40} color={colors.outline} />
      <Text style={[typography.bodyMd, { textAlign: 'center', marginTop: 12, color: colors.onSurfaceVariant }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderRadius: radius.lg,
    padding: 14,
  },
  kpiIcon: { width: 34, height: 34, borderRadius: radius.default, alignItems: 'center', justifyContent: 'center' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  action: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.default, paddingHorizontal: 10, paddingVertical: 7, marginRight: 8, marginTop: 8 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  retry: { marginTop: 16, backgroundColor: colors.adminAccent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.default },
});
