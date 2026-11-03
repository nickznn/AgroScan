import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, typography } from '../../../shared/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { Card } from '../../../shared/components/Card';
import { AdminMoreStackParamList } from '../../../navigation/types';
import { OrderStatus, Result } from '../../../shared/models';
import { AdminOrder } from '../../../shared/models/admin';
import { AdminOrderFilter, useAdminOrdersViewModel } from '../viewmodel/useAdminOrdersViewModel';
import { ActionButton, EmptyState, ErrorState, LoadingState } from './AdminParts';

const FILTERS: { key: AdminOrderFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'completed', label: 'Concluídas' },
];

const STATUS: { key: OrderStatus; label: string; color: string; bg: string }[] = [
  { key: 'pending', label: 'PENDENTE', color: colors.secondary, bg: colors.surfaceContainerHigh },
  { key: 'in_progress', label: 'EM ANDAMENTO', color: '#7a4a00', bg: '#ffe9cc' },
  { key: 'completed', label: 'CONCLUÍDA', color: colors.success, bg: '#dcf1e8' },
];

export function AdminOrdersView() {
  const vm = useAdminOrdersViewModel();
  const navigation = useNavigation<NativeStackNavigationProp<AdminMoreStackParamList>>();

  const report = (result: Result) => {
    if (!result.ok) Alert.alert('Erro', result.error);
  };

  const askDelete = (order: AdminOrder) =>
    Alert.alert('Apagar ordem?', `${order.code} (${order.product}) de ${order.userEmail}. Não dá para desfazer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => report(await vm.remove(order)) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Ordens de todos os usuários" tone="admin" badge="ADMIN" onBack={() => navigation.goBack()} />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => vm.setFilter(f.key)} style={[styles.chip, vm.filter === f.key && styles.chipActive]}>
            <Text style={[typography.bodySm, vm.filter === f.key && { color: '#fff' }]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      {vm.loading ? (
        <LoadingState />
      ) : vm.error && vm.orders.length === 0 ? (
        <ErrorState message={vm.error} onRetry={vm.reload} />
      ) : (
        <FlatList
          data={vm.orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          onRefresh={vm.reload}
          refreshing={vm.refreshing}
          ListEmptyComponent={<EmptyState icon="assignment" text="Nenhuma ordem de serviço com esse filtro." />}
          renderItem={({ item: o }) => (
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <MaterialIcons name="agriculture" size={16} color={colors.onSurfaceVariant} />
                <Text style={[typography.monoSm, { marginLeft: 4, flex: 1 }]}>{o.code}</Text>
                <Text style={[typography.bodySm, { color: colors.outline }]}>{o.date}</Text>
              </View>
              <Text style={[typography.titleMd, { marginTop: 6 }]}>{o.product}</Text>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                {o.sector} ({o.crop})
              </Text>
              <View style={[styles.row, { marginTop: 6 }]}>
                <MaterialIcons name="person" size={14} color={colors.adminAccent} />
                <Text style={[typography.bodySm, { color: colors.adminAccent, marginLeft: 4 }]}>{o.userEmail}</Text>
              </View>
              <View style={styles.statusRow}>
                {STATUS.map((s) => {
                  const active = o.status === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      onPress={async () => !active && report(await vm.setStatus(o, s.key))}
                      style={[styles.statusPill, { backgroundColor: active ? s.bg : colors.surfaceContainerLowest, borderColor: active ? s.bg : colors.border }]}
                    >
                      <Text style={[typography.labelCaps, { color: active ? s.color : colors.outline, fontSize: 10 }]}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <ActionButton icon="delete" label="Apagar ordem" tone="danger" onPress={() => askDelete(o)} />
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginTop: 14, marginBottom: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHigh },
  chipActive: { backgroundColor: colors.adminAccent },
  list: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  statusPill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.default, borderWidth: 1 },
});
