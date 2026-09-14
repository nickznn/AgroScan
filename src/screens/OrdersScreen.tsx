import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import { MoreStackParamList } from '../navigation/types';
import { OrderStatus } from '../types';

const FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'in_progress', label: 'Em Andamento' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'completed', label: 'Concluídas' },
];

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  in_progress: { label: 'EM ANDAMENTO', color: '#7a4a00', bg: '#ffe9cc' },
  pending: { label: 'PENDENTE', color: colors.secondary, bg: colors.surfaceContainerHigh },
  completed: { label: 'CONCLUÍDA', color: colors.success, bg: '#dcf1e8' },
};

export function OrdersScreen() {
  const { orders, updateOrderStatus } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const nextAction = (status: OrderStatus): { label: string; next: OrderStatus } | null => {
    if (status === 'pending') return { label: 'Iniciar', next: 'in_progress' };
    if (status === 'in_progress') return { label: 'Concluir', next: 'completed' };
    return null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Ordens de Serviço" onBack={() => navigation.goBack()} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.filterChip, active && styles.filterChipActive]}>
                  <Text style={[typography.bodySemiBold, active && { color: colors.onPrimary }]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </View>
        }
        renderItem={({ item }) => {
          const status = STATUS_MAP[item.status];
          const action = nextAction(item.status);
          return (
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.rowBetween}>
                <View style={styles.rowStart}>
                  <MaterialIcons name="agriculture" size={16} color={colors.onSurfaceVariant} />
                  <Text style={[typography.monoSm, { marginLeft: 4 }]}>{item.code}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                  <Text style={[typography.labelCaps, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text style={[typography.titleMd, { marginTop: 8 }]}>{item.product}</Text>
              <View style={styles.rowStart}>
                <MaterialIcons name="location-on" size={16} color={colors.outline} />
                <Text style={[typography.bodySm, { marginLeft: 2 }]}>
                  {item.sector} ({item.crop})
                </Text>
              </View>
              <View style={[styles.rowBetween, styles.divider]}>
                <Text style={typography.bodySm}>{item.date}</Text>
                {action ? (
                  <Pressable onPress={() => updateOrderStatus(item.id, action.next)}>
                    <Text style={[typography.bodySemiBold, { color: colors.secondary }]}>{action.label} →</Text>
                  </Pressable>
                ) : (
                  <Text style={[typography.bodySemiBold, { color: colors.success }]}>Relatório</Text>
                )}
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingBottom: 40 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHigh },
  filterChipActive: { backgroundColor: colors.primary },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowStart: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
  divider: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
});
