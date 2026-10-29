import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, typography } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style }: ButtonProps) {
  const variantStyle = styles[variant];
  const textColor = variant === 'outline' ? colors.secondary : variant === 'primary' ? colors.onPrimary : colors.onSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[typography.labelCaps, { color: textColor, marginLeft: icon ? 8 : 0 }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.secondary },
  danger: { backgroundColor: colors.error },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
