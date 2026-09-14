import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';

export function LoginScreen() {
  const { login } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('Fazenda Bela Vista');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 3 && password.trim().length >= 4;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Informe um e-mail e senha válidos.');
      return;
    }
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    await login(email.trim(), farmName.trim() || 'Minha Fazenda');
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <View style={styles.logoBadge}>
            <MaterialIcons name="grass" size={36} color={colors.primary} />
          </View>
          <Text style={[typography.headlineLg, styles.title]}>AgroScan</Text>
          <Text style={[typography.bodyMd, styles.subtitle]}>Intelligence</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabRow}>
            <Text
              onPress={() => setMode('login')}
              style={[styles.tab, mode === 'login' && styles.tabActive]}
            >
              Entrar
            </Text>
            <Text
              onPress={() => setMode('signup')}
              style={[styles.tab, mode === 'signup' && styles.tabActive]}
            >
              Criar conta
            </Text>
          </View>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="voce@fazenda.com"
            placeholderTextColor={colors.outline}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.outline}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Nome da fazenda</Text>
              <TextInput style={styles.input} value={farmName} onChangeText={setFarmName} />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label={mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          <Text style={styles.hint}>Demonstração acadêmica — dados armazenados apenas no dispositivo.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.inversePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { color: colors.onPrimary },
  subtitle: { color: colors.inversePrimary },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: 24,
  },
  tabRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: colors.surfaceContainerLow, borderRadius: radius.default, padding: 4 },
  tab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    borderRadius: radius.default,
    fontFamily: 'PublicSans_600SemiBold',
    color: colors.onSurfaceVariant,
  },
  tabActive: { backgroundColor: colors.primary, color: colors.onPrimary },
  label: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: radius.default,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.onSurface,
    minHeight: 48,
  },
  error: { color: colors.error, marginTop: 12, ...typography.bodySm },
  hint: { ...typography.bodySm, color: colors.outline, textAlign: 'center', marginTop: 16 },
});
