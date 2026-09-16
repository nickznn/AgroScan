import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { MoreStackParamList } from '../navigation/types';
import { formatDateTime } from '../utils/format';
import { OrderStatus } from '../types';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { user, history, orders, sectors, updateProfile } = useApp();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [farmName, setFarmName] = useState(user?.farmName ?? '');
  const [saving, setSaving] = useState(false);

  const orderCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = { pending: 0, in_progress: 0, completed: 0 };
    orders.forEach((o) => counts[o.status]++);
    return counts;
  }, [orders]);

  const avgHealth = sectors.length
    ? Math.round(sectors.reduce((sum, s) => sum + s.healthScore, 0) / sectors.length)
    : 0;

  const startEditing = () => {
    setName(user?.name ?? '');
    setFarmName(user?.farmName ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !farmName.trim()) {
      Alert.alert('Preencha nome e fazenda.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), farmName: farmName.trim() });
      setEditing(false);
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Perfil" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={40} color={colors.onPrimary} />
          </View>
        </View>

        {editing ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Nome da fazenda</Text>
            <TextInput style={styles.input} value={farmName} onChangeText={setFarmName} />
            <Button label="SALVAR" onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
            <Button label="CANCELAR" variant="outline" onPress={() => setEditing(false)} style={{ marginTop: 12 }} />
          </Card>
        ) : (
          <>
            <Text style={[typography.headlineMd, { textAlign: 'center', marginTop: 12 }]}>{user?.name}</Text>
            <Text style={[typography.bodySm, { textAlign: 'center', color: colors.onSurfaceVariant }]}>{user?.email}</Text>

            <Card style={{ marginTop: 20 }}>
              <InfoRow icon="agriculture" label="Fazenda" value={user?.farmName ?? '—'} />
              <InfoRow
                icon="event"
                label="Membro desde"
                value={user?.createdAt ? formatDateTime(user.createdAt) : '—'}
              />
              <InfoRow icon="badge" label="ID da conta" value={`#${user?.id ?? '—'}`} last />
            </Card>

            <Button label="EDITAR PERFIL" variant="outline" onPress={startEditing} style={{ marginTop: 16 }} />
          </>
        )}

        <Text style={[typography.headlineMd, { marginTop: 28, marginBottom: 12 }]}>Resumo da Operação</Text>

        <View style={styles.statsGrid}>
          <StatBox icon="qr-code-scanner" value={history.length} label="Análises feitas" color={colors.secondary} />
          <StatBox icon="landscape" value={sectors.length} label="Setores monitorados" color={colors.primary} />
          <StatBox icon="check-circle" value={`${avgHealth}%`} label="Saúde média" color={colors.success} />
          <StatBox icon="assignment" value={orders.length} label="Ordens totais" color={colors.warning} />
        </View>

        <Card style={{ marginTop: 16 }}>
          <Text style={typography.bodySemiBold}>Ordens de Serviço</Text>
          <View style={[styles.row, { marginTop: 12 }]}>
            <OrderStatusPill label="Pendentes" count={orderCounts.pending} color={colors.secondary} />
            <OrderStatusPill label="Em Andamento" count={orderCounts.in_progress} color={colors.warning} />
            <OrderStatusPill label="Concluídas" count={orderCounts.completed} color={colors.success} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <MaterialIcons name={icon} size={20} color={colors.onSurfaceVariant} />
      <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginLeft: 10, flex: 1 }]}>{label}</Text>
      <Text style={typography.bodySemiBold}>{value}</Text>
    </View>
  );
}

function StatBox({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIconBox, { backgroundColor: color + '1a' }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[typography.headlineMd, { marginTop: 8 }]}>{value}</Text>
      <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

function OrderStatusPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={styles.orderPill}>
      <Text style={[typography.headlineMd, { color }]}>{count}</Text>
      <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 12 },
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
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', gap: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  statIconBox: { width: 36, height: 36, borderRadius: radius.default, alignItems: 'center', justifyContent: 'center' },
  orderPill: { flex: 1, backgroundColor: colors.surfaceContainerLow, borderRadius: radius.default, paddingVertical: 12, alignItems: 'center' },
});
