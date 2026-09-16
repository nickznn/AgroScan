import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { FARM } from '../data/sectors';
import { MoreStackParamList } from '../navigation/types';
import { useApp } from '../context/AppContext';

const STATUS_MAP = {
  optimal: { label: 'Optimal', color: colors.success },
  review: { label: 'Review', color: colors.warning },
  syncing: { label: 'Sincronizando', color: colors.secondary },
};

export function FarmScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { sectors, user } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="AgroScan Intelligence" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.farmImage}>
            {user?.farmPhotoUrl ? (
              <Image source={{ uri: user.farmPhotoUrl }} style={styles.farmImagePhoto} />
            ) : (
              <MaterialIcons name="landscape" size={40} color={colors.secondary} />
            )}
          </View>
          <Text style={[typography.headlineMd, { marginTop: 12, textAlign: 'center' }]}>{user?.farmName ?? FARM.name}</Text>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 12 }]}>
            {FARM.location} · {FARM.hectares} Hectares
          </Text>
          <View style={styles.cropRow}>
            {FARM.crops.map((c) => (
              <View key={c} style={styles.cropPill}>
                <Text style={typography.bodySm}>{c}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={[styles.rowBetween, { marginTop: 24, marginBottom: 12 }]}>
          <Text style={typography.headlineMd}>Setores Monitorados</Text>
          <View style={styles.addBtn}>
            <MaterialIcons name="add" size={22} color={colors.onPrimary} />
          </View>
        </View>

        {sectors.map((sector) => {
          const status = STATUS_MAP[sector.status];
          return (
            <Card key={sector.id} accentColor={status.color} style={{ marginBottom: 12 }}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={typography.titleMd}>{sector.name}</Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                    {sector.crop} · {sector.hectares} Ha
                  </Text>
                </View>
                <View style={[styles.iconBadge, { backgroundColor: status.color + '22' }]}>
                  <MaterialIcons name="eco" size={20} color={status.color} />
                </View>
              </View>
              <View style={[styles.rowBetween, { marginTop: 12 }]}>
                <View>
                  <Text style={typography.labelCaps}>HEALTH SCORE</Text>
                  <Text style={[typography.headlineMd, { color: status.color }]}>{sector.healthScore}%</Text>
                </View>
                <Text style={[typography.bodySemiBold, { color: status.color }]}>{status.label}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  farmImage: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  farmImagePhoto: { width: '100%', height: '100%' },
  cropRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  cropPill: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: radius.default, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { width: 40, height: 40, borderRadius: radius.default, alignItems: 'center', justifyContent: 'center' },
});
