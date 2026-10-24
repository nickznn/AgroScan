import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MoreStackParamList } from '../navigation/types';
import { formatDateTime } from '../utils/format';
import { useSettingsViewModel } from '../viewmodels/useSettingsViewModel';

export function SettingsView() {
  const vm = useSettingsViewModel();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  const handleSaveApiUrl = async () => {
    const result = await vm.saveApiUrl();
    if (result.ok) Alert.alert('Conectado!', 'Endereço do servidor salvo com sucesso.');
    else Alert.alert('Não foi possível conectar', `${result.error} O endereço não foi salvo.`.trim());
  };

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
                <View style={[styles.dot, { backgroundColor: vm.isSyncing ? colors.warning : colors.success }]} />
                <Text style={[typography.bodySemiBold, { color: vm.isSyncing ? colors.warning : colors.success }]}>
                  {vm.isSyncing ? 'SYNCING...' : 'SYNCED'}
                </Text>
              </View>
              <Text style={typography.bodySm}>Última sincronização: {formatDateTime(vm.lastSync)}</Text>
            </View>
          </View>
          {vm.pendingCount > 0 && (
            <View style={styles.pendingBox}>
              <Text style={typography.bodySm}>
                {vm.pendingCount} relatório(s) de campo e atualizações do modelo de IA na fila para a próxima sincronização.
              </Text>
            </View>
          )}
          <Button
            label="SINCRONIZAR AGORA"
            icon={<MaterialIcons name="sync" size={18} color={colors.onPrimary} />}
            onPress={vm.syncNow}
            loading={vm.isSyncing}
            style={{ marginTop: 16 }}
          />
        </Card>

        <Card style={{ marginTop: 20 }}>
          <View style={styles.rowStart}>
            <MaterialIcons name="dns" size={22} color={colors.primary} />
            <Text style={[typography.titleMd, { marginLeft: 8 }]}>Servidor</Text>
          </View>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4, marginBottom: 12 }]}>
            Endereço da API do AgroScan. Mude aqui se trocar de rede Wi-Fi (ex: notebook na faculdade).
          </Text>
          <TextInput
            style={styles.input}
            placeholder="http://192.168.0.10:4000"
            placeholderTextColor={colors.outline}
            autoCapitalize="none"
            autoCorrect={false}
            value={vm.apiUrl}
            onChangeText={vm.setApiUrl}
          />
          <Button
            label="TESTAR E SALVAR"
            variant="outline"
            onPress={handleSaveApiUrl}
            loading={vm.testing}
            style={{ marginTop: 12 }}
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
          {vm.offlineAreas.map((area) => (
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

        <Pressable onPress={vm.logout} style={styles.logoutBtn}>
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
  input: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: radius.default,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.onSurface,
    minHeight: 48,
  },
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
