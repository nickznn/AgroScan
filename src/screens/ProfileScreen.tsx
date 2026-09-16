import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Image, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  const { user, history, orders, sectors, updateProfile, uploadAvatar, uploadFarmPhoto } = useApp();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [farmName, setFarmName] = useState(user?.farmName ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

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

  const pickImage = (aspect: [number, number]) =>
    new Promise<string | null>((resolve) => {
      Alert.alert('Trocar foto', 'Escolha a origem da imagem', [
        {
          text: 'Câmera',
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Permissão de câmera necessária.');
              return resolve(null);
            }
            const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect, quality: 0.7 });
            resolve(result.canceled ? null : result.assets[0].uri);
          },
        },
        {
          text: 'Galeria',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect,
              quality: 0.7,
            });
            resolve(result.canceled ? null : result.assets[0].uri);
          },
        },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });

  const handleChangeAvatar = async () => {
    const uri = await pickImage([1, 1]);
    if (!uri) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(uri);
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível enviar a foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangeCover = async () => {
    const uri = await pickImage([16, 9]);
    if (!uri) return;
    setUploadingCover(true);
    try {
      await uploadFarmPhoto(uri);
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível enviar a foto.');
    } finally {
      setUploadingCover(false);
    }
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
          <Pressable style={styles.coverEditBtn} onPress={handleChangeCover} disabled={uploadingCover}>
            {uploadingCover ? (
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
            <Pressable style={styles.avatarEditBtn} onPress={handleChangeAvatar} disabled={uploadingAvatar}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="photo-camera" size={14} color="#fff" />
              )}
            </Pressable>
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
