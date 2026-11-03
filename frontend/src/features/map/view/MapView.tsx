import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../../../shared/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { Crop } from '../../../shared/models';
import { useMapViewModel } from '../viewmodel/useMapViewModel';
import { formatCoords } from '../../../shared/utils/format';
import { GeoMap } from './GeoMap';
import { SEVERITY_COLOR } from './geoMapTypes';

const CROPS: (Crop | 'Todas')[] = ['Todas', 'Soja', 'Milho', 'Algodão', 'Café'];

const SEVERITY_LABEL = { critical: 'Crítico', moderate: 'Moderado', low: 'Baixo' } as const;

export function MapView() {
  const route = useRoute<RouteProp<MainTabParamList, 'Maps'>>();
  const { cropFilter, setCropFilter, points, region, selected, selectedId, select, counts, withoutLocation } = useMapViewModel(route.params?.focusId);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const selectedPoint = points.find((p) => p.item.id === selectedId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Mapa de focos" />

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
        <GeoMap points={points} region={region} selectedId={selectedId} onSelect={select} />

        {points.length === 0 && (
          <View style={styles.emptyState} pointerEvents="none">
            <MaterialIcons name="location-off" size={28} color="#fff" />
            <Text style={[typography.bodyMd, { color: '#fff', textAlign: 'center', marginTop: 8 }]}>
              Nenhum foco com localização. Escaneie uma planta com o GPS ligado e ele aparece aqui.
            </Text>
          </View>
        )}

        <View style={styles.legendOverlay} pointerEvents="none">
          <LegendItem color={colors.error} label={`Crítico ${counts.critical}`} />
          <LegendItem color={colors.warning} label={`Moderado ${counts.moderate}`} />
          <LegendItem color={colors.success} label={`Baixo ${counts.low}`} />
        </View>

        {selected && (
          <Pressable style={styles.selectedCard} onPress={() => navigation.navigate('ReportDetail', { id: selected.id })}>
            <View style={[styles.severityBar, { backgroundColor: SEVERITY_COLOR[selected.pest.severity] }]} />
            <View style={{ flex: 1 }}>
              <Text style={typography.bodySemiBold}>{selected.pest.name}</Text>
              <Text style={typography.bodySm}>
                {selected.sector} · {selected.pest.crop} · {SEVERITY_LABEL[selected.pest.severity]} · {selected.confidence.toFixed(0)}%
              </Text>
              {selectedPoint && (
                <Text style={[typography.bodySm, { color: colors.outline }]}>{formatCoords(selectedPoint.latitude, selectedPoint.longitude)}</Text>
              )}
            </View>
            <Text style={[typography.labelCaps, { color: colors.secondary }]}>VER →</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={typography.bodySemiBold}>{points.length} foco(s) no mapa</Text>
        {withoutLocation > 0 && (
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
            {withoutLocation} sem localização (GPS desligado ou foto da galeria)
          </Text>
        )}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
      <Text style={[typography.bodySm, { color: '#fff' }]}>{label}</Text>
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
  mapArea: { flex: 1, overflow: 'hidden', backgroundColor: '#1f3d2f' },
  emptyState: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 32 },
  legendOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  selectedCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: 14,
    paddingLeft: 0,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  severityBar: { width: 6, alignSelf: 'stretch', marginRight: 12, marginVertical: -14 },
  footer: { backgroundColor: colors.surfaceContainerLowest, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 10 },
});
