// Mapa de satélite de verdade (Android e iOS). Na web, o Metro usa GeoMap.tsx no lugar deste arquivo.
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import NativeMap, { Circle, Marker } from 'react-native-maps';
import { heatRadiusMeters } from '../model/geo';
import { GeoMapProps, SEVERITY_COLOR } from './geoMapTypes';

export function GeoMap({ points, region, selectedId, onSelect }: GeoMapProps) {
  const mapRef = useRef<NativeMap>(null);
  const firstRegion = useRef(true);
  // Os marcadores personalizados só desenham certo se o mapa os "acompanhar" por um instante; depois desligamos.
  const [tracking, setTracking] = useState(true);

  useEffect(() => {
    if (firstRegion.current) {
      firstRegion.current = false;
      return;
    }
    mapRef.current?.animateToRegion(region, 500);
  }, [region]);

  useEffect(() => {
    setTracking(true);
    const timer = setTimeout(() => setTracking(false), 700);
    return () => clearTimeout(timer);
  }, [points, selectedId]);

  return (
    <NativeMap
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      mapType="hybrid"
      initialRegion={region}
      showsUserLocation
      showsCompass={false}
      toolbarEnabled={false}
      onPress={() => onSelect(null)}
    >
      {points.map((p) => {
        const color = SEVERITY_COLOR[p.item.pest.severity];
        const selected = p.item.id === selectedId;
        return (
          <Circle
            key={`heat-${p.item.id}`}
            center={{ latitude: p.latitude, longitude: p.longitude }}
            radius={heatRadiusMeters(p.item)}
            fillColor={`${color}55`}
            strokeColor={selected ? '#ffffff' : `${color}aa`}
            strokeWidth={selected ? 2 : 1}
          />
        );
      })}
      {points.map((p) => {
        const color = SEVERITY_COLOR[p.item.pest.severity];
        const selected = p.item.id === selectedId;
        return (
          <Marker
            key={p.item.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            onPress={(event) => {
              event.stopPropagation();
              onSelect(p.item.id);
            }}
            tracksViewChanges={tracking}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.pin, { backgroundColor: color }, selected && styles.pinSelected]} />
          </Marker>
        );
      })}
    </NativeMap>
  );
}

const styles = StyleSheet.create({
  pin: { width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#fff' },
  pinSelected: { width: 28, height: 28, borderRadius: 14, borderWidth: 4 },
});
