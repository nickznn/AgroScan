import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, typography } from '../../../shared/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { AdminMoreStackParamList } from '../../../navigation/types';
import { formatDateTime } from '../../../shared/utils/format';
import { useAdminActivityViewModel } from '../viewmodel/useAdminActivityViewModel';
import { ActionInfo } from '../model/adminRules';
import { EmptyState, ErrorState, LoadingState } from './AdminParts';

const TONE_COLOR: Record<ActionInfo['tone'], string> = {
  info: colors.adminAccent,
  success: colors.success,
  warning: '#b87500',
  danger: colors.error,
};

export function AdminActivityView() {
  const vm = useAdminActivityViewModel();
  const navigation = useNavigation<NativeStackNavigationProp<AdminMoreStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Atividade do administrador" tone="admin" badge="ADMIN" onBack={() => navigation.goBack()} />
      {vm.loading ? (
        <LoadingState />
      ) : vm.error && vm.entries.length === 0 ? (
        <ErrorState message={vm.error} onRetry={vm.reload} />
      ) : (
        <FlatList
          data={vm.entries}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.list}
          onRefresh={vm.reload}
          refreshing={vm.refreshing}
          ListHeaderComponent={
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginBottom: 12 }]}>
              Registro de tudo o que os administradores fizeram (mais recente primeiro).
            </Text>
          }
          ListEmptyComponent={<EmptyState icon="history" text="Nenhuma ação registrada ainda." />}
          renderItem={({ item: e }) => {
            const color = TONE_COLOR[e.info.tone];
            return (
              <View style={styles.entry}>
                <View style={[styles.icon, { backgroundColor: color + '1f' }]}>
                  <MaterialIcons name={e.info.icon as keyof typeof MaterialIcons.glyphMap} size={20} color={color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={typography.bodySm}>
                    <Text style={typography.bodySemiBold}>{e.actorEmail}</Text> {e.info.label} <Text style={typography.bodySemiBold}>{e.target}</Text>
                  </Text>
                  {e.details ? <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>{e.details}</Text> : null}
                  <Text style={[typography.monoSm, { color: colors.outline, marginTop: 2 }]}>{formatDateTime(e.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  entry: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 12, marginBottom: 10 },
  icon: { width: 38, height: 38, borderRadius: radius.default, alignItems: 'center', justifyContent: 'center' },
});
