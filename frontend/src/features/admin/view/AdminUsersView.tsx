import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../../shared/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { Card } from '../../../shared/components/Card';
import { AdminUser, UserFilter } from '../../../shared/models/admin';
import { Result } from '../../../shared/models';
import { formatDateTime } from '../../../shared/utils/format';
import { useAdminUsersViewModel } from '../viewmodel/useAdminUsersViewModel';
import { lastAccessLabel, roleLabel } from '../model/adminRules';
import { ActionButton, EmptyState, ErrorState, LoadingState, Pill } from './AdminParts';

const FILTERS: { key: UserFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'admin', label: 'Administradores' },
  { key: 'suspended', label: 'Suspensos' },
];

export function AdminUsersView() {
  const vm = useAdminUsersViewModel();

  const report = (result: Result) => {
    if (!result.ok) Alert.alert('Erro', result.error);
  };

  const confirm = (title: string, message: string, confirmLabel: string, onConfirm: () => void, destructive = false) =>
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);

  const askRole = (u: AdminUser) =>
    confirm(
      u.role === 'admin' ? 'Rebaixar para usuário?' : 'Promover a administrador?',
      u.role === 'admin' ? `${u.email} perde o acesso à área administrativa.` : `${u.email} passa a ver os dados de todos os usuários e a gerenciar o sistema.`,
      u.role === 'admin' ? 'Rebaixar' : 'Promover',
      async () => report(await vm.toggleRole(u))
    );

  const askActive = (u: AdminUser) =>
    confirm(
      u.active ? 'Suspender conta?' : 'Reativar conta?',
      u.active ? `${u.email} não conseguirá mais entrar nem usar o app até ser reativado.` : `${u.email} volta a poder entrar no app.`,
      u.active ? 'Suspender' : 'Reativar',
      async () => report(await vm.toggleActive(u)),
      u.active
    );

  const askDelete = (u: AdminUser) =>
    confirm(
      'Excluir usuário?',
      `Isso apaga ${u.email} e também ${u.detectionCount} detecção(ões) e ${u.orderCount} ordem(ns) dele. Não dá para desfazer.`,
      'Excluir',
      async () => report(await vm.remove(u)),
      true
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Usuários" tone="admin" badge="ADMIN" />
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou e-mail..."
          placeholderTextColor={colors.outline}
          value={vm.search}
          onChangeText={vm.setSearch}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => vm.setFilter(f.key)} style={[styles.chip, vm.filter === f.key && styles.chipActive]}>
            <Text style={[typography.bodySm, vm.filter === f.key && { color: '#fff' }]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {vm.loading ? (
        <LoadingState />
      ) : vm.error && vm.users.length === 0 ? (
        <ErrorState message={vm.error} onRetry={vm.reload} />
      ) : (
        <FlatList
          data={vm.users}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={styles.list}
          onRefresh={vm.reload}
          refreshing={vm.refreshing}
          ListHeaderComponent={<Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginBottom: 10 }]}>{vm.users.length} usuário(s)</Text>}
          ListEmptyComponent={<EmptyState icon="person-search" text="Nenhum usuário encontrado com esses filtros." />}
          renderItem={({ item: u }) => {
            const mine = !vm.canAct(u);
            const busy = vm.busyId === u.id;
            return (
              <Card accentColor={u.active ? (u.role === 'admin' ? colors.adminAccent : colors.success) : colors.error} style={{ marginBottom: 12, opacity: busy ? 0.6 : 1 }}>
                <View style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: u.role === 'admin' ? colors.adminAccent : colors.primary }]}>
                    <Text style={[typography.titleMd, { color: '#fff' }]}>{(u.name || u.email).charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={typography.bodySemiBold} numberOfLines={1}>
                      {u.name}
                      {mine ? '  (você)' : ''}
                    </Text>
                    <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                      {u.email}
                    </Text>
                  </View>
                </View>
                <View style={[styles.row, { marginTop: 10, gap: 8 }]}>
                  <Pill label={roleLabel(u.role).toUpperCase()} color={u.role === 'admin' ? colors.adminAccent : colors.onSurfaceVariant} bg={u.role === 'admin' ? colors.adminSoft : colors.surfaceContainerHigh} />
                  <Pill label={u.active ? 'ATIVO' : 'SUSPENSO'} color={u.active ? colors.success : colors.onErrorContainer} bg={u.active ? '#dcf1e8' : colors.errorContainer} />
                </View>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 8 }]}>
                  {u.farmName} · {u.detectionCount} detecções · {u.orderCount} ordens
                </Text>
                <Text style={[typography.monoSm, { color: colors.outline, marginTop: 2 }]}>
                  Cadastro: {formatDateTime(u.createdAt)} · Último acesso: {lastAccessLabel(u.lastLoginAt)}
                </Text>
                {mine ? (
                  <Text style={[typography.bodySm, { color: colors.outline, marginTop: 8 }]}>Você não pode alterar a sua própria conta.</Text>
                ) : (
                  <View style={styles.actions}>
                    <ActionButton icon={u.role === 'admin' ? 'person-remove' : 'admin-panel-settings'} label={u.role === 'admin' ? 'Rebaixar' : 'Promover'} onPress={() => askRole(u)} disabled={busy} />
                    <ActionButton icon={u.active ? 'block' : 'check-circle'} label={u.active ? 'Suspender' : 'Reativar'} onPress={() => askActive(u)} disabled={busy} />
                    <ActionButton icon="delete" label="Excluir" tone="danger" onPress={() => askDelete(u)} disabled={busy} />
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.default,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: colors.onSurface },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHigh },
  chipActive: { backgroundColor: colors.adminAccent },
  list: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
});
