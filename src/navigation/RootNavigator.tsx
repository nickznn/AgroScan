import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { LoginView } from '../views/LoginView';
import { ReportDetailView } from '../views/ReportDetailView';
import { MainTabs } from './MainTabs';
import { useRootViewModel } from '../viewmodels/useRootViewModel';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoggedIn, isLoading } = useRootViewModel();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ReportDetail" component={ReportDetailView} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginView} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
