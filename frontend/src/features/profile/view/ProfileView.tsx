import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Image, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../../../shared/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { MoreStackParamList } from '../../../navigation/types';
import { formatDateTime } from '../../../shared/utils/format';
import { PhotoSource, Result } from '../../../shared/models';
import { useProfileViewModel } from '../viewmodel/useProfileViewModel';

export function ProfileView() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const vm = useProfileViewModel();
  const { user, stats } = vm;

  // O Alert com a escolha da origem é interface; quem tira/envia a foto é o ViewModel.
  const chooseSource = (apply: (source: PhotoSource) => Promise<Result | null>) => {
    const run = async (source: PhotoSource) => {
      const result = await apply(source);
      if (result && !result.ok) Alert.alert('Erro', result.error);
    };
    Alert.alert('Trocar foto', 'Escolha a origem da imagem', [
      { text: 'Câmera', onPress: () => run('camera') },
      { text: 'Galeria', onPress: () => run('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    const result = await vm.save();
    if (!result.ok) Alert.alert('Erro', result.error);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Perfil" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.cover}>
          {user?.farmPhotoUrl ? (
            <Image source={{ uri: user.farmPhotoUrl }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <MaterialIcons name="landscape" size={36} color={colors.secondary} />
            </View>
          )}
          <Pressable style={styles.coverEditBtn} onPress={() => chooseSource(vm.changeCover)} disabled={vm.uploadingCover}>
            {vm.uploadingCover ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="photo-camera" size={16} color="#fff" />
            )}
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <MaterialIcons name="person" size={40} color={colors.onPrimary} />
              )}
            </View>
            <Pressable style={styles.avatarEditBtn} onPress={() => chooseSource(vm.changeAvatar)} disabled={vm.uploadingAvatar}>
              {vm.uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="photo-camera" size={14} color="#fff" />
              )}
            </Pressable>
          </View>

          {vm.editing ? (
            <Card style={{ marginTop: 16 }}>
              <Text style={styles.label}>Nome</Text>
              <TextInput style={styles.input} value={vm.name} onChangeText={vm.setName} />
              <Text style={styles.label}>Nome da fazenda</Text>
              <TextInput style={styles.input} value={vm.farmName} onChangeText={vm.setFarmName} />
              <Button label="SALVAR" onPress={handleSave} loading={vm.saving} style={{ marginTop: 16 }} />
              <Button label="CANCELAR" variant="outline" onPress={vm.cancelEditing} style={{ marginTop: 12 }} />
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

              <Button label="EDITAR PERFIL" variant="outline" onPress={vm.startEditing} style={{ marginTop: 16 }} />
            </>
          )}

          <Text style={[typography.headlineMd, { marginTop: 28, marginBottom: 12 }]}>Resumo da Operação</Text>

          <View style={styles.statsGrid}>
            <StatBox icon="qr-code-scanner" value={stats.analyses} label="Análises feitas" color={colors.secondary} />
            <StatBox icon="landscape" value={stats.sectors} label="Setores monitorados" color={colors.primary} />
            <StatBox icon="check-circle" value={`${stats.avgHealth}%`} label="Saúde média" color={colors.success} />
            <StatBox icon="assignment" value={stats.orders} label="Ordens totais" color={colors.warning} />
          </View>

          <Card style={{ marginTop: 16 }}>
            <Text style={typography.bodySemiBold}>Ordens de Serviço</Text>
            <View style={[styles.row, { marginTop: 12 }]}>
              <OrderStatusPill label="Pendentes" count={stats.orderCounts.pending} color={colors.secondary} />
              <OrderStatusPill label="Em Andamento" count={stats.orderCounts.in_progress} color={colors.warning} />
              <OrderStatusPill label="Concluídas" count={stats.orderCounts.completed} color={colors.success} />
            </View>
          </Card>
        </View>
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
  content: { paddingHorizontal: 20 },
  cover: { height: 150, backgroundColor: colors.surfaceContainerHigh },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverEditBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: { alignItems: 'center', marginTop: -44 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarEditBtn: {
    position: 'absolute',
    right: '32%',
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
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
