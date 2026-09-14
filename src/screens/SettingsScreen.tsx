import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
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

const OFFLINE_AREAS = [
  { id: 1, label: 'Setor 7 - Milho', size: '124 MB' },
  { id: 2, label: 'Setor 8 - Soja', size: '89 MB' },
];

export function SettingsScreen() {
  const { lastSync, isSyncing, syncNow, logout, history } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const pendingCount = history.filter((h) => h.offline).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Configurações" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.rowStart}>
            <MaterialIcons name="cloud-sync" size={22} color={colors.primary} />
            <Text style={[typography.titleMd, { marginLeft: 8 }]}>Cloud Sync</Text>
          </View>
          <View style={[styles.rowStart, { marginTop: 12 }]}>
            <View style={styles.syncIconBox}>
              <MaterialIcons name="storage" size={20} color={colors.secondary} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <View style={styles.rowStart}>
                <View style={[styles.dot, { backgroundColor: isSyncing ? colors.warning : colors.success }]} />
                <Text style={[typography.bodySemiBold, { color: isSyncing ? colors.warning : colors.success }]}>
                  {isSyncing ? 'SYNCING...' : 'SYNCED'}
                </Text>
              </View>
              <Text style={typography.bodySm}>Última sincronização: {formatDateTime(lastSync)}</Text>
            </View>
          </View>
          {pendingCount > 0 && (
            <View style={styles.pendingBox}>
              <Text style={typography.bodySm}>
                {pendingCount} relatório(s) de campo e atualizações do modelo de IA na fila para a próxima sincronização.
              </Text>
            </View>
          )}
          <Button
            label="SINCRONIZAR AGORA"
            icon={<MaterialIcons name="sync" size={18} color={colors.onPrimary} />}
            onPress={syncNow}
            loading={isSyncing}
            style={{ marginTop: 16 }}
          />
        </Card>

        <Card style={{ marginTop: 20 }}>
          <View style={styles.rowStart}>
            <MaterialIcons name="map" size={22} color={colors.primary} />
            <Text style={[typography.titleMd, { marginLeft: 8 }]}>Mapas Offline</Text>
          </View>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4, marginBottom: 12 }]}>
            Áreas baixadas para operação em campo sem internet.
          </Text>
          {OFFLINE_AREAS.map((area) => (
            <View key={area.id} style={styles.offlineRow}>
              <View style={styles.rowStart}>
                <MaterialIcons name="check" size={18} color={colors.success} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={typography.bodySemiBold}>{area.label}</Text>
                  <Text style={typography.bodySm}>{area.size}</Text>
                </View>
              </View>
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            </View>
          ))}
          <Button label="BAIXAR NOVA ÁREA" variant="outline" style={{ marginTop: 8 }} onPress={() => {}} />
        </Card>

        <Pressable onPress={logout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={18} color={colors.error} />
          <Text style={[typography.bodySemiBold, { color: colors.error, marginLeft: 8 }]}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  rowStart: { flexDirection: 'row', alignItems: 'center' },
  syncIconBox: { width: 40, height: 40, borderRadius: radius.default, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pendingBox: { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.default, padding: 12, marginTop: 12 },
  offlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.default,
    padding: 12,
    marginBottom: 10,
  },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28, padding: 12 },
});
