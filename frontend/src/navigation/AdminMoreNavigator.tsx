import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminMoreStackParamList } from './types';
import { AdminMoreMenuView } from '../features/admin/view/AdminMoreMenuView';
import { AdminOrdersView } from '../features/admin/view/AdminOrdersView';
import { AdminActivityView } from '../features/admin/view/AdminActivityView';
import { ProfileView } from '../features/profile/view/ProfileView';
import { SettingsView } from '../features/settings/view/SettingsView';

const Stack = createNativeStackNavigator<AdminMoreStackParamList>();

// "Mais" do administrador. O perfil e as configurações são os mesmos do usuário comum.
export function AdminMoreNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMenu" component={AdminMoreMenuView} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersView} />
      <Stack.Screen name="AdminActivity" component={AdminActivityView} />
      <Stack.Screen name="Profile" component={ProfileView as never} />
      <Stack.Screen name="Settings" component={SettingsView as never} />
    </Stack.Navigator>
  );
}
