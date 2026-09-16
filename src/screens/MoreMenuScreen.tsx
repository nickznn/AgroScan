import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, radius } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { MoreStackParamList } from '../navigation/types';

const ITEMS: { key: keyof MoreStackParamList; label: string; icon: keyof typeof MaterialIcons.glyphMap; description: string }[] = [
  { key: 'Farm', label: 'Fazenda', icon: 'landscape', description: 'Setores monitorados e saúde da lavoura' },
  { key: 'Orders', label: 'Ordens de Serviço', icon: 'assignment', description: 'Aplicações em andamento e pendentes' },
  { key: 'Settings', label: 'Configurações', icon: 'settings', description: 'Sincronização e mapas offline' },
];

export function MoreMenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { user } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="AgroScan Intelligence" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.profile} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={28} color={colors.onPrimary} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={typography.titleMd}>{user?.name ?? 'Produtor'}</Text>
            <Text style={typography.bodySm}>{user?.farmName ?? 'Fazenda Bela Vista'}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
        </Pressable>

        {ITEMS.map((item) => (
          <Pressable key={item.key} onPress={() => navigation.navigate(item.key)} style={styles.row}>
            <View style={styles.iconBox}>
              <MaterialIcons name={item.icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={typography.bodySemiBold}>{item.label}</Text>
              <Text style={typography.bodySm}>{item.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  profile: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  iconBox: { width: 44, height: 44, borderRadius: radius.default, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
});
