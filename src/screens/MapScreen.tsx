import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { DetectionResult, Crop, Severity } from '../types';

const CROPS: (Crop | 'Todas')[] = ['Todas', 'Soja', 'Milho', 'Algodão', 'Café'];

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: colors.error,
  moderate: colors.warning,
  low: colors.success,
};

const MAP_SIZE = 320;

// Posição estável (não muda a cada render) derivada do id da detecção.
// Ids parecidos (ex: "seed-1" vs "seed-2") precisam cair em pontos bem diferentes do mapa,
// então o hash passa por um finalizador de avalanche (mistura bits) antes de gerar a posição.
function hashToUnit(id: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 0x01000193) | 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) | 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) | 0;
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

function positionFor(item: DetectionResult) {
  const x = 0.12 + hashToUnit(item.id, 17) * 0.76;
  const y = 0.12 + hashToUnit(item.id, 91) * 0.76;
  return { x, y };
}

export function MapScreen() {
  const { history } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cropFilter, setCropFilter] = useState<Crop | 'Todas'>('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const points = useMemo(() => {
    return history
      .filter((item) => cropFilter === 'Todas' || item.pest.crop === cropFilter)
      .map((item) => ({ item, ...positionFor(item) }));
  }, [history, cropFilter]);

  const selected = points.find((p) => p.item.id === selectedId)?.item;

  const counts = useMemo(() => {
    return points.reduce(
      (acc, p) => {
        acc[p.item.pest.severity] += 1;
        return acc;
      },
      { critical: 0, moderate: 0, low: 0 } as Record<Severity, number>
    );
  }, [points]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="AgroScan AI" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {CROPS.map((crop) => {
          const active = crop === cropFilter;
          return (
            <Pressable key={crop} onPress={() => setCropFilter(crop)} style={[styles.cropChip, active && styles.cropChipActive]}>
              <Text style={[typography.bodySemiBold, active ? { color: '#fff' } : { color: colors.onSurface }]}>
                {crop === 'Todas' ? 'Todas as Culturas' : crop}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.mapArea}>
        <LinearGradient colors={['#dfe9ff', '#eaf3ee']} style={StyleSheet.absoluteFill} />
        <Svg width={MAP_SIZE} height={MAP_SIZE} style={StyleSheet.absoluteFill}>
          <Defs>
            {points.map((p) => (
              <RadialGradient key={p.item.id} id={`grad-${p.item.id}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={SEVERITY_COLOR[p.item.pest.severity]} stopOpacity={0.55} />
                <Stop offset="100%" stopColor={SEVERITY_COLOR[p.item.pest.severity]} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          {points.map((p) => {
            const blobRadius = 30 + p.item.affectedArea * 2.2;
            return (
              <Circle
                key={p.item.id}
                cx={p.x * MAP_SIZE}
                cy={p.y * MAP_SIZE}
                r={blobRadius}
                fill={`url(#grad-${p.item.id})`}
              />
            );
          })}
        </Svg>

        {points.map((p) => (
          <Pressable
            key={p.item.id}
            onPress={() => setSelectedId(p.item.id)}
            style={[styles.pinWrap, { left: p.x * MAP_SIZE - 10, top: p.y * MAP_SIZE - 10 }]}
          >
            <View style={[styles.pin, { backgroundColor: SEVERITY_COLOR[p.item.pest.severity] }]} />
          </Pressable>
        ))}

        {points.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              Nenhum foco registrado para esse filtro.
            </Text>
          </View>
        )}
      </View>

      {selected && (
        <Pressable style={styles.selectedCard} onPress={() => navigation.navigate('ReportDetail', { id: selected.id })}>
          <View style={[styles.dot, { backgroundColor: SEVERITY_COLOR[selected.pest.severity] }]} />
          <View style={{ flex: 1 }}>
            <Text style={typography.bodySemiBold}>{selected.pest.name}</Text>
            <Text style={typography.bodySm}>
              {selected.sector} · {selected.pest.crop} · {selected.confidence.toFixed(0)}% confiança
            </Text>
          </View>
          <Text style={[typography.labelCaps, { color: colors.secondary }]}>VER →</Text>
        </Pressable>
      )}

      <View style={styles.legend}>
        <Text style={typography.bodySemiBold}>{points.length} foco(s) registrado(s)</Text>
        <View style={styles.legendRow}>
          <LegendItem color={colors.success} label={`Saudável (${counts.low})`} />
          <LegendItem color={colors.warning} label={`Moderado (${counts.moderate})`} />
          <LegendItem color={colors.error} label={`Crítico (${counts.critical})`} />
        </View>
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
      <Text style={typography.bodySm}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { flexGrow: 0, paddingVertical: 12 },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.default,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  mapArea: { width: MAP_SIZE, height: MAP_SIZE, alignSelf: 'center', borderRadius: radius.lg, overflow: 'hidden' },
  pinWrap: { position: 'absolute', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  pin: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legend: {
    marginTop: 'auto',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  legendRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
});
