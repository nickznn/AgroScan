import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, radius, typography } from '../../../shared/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { AdminTabParamList } from '../../../navigation/types';
import { Severity } from '../../../shared/models';
import { useAdminDashboardViewModel } from '../viewmodel/useAdminDashboardViewModel';
import { severityText } from '../model/adminRules';
import { ErrorState, HBar, KpiTile, LoadingState, Pill } from './AdminParts';

const SEVERITY_COLOR: Record<Severity, string> = { critical: colors.error, moderate: colors.warning, low: colors.success };

export function AdminDashboardView() {
  const vm = useAdminDashboardViewModel();
  const navigation = useNavigation<BottomTabNavigationProp<AdminTabParamList>>();
  const { overview, derived } = vm;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Painel administrativo" tone="admin" badge="ADMIN" />
      {vm.loading ? (
        <LoadingState />
      ) : !overview || !derived ? (
        <ErrorState message={vm.error ?? 'Não foi possível carregar o painel.'} onRetry={vm.reload} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={vm.refreshing} onRefresh={vm.reload} tintColor={colors.adminAccent} />}
        >
          <View style={styles.hero}>
            <Text style={[typography.headlineMd, { color: colors.admin }]}>Olá, {vm.firstName}.</Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
              Visão geral de todos os produtores. Atualizado às {new Date(overview.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Puxe para atualizar.
            </Text>
          </View>

          <View style={styles.grid}>
            <KpiTile icon="groups" label="Usuários ativos" value={overview.users.active} hint={`${overview.users.total} no total`} color={colors.adminAccent} />
            <KpiTile icon="qr-code-scanner" label="Detecções" value={overview.detections.total} hint={`${derived.weekTotal} nos últimos 7 dias`} color={colors.secondary} />
            <KpiTile icon="warning" label="Focos críticos" value={overview.detections.bySeverity.critical} color={colors.error} />
            <KpiTile icon="assignment" label="Ordens abertas" value={derived.openOrders} hint={`${overview.orders.completed} concluídas`} color={colors.warning} />
          </View>
          {overview.users.suspended > 0 ? (
            <View style={styles.alert}>
              <MaterialIcons name="block" size={18} color={colors.onErrorContainer} />
              <Text style={[typography.bodySm, { color: colors.onErrorContainer, marginLeft: 8, flex: 1 }]}>
                {overview.users.suspended} conta(s) suspensa(s). Veja na aba Usuários.
              </Text>
            </View>
          ) : null}

          <Card style={styles.card}>
            <Text style={typography.titleMd}>Detecções nos últimos 7 dias</Text>
            <View style={styles.chart}>
              {derived.weekBars.map((bar, i) => (
                <View key={`${bar.label}-${i}`} style={styles.chartCol}>
                  <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>{bar.count}</Text>
                  <View style={[styles.chartBar, { height: Math.max(bar.ratio * 90, 4), backgroundColor: i === derived.weekBars.length - 1 ? colors.adminAccent : colors.adminAccent + '88' }]} />
                  <Text style={[typography.bodySm, { color: colors.outline }]}>{bar.label}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={typography.titleMd}>Gravidade das detecções</Text>
            <View style={styles.stack}>
              {derived.severity.map((s) => (s.count > 0 ? <View key={s.key} style={{ flex: s.count, backgroundColor: SEVERITY_COLOR[s.key] }} /> : null))}
              {overview.detections.total === 0 ? <View style={{ flex: 1, backgroundColor: colors.surfaceContainerHigh }} /> : null}
            </View>
            <View style={styles.legend}>
              {derived.severity.map((s) => (
                <View key={s.key} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: SEVERITY_COLOR[s.key] }]} />
                  <Text style={typography.bodySm}>
                    {severityText(s.key)}: {s.count} ({s.percent}%)
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={typography.titleMd}>Pragas mais frequentes</Text>
            {derived.ranking.map((pest, i) => (
              <View key={pest.id} style={{ marginTop: 12 }}>
                <View style={styles.rankRow}>
                  <Text style={[typography.bodySemiBold, { flex: 1 }]} numberOfLines={1}>
                    {i + 1}. {pest.name}
                  </Text>
                  <Pill label={severityText(pest.severity).toUpperCase()} color={SEVERITY_COLOR[pest.severity]} bg={SEVERITY_COLOR[pest.severity] + '1f'} />
                  <Text style={[typography.monoSm, { marginLeft: 10, width: 28, textAlign: 'right' }]}>{pest.count}</Text>
                </View>
                <HBar ratio={pest.ratio} color={SEVERITY_COLOR[pest.severity]} />
              </View>
            ))}
          </Card>

          <Card style={styles.card}>
            <Text style={typography.titleMd}>Ordens de serviço (todos os usuários)</Text>
            <View style={styles.orderRow}>
              <View style={styles.orderBox}>
                <Text style={[typography.headlineMd, { color: colors.secondary }]}>{overview.orders.pending}</Text>
                <Text style={typography.bodySm}>Pendentes</Text>
              </View>
              <View style={styles.orderBox}>
                <Text style={[typography.headlineMd, { color: colors.warning }]}>{overview.orders.in_progress}</Text>
                <Text style={typography.bodySm}>Em andamento</Text>
              </View>
              <View style={styles.orderBox}>
                <Text style={[typography.headlineMd, { color: colors.success }]}>{overview.orders.completed}</Text>
                <Text style={typography.bodySm}>Concluídas</Text>
              </View>
            </View>
          </Card>

          <Button label="GERENCIAR USUÁRIOS" onPress={() => navigation.navigate('AdminUsers')} style={{ marginTop: 4, backgroundColor: colors.admin }} />
          <Button label="CATÁLOGO DE PRAGAS" variant="outline" onPress={() => navigation.navigate('AdminPests')} style={{ marginTop: 10 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: colors.adminSoft, borderRadius: radius.lg, padding: 16, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  alert: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorContainer, borderRadius: radius.default, padding: 12, marginTop: 12 },
  card: { marginTop: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, marginTop: 14 },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  chartBar: { width: 22, borderRadius: 4 },
  stack: { flexDirection: 'row', height: 18, borderRadius: 9, overflow: 'hidden', marginTop: 14 },
  legend: { marginTop: 12, gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  orderRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  orderBox: { flex: 1, backgroundColor: colors.surfaceContainerLow, borderRadius: radius.default, paddingVertical: 12, alignItems: 'center' },
});
