import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { DashboardView } from '../views/DashboardView';
import { ScannerView } from '../views/ScannerView';
import { MapView } from '../views/MapView';
import { HistoryView } from '../views/HistoryView';
import { MoreNavigator } from './MoreNavigator';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  Scanner: 'qr-code-scanner',
  Maps: 'map',
  Reports: 'bar-chart',
  More: 'menu',
};

const LABELS: Record<keyof MainTabParamList, string> = {
  Home: 'Home',
  Scanner: 'Scanner',
  Maps: 'Maps',
  Reports: 'Reports',
  More: 'Mais',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabel: LABELS[route.name as keyof MainTabParamList],
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name={ICONS[route.name as keyof MainTabParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardView} />
      <Tab.Screen name="Scanner" component={ScannerView} />
      <Tab.Screen name="Maps" component={MapView} />
      <Tab.Screen name="Reports" component={HistoryView} />
      <Tab.Screen name="More" component={MoreNavigator} />
    </Tab.Navigator>
  );
}
