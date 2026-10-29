import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './types';
import { MoreMenuView } from '../features/more/view/MoreMenuView';
import { ProfileView } from '../features/profile/view/ProfileView';
import { FarmView } from '../features/farm/view/FarmView';
import { OrdersView } from '../features/orders/view/OrdersView';
import { SettingsView } from '../features/settings/view/SettingsView';

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
