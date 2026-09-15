import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { MoreStackParamList } from '../navigation/types';
import { OrderStatus } from '../types';

const FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'in_progress', label: 'Em Andamento' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'completed', label: 'Concluídas' },
];

const STATUS_OPTIONS: { key: OrderStatus; label: string; color: string; bg: string }[] = [
  { key: 'pending', label: 'PENDENTE', color: colors.secondary, bg: colors.surfaceContainerHigh },
  { key: 'in_progress', label: 'EM ANDAMENTO', color: '#7a4a00', bg: '#ffe9cc' },
  { key: 'completed', label: 'CONCLUÍDA', color: colors.success, bg: '#dcf1e8' },
];

export function OrdersScreen() {
  const { orders, sectors, updateOrderStatus, addOrder } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [product, setProduct] = useState('');
  const [sectorIndex, setSectorIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const handleSetStatus = async (id: string, current: OrderStatus, next: OrderStatus) => {
    if (current === next) return;
    const apply = async () => {
      try {
        await updateOrderStatus(id, next);
      } catch (err) {
        Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível atualizar a ordem.');
      }
    };
    if (next === 'completed') {
      Alert.alert('Concluir ordem?', 'Confirma que esta aplicação foi finalizada no campo?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Concluir', onPress: apply },
      ]);
      return;
    }
    await apply();
  };

  const handleCreateOrder = async () => {
    if (!product.trim()) {
      Alert.alert('Informe o defensivo/produto da ordem.');
      return;
    }
    if (sectors.length === 0) {
      Alert.alert('Nenhum setor disponível ainda.');
      return;
    }
    const sector = sectors[sectorIndex];
    setSaving(true);
    try {
      await addOrder({ product: product.trim(), sector: sector.name, crop: sector.crop });
      setProduct('');
      setSectorIndex(0);
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível criar a ordem.');
    } finally {
      setSaving(false);
    }
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
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <View style={styles.rowBetween}>
              <View style={styles.rowStart}>
                <MaterialIcons name="agriculture" size={16} color={colors.onSurfaceVariant} />
                <Text style={[typography.monoSm, { marginLeft: 4 }]}>{item.code}</Text>
              </View>
            </View>
            <Text style={[typography.titleMd, { marginTop: 8 }]}>{item.product}</Text>
            <View style={styles.rowStart}>
              <MaterialIcons name="location-on" size={16} color={colors.outline} />
              <Text style={[typography.bodySm, { marginLeft: 2 }]}>
                {item.sector} ({item.crop})
              </Text>
            </View>
            <Text style={[typography.bodySm, { marginTop: 4 }]}>{item.date}</Text>

            <View style={[styles.statusRow, styles.divider]}>
              {STATUS_OPTIONS.map((opt) => {
                const active = item.status === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => handleSetStatus(item.id, item.status, opt.key)}
                    style={[styles.statusPill, { backgroundColor: active ? opt.bg : colors.surfaceContainerLowest, borderColor: active ? opt.bg : colors.border }]}
                  >
                    <Text style={[typography.labelCaps, { color: active ? opt.color : colors.outline, fontSize: 10 }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        )}
      />

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={typography.headlineMd}>Nova Ordem de Serviço</Text>

            <Text style={styles.label}>Produto / Defensivo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Fungicida X-700"
              placeholderTextColor={colors.outline}
              value={product}
              onChangeText={setProduct}
            />

            <Text style={styles.label}>Setor</Text>
            <View style={styles.sectorRow}>
              {sectors.map((s, index) => (
                <Pressable
                  key={s.id}
                  onPress={() => setSectorIndex(index)}
                  style={[styles.sectorChip, sectorIndex === index && styles.sectorChipActive]}
                >
                  <Text style={[typography.bodySm, sectorIndex === index && { color: colors.onPrimary }]}>{s.name}</Text>
                </Pressable>
              ))}
            </View>

            <Button label="CRIAR ORDEM" onPress={handleCreateOrder} loading={saving} style={{ marginTop: 20 }} />
            <Button label="CANCELAR" variant="outline" onPress={() => setModalVisible(false)} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingBottom: 100 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHigh },
  filterChipActive: { backgroundColor: colors.primary },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowStart: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusPill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.default, borderWidth: 1 },
  divider: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 24 },
  label: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: radius.default,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.onSurface,
    minHeight: 48,
  },
  sectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectorChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHigh },
  sectorChipActive: { backgroundColor: colors.primary },
});
