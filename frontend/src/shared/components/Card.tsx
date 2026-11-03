import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export function Card({ children, style, accentColor }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; accentColor?: string }) {
  return (
    <View style={[styles.card, accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
});
