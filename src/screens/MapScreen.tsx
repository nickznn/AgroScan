import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';

const CROPS = ['Todas', 'Soja', 'Milho', 'Algodão'];

const HOTSPOTS = [
  { id: 1, top: '28%', left: '14%', size: 170, color: 'rgba(186,26,26,0.45)', label: 'CRITICAL', labelColor: colors.error, dot: colors.error },
  { id: 2, top: '48%', left: '58%', size: 150, color: 'rgba(246,159,13,0.4)', label: 'MODERADO', labelColor: colors.warning, dot: colors.warning },
  { id: 3, top: '8%', left: '55%', size: 90, color: 'rgba(43,105,84,0.35)', label: 'SAUDÁVEL', labelColor: colors.success, dot: colors.success },
] as const;

export function MapScreen() {
  const { history } = useApp();
  const [cropFilter, setCropFilter] = useState('Todas');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="AgroScan AI" />
      <View style={styles.mapArea}>
        <LinearGradient colors={['#dfe9ff', '#eaf3ee']} style={StyleSheet.absoluteFill} />
        {HOTSPOTS.map((h) => (
          <View key={h.id} style={[styles.hotspotWrap, { top: h.top, left: h.left }]}>
            <View style={[styles.blob, { width: h.size, height: h.size, backgroundColor: h.color }]} />
            <View style={[styles.pin, { backgroundColor: h.dot }]} />
          </View>
        ))}
        <View style={[styles.hotspotLabel, { top: '34%', left: '12%' }]}>
          <Text style={[typography.labelCaps, { color: colors.error }]}>CRITICAL</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {CROPS.map((crop) => {
            const active = crop === cropFilter;
            return (
              <Pressable key={crop} onPress={() => setCropFilter(crop)} style={[styles.cropChip, active && styles.cropChipActive]}>
                {crop === 'Todas' && <MaterialIcons name="filter-list" size={16} color={active ? '#fff' : colors.onSurface} style={{ marginRight: 6 }} />}
                <Text style={[typography.bodySemiBold, active ? { color: '#fff' } : { color: colors.onSurface }]}>
                  {crop === 'Todas' ? 'Todas as Culturas' : crop}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.legend}>
        <Text style={typography.bodySemiBold}>{history.length} focos registrados</Text>
        <View style={styles.legendRow}>
          <LegendItem color={colors.success} label="Saudável" />
          <LegendItem color={colors.warning} label="Moderado" />
          <LegendItem color={colors.error} label="Crítico" />
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
  mapArea: { flex: 1 },
  hotspotWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  blob: { borderRadius: 999 },
  pin: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  hotspotLabel: { position: 'absolute', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.default, elevation: 2 },
  filterBar: { position: 'absolute', top: 16, left: 0, right: 0 },
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
  legend: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  legendRow: { flexDirection: 'row', marginTop: 8 },
});
