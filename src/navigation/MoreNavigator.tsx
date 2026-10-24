import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './types';
import { MoreMenuView } from '../views/MoreMenuView';
import { ProfileView } from '../views/ProfileView';
import { FarmView } from '../views/FarmView';
import { OrdersView } from '../views/OrdersView';
import { SettingsView } from '../views/SettingsView';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMenu" component={MoreMenuView} />
      <Stack.Screen name="Profile" component={ProfileView} />
      <Stack.Screen name="Farm" component={FarmView} />
      <Stack.Screen name="Orders" component={OrdersView} />
      <Stack.Screen name="Settings" component={SettingsView} />
    </Stack.Navigator>
  );
}
