// Versão para a web: o react-native-maps não funciona no navegador, então mostramos os focos
// nas posições reais (latitude/longitude) sobre um fundo simples. O mapa de satélite abre no celular.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { typography } from '../../../shared/theme';
import { heatRadiusMeters, projectToUnit } from '../model/geo';
import { GeoMapProps, SEVERITY_COLOR } from './geoMapTypes';

const METERS_PER_DEGREE = 111_000;

export function GeoMap({ points, region, selectedId, onSelect }: GeoMapProps) {
  return (
    <Pressable style={styles.surface} onPress={() => onSelect(null)}>
      {[0.25, 0.5, 0.75].map((f) => (
        <React.Fragment key={f}>
          <View style={[styles.gridLine, { left: `${f * 100}%`, top: 0, bottom: 0, width: 1 }]} />
          <View style={[styles.gridLine, { top: `${f * 100}%`, left: 0, right: 0, height: 1 }]} />
        </React.Fragment>
      ))}

      {points.map((p) => {
        const { x, y } = projectToUnit(p, region);
        const color = SEVERITY_COLOR[p.item.pest.severity];
        const selected = p.item.id === selectedId;
        // A mancha de calor ocupa a mesma fração do mapa que ocuparia no mundo real.
        const heatSize = Math.max(((heatRadiusMeters(p.item) * 2) / METERS_PER_DEGREE / region.longitudeDelta) * 100, 6);
        return (
          <React.Fragment key={p.item.id}>
            <View
              pointerEvents="none"
              style={[styles.heat, { left: `${x * 100}%`, top: `${y * 100}%`, width: `${heatSize}%`, aspectRatio: 1, backgroundColor: color }]}
            />
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onSelect(p.item.id);
              }}
              hitSlop={10}
              style={[styles.pinWrap, { left: `${x * 100}%`, top: `${y * 100}%` }]}
            >
              <View style={[styles.pin, { backgroundColor: color }, selected && styles.pinSelected]} />
            </Pressable>
          </React.Fragment>
        );
      })}

      <View style={styles.note} pointerEvents="none">
        <MaterialIcons name="smartphone" size={14} color="#fff" />
        <Text style={[typography.bodySm, { color: '#fff', marginLeft: 6 }]}>Prévia no navegador: o mapa de satélite fica no app instalado</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: { ...StyleSheet.absoluteFill, backgroundColor: '#1f3d2f', overflow: 'hidden' },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.08)' },
  heat: { position: 'absolute', borderRadius: 9999, opacity: 0.35, transform: [{ translateX: '-50%' }, { translateY: '-50%' }] },
  pinWrap: { position: 'absolute', width: 28, height: 28, marginLeft: -14, marginTop: -14, alignItems: 'center', justifyContent: 'center' },
  pin: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: '#fff' },
  pinSelected: { width: 26, height: 26, borderRadius: 13, borderWidth: 4 },
  note: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
});
