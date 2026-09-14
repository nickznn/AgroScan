import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { SeverityBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { formatDateTime } from '../utils/format';
import { Severity } from '../types';

const FILTERS: { key: Severity; label: string }[] = [
  { key: 'critical', label: 'Alta' },
  { key: 'moderate', label: 'Média' },
  { key: 'low', label: 'Baixa' },
];

export function HistoryScreen() {
  const { history } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Severity[]>([]);

  const toggleFilter = (key: Severity) => {
    setActiveFilters((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const matchesQuery =
        !query ||
        item.pest.name.toLowerCase().includes(query.toLowerCase()) ||
        item.sector.toLowerCase().includes(query.toLowerCase());
      const matchesSeverity = activeFilters.length === 0 || activeFilters.includes(item.pest.severity);
      return matchesQuery && matchesSeverity;
    });
  }, [history, query, activeFilters]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Histórico de Relatórios" />
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por praga ou setor..."
          placeholderTextColor={colors.outline}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = activeFilters.includes(f.key);
          return (
            <Pressable key={f.key} onPress={() => toggleFilter(f.key)} style={[styles.filterChip, active && styles.filterChipActive]}>
              <Text style={[typography.bodySm, active && { color: colors.onPrimary }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[typography.bodyMd, styles.empty]}>Nenhum registro encontrado.</Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('ReportDetail', { id: item.id })}>
            <Card
              accentColor={
                item.pest.severity === 'critical' ? colors.error : item.pest.severity === 'moderate' ? colors.warning : colors.success
              }
              style={{ marginBottom: 12 }}
            >
              <View style={styles.rowBetween}>
                <SeverityBadge severity={item.pest.severity} />
                <Text style={typography.bodySm}>{formatDateTime(item.timestamp)}</Text>
              </View>
              <Text style={[typography.titleMd, { marginTop: 8 }]}>{item.pest.scientificName}</Text>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={2}>
                {item.pest.description}
              </Text>
              <View style={[styles.rowBetween, { marginTop: 10 }]}>
                <View style={styles.rowStart}>
                  <MaterialIcons name="location-on" size={16} color={colors.outline} />
                  <Text style={[typography.bodySm, { marginLeft: 2 }]}>{item.sector}</Text>
                </View>
                <Text style={typography.bodySm}>{item.pest.crop}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.default,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: colors.onSurface },
  filterRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  filterChipActive: { backgroundColor: colors.primary },
  listContent: { padding: 20, paddingBottom: 100 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowStart: { flexDirection: 'row', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40, color: colors.outline },
});
