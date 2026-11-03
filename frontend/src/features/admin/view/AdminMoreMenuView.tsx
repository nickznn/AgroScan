import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, typography } from '../../../shared/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { AdminMoreStackParamList } from '../../../navigation/types';
import { useAdminMoreViewModel } from '../viewmodel/useAdminMoreViewModel';

const ITEMS: { key: keyof AdminMoreStackParamList; label: string; icon: keyof typeof MaterialIcons.glyphMap; description: string }[] = [
  { key: 'AdminOrders', label: 'Ordens de serviço', icon: 'assignment', description: 'Ordens de todos os usuários' },
  { key: 'AdminActivity', label: 'Atividade', icon: 'history', description: 'Registro das ações dos administradores' },
  { key: 'Settings', label: 'Configurações', icon: 'settings', description: 'Servidor, sincronização e sair da conta' },
];

export function AdminMoreMenuView() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminMoreStackParamList>>();
  const { displayName, avatarUrl } = useAdminMoreViewModel();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Mais" tone="admin" badge="ADMIN" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.profile} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}>
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <MaterialIcons name="admin-panel-settings" size={28} color="#fff" />}
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={typography.titleMd}>{displayName}</Text>
            <Text style={[typography.bodySm, { color: colors.adminAccent }]}>Administrador</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
        </Pressable>

        {ITEMS.map((item) => (
          <Pressable key={item.key} onPress={() => navigation.navigate(item.key as 'AdminOrders')} style={styles.row}>
            <View style={styles.iconBox}>
              <MaterialIcons name={item.icon} size={22} color={colors.adminAccent} />
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
  avatar: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.adminAccent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14, marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: radius.default, backgroundColor: colors.adminSoft, alignItems: 'center', justifyContent: 'center' },
});
