import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { formatDateTime } from '../utils/format';

const severityColor = { critical: colors.error, moderate: colors.warning, low: colors.success } as const;

export function ReportDetailScreen() {
  const { history, orders } = useApp();
  const route = useRoute<RouteProp<RootStackParamList, 'ReportDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const item = history.find((h) => h.id === route.params.id);

  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Relatório" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={typography.bodyMd}>Registro não encontrado.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="AgroScan AI" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.photoWrap, { borderColor: colors.secondary }]}>
          {item.photoUri ? (
            <Image source={{ uri: item.photoUri }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <MaterialIcons name="image" size={40} color={colors.outline} />
            </View>
          )}
          <View style={styles.confidencePill}>
            <View style={[styles.dot, { backgroundColor: severityColor[item.pest.severity] }]} />
            <Text style={typography.monoSm}>AI CONFIDENCE: {item.confidence.toFixed(1)}%</Text>
          </View>
          <View style={styles.detectedPill}>
            <Text style={[typography.labelCaps, { color: '#fff' }]}>DETECTADO</Text>
          </View>
        </View>

        <Card style={{ marginTop: 20 }}>
          <View style={[styles.row, styles.between]}>
            <View style={styles.severityPill}>
              <MaterialIcons name="warning" size={16} color={severityColor[item.pest.severity]} />
              <Text style={[typography.labelCaps, { color: severityColor[item.pest.severity], marginLeft: 6 }]}>
                SEVERIDADE: {item.pest.severity === 'critical' ? 'ALTA' : item.pest.severity === 'moderate' ? 'MÉDIA' : 'BAIXA'}
              </Text>
            </View>
            <Text style={typography.bodySm}>{formatDateTime(item.timestamp)}</Text>
          </View>

          <Text style={[typography.headlineMd, { marginTop: 12 }]}>{item.pest.scientificName}</Text>
          <Text style={[typography.bodySm, { color: colors.secondary, marginBottom: 8 }]}>{item.pest.name}</Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>{item.pest.description}</Text>

          <View style={[styles.row, { marginTop: 16, gap: 12 }]}>
            <View style={styles.statBox}>
              <Text style={typography.labelCaps}>ÁREA AFETADA</Text>
              <Text style={[typography.headlineMd, { marginTop: 4 }]}>{item.affectedArea.toFixed(1)}%</Text>
              <Text style={typography.bodySm}>do talhão</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={typography.labelCaps}>ESTÁGIO</Text>
              <Text style={[typography.headlineMd, { marginTop: 4 }]}>{item.stage.split(' ')[0]}</Text>
              <Text style={typography.bodySm}>{item.stage.split(' ').slice(1).join(' ')}</Text>
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: 16, backgroundColor: colors.surfaceContainerLow }}>
          <Text style={[typography.bodySemiBold, { color: colors.primary }]}>Ação Recomendada pelo Sistema</Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, marginTop: 8, marginBottom: 16 }]}>
            {item.pest.recommendedAction}
          </Text>
          <Button
            label="INICIAR APLICAÇÃO LOCALIZADA"
            onPress={() => navigation.navigate('Main', { screen: 'More', params: { screen: 'Orders' } } as never)}
          />
          <Button
            label="GERAR ORDEM DE SERVIÇO"
            variant="outline"
            onPress={() => navigation.navigate('Main', { screen: 'More', params: { screen: 'Orders' } } as never)}
            style={{ marginTop: 12 }}
          />
        </Card>

        <Text style={[typography.bodySm, { color: colors.outline, textAlign: 'center', marginTop: 16 }]}>
          {orders.length} ordens de serviço ativas na fazenda · Setor: {item.sector}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { justifyContent: 'space-between' },
  photoWrap: { borderWidth: 2, borderRadius: radius.md, overflow: 'hidden', height: 220 },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerHigh },
  confidencePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.default,
  },
  detectedPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.default,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  severityPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorContainer, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
  statBox: { flex: 1, backgroundColor: colors.surfaceContainerLow, borderRadius: radius.default, padding: 12 },
});
