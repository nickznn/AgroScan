import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { AdminTabParamList } from './types';
import { AdminDashboardView } from '../features/admin/view/AdminDashboardView';
import { AdminUsersView } from '../features/admin/view/AdminUsersView';
import { AdminPestsView } from '../features/admin/view/AdminPestsView';
import { AdminMoreNavigator } from './AdminMoreNavigator';
import { colors } from '../shared/theme';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const ICONS: Record<keyof AdminTabParamList, keyof typeof MaterialIcons.glyphMap> = {
  AdminHome: 'dashboard',
  AdminUsers: 'groups',
  AdminPests: 'bug-report',
  AdminMore: 'menu',
};

const LABELS: Record<keyof AdminTabParamList, string> = {
  AdminHome: 'Painel',
  AdminUsers: 'Usuários',
  AdminPests: 'Pragas',
  AdminMore: 'Mais',
};

// Abas exclusivas do administrador (o usuário comum nunca vê estas telas; e a API também recusa o acesso).
export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.adminAccent,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabel: LABELS[route.name as keyof AdminTabParamList],
        tabBarIcon: ({ color, size }) => <MaterialIcons name={ICONS[route.name as keyof AdminTabParamList]} color={color} size={size} />,
      })}
    >
      <Tab.Screen name="AdminHome" component={AdminDashboardView} />
      <Tab.Screen name="AdminUsers" component={AdminUsersView} />
      <Tab.Screen name="AdminPests" component={AdminPestsView} />
      <Tab.Screen name="AdminMore" component={AdminMoreNavigator} />
    </Tab.Navigator>
  );
}
