import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SeverityBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { formatRelativeTime } from '../utils/format';

export function DashboardScreen() {
  const { user, history, sectors } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const firstName = user?.name?.split(/[.\s]/)[0] || 'Produtor';
  const recent = history.slice(0, 3);

  const avgHealth = sectors.length
    ? Math.round(sectors.reduce((sum, s) => sum + s.healthScore, 0) / sectors.length)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="AgroScan AI" showSync offline={history.some((h) => h.offline)} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.headlineLg}>Bom dia, {firstName}.</Text>
        <Text style={[typography.bodyMd, styles.subtitle]}>
          Pronto para a inspeção de hoje? O sistema está sincronizando dados em segundo plano.
        </Text>

        <Card style={styles.healthCard}>
          <Text style={[typography.labelCaps, styles.centerText]}>SAÚDE GERAL DA LAVOURA</Text>
          <Text style={[typography.displayLg, styles.centerText, { color: colors.primary, marginVertical: 4 }]}>{avgHealth}%</Text>
          <View style={[styles.row, styles.center]}>
            <MaterialIcons name="check-circle" size={16} color={colors.success} />
            <Text style={[typography.bodySemiBold, { color: colors.success, marginLeft: 6 }]}>Saudável</Text>
          </View>
        </Card>

        <Card style={[styles.scanCard]} accentColor={colors.secondary}>
          <Text style={typography.titleMd}>Iniciar Nova Verificação</Text>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4, marginBottom: 16 }]}>
            Use a câmera para identificar pragas e doenças instantaneamente com IA.
          </Text>
          <Button
            label="ABRIR SCANNER"
            icon={<MaterialIcons name="qr-code-scanner" size={20} color={colors.onPrimary} />}
            onPress={() => navigation.navigate('Main', { screen: 'Scanner' } as never)}
          />
        </Card>

        <Pressable onPress={() => navigation.navigate('Main', { screen: 'Maps' } as never)}>
          <Card style={{ marginTop: 20 }}>
            <View style={[styles.row, styles.between]}>
              <Text style={typography.titleMd}>Mapa de Risco Atual</Text>
              <MaterialIcons name="map" size={22} color={colors.onSurface} />
            </View>
            <View style={styles.mapPreview}>
              <View style={styles.mapPreviewLabel}>
                <Text style={typography.monoSm}>SETOR SUL · ALERTA MODERADO</Text>
              </View>
            </View>
          </Card>
        </Pressable>

        <View style={[styles.row, styles.between, { marginTop: 24, marginBottom: 8 }]}>
          <Text style={typography.headlineMd}>Últimos Focos Detectados</Text>
          <Pressable onPress={() => navigation.navigate('Main', { screen: 'Reports' } as never)}>
            <Text style={[typography.labelCaps, { color: colors.secondary }]}>VER TODOS →</Text>
          </Pressable>
        </View>

        {recent.map((item) => (
          <Pressable key={item.id} onPress={() => navigation.navigate('ReportDetail', { id: item.id })}>
            <Card
              accentColor={
                item.pest.severity === 'critical' ? colors.error : item.pest.severity === 'moderate' ? colors.warning : colors.success
              }
              style={{ marginBottom: 12 }}
            >
              <View style={[styles.row, styles.between]}>
                <SeverityBadge severity={item.pest.severity} />
                <Text style={typography.bodySm}>{formatRelativeTime(item.timestamp)}</Text>
              </View>
              <Text style={[typography.titleMd, { marginTop: 8 }]}>{item.pest.name}</Text>
              <View style={[styles.row, { marginTop: 6 }]}>
                <Text style={styles.chip}>{item.pest.crop}</Text>
                <Text style={[styles.chip, { marginLeft: 8 }]}>{item.sector}</Text>
              </View>
              <View style={[styles.row, styles.between, styles.confidenceBox]}>
                <Text style={typography.bodySm}>Confiança da IA:</Text>
                <Text style={[typography.monoSm, { color: colors.secondary }]}>{item.confidence.toFixed(0)}%</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  subtitle: { color: colors.onSurfaceVariant, marginTop: 8, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { justifyContent: 'space-between' },
  center: { justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  healthCard: { alignItems: 'center', backgroundColor: '#eaf3ee', borderColor: colors.inversePrimary, paddingVertical: 24 },
  scanCard: { backgroundColor: colors.surfaceContainer, marginTop: 16 },
  mapPreview: {
    height: 110,
    borderRadius: radius.md,
    backgroundColor: '#cfe0d8',
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapPreviewLabel: { backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.default },
  chip: {
    ...typography.bodySm,
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.default,
  },
  confidenceBox: {
    marginTop: 12,
    backgroundColor: colors.surfaceContainerLow,
    padding: 10,
    borderRadius: radius.default,
  },
});
