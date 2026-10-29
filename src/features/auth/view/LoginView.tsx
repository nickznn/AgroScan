import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, radius } from '../../../shared/theme';
import { Button } from '../../../shared/components/Button';
import { useLoginViewModel } from '../viewmodel/useLoginViewModel';

export function LoginView() {
  const vm = useLoginViewModel();
  const { mode, link } = vm;

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
              onPress={() => vm.setMode('login')}
              style={[styles.tab, mode === 'login' && styles.tabActive]}
            >
              Entrar
            </Text>
            <Text
              onPress={() => vm.setMode('signup')}
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
            value={vm.email}
            onChangeText={vm.setEmail}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.outline}
            secureTextEntry
            value={vm.password}
            onChangeText={vm.setPassword}
          />

          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Nome da fazenda</Text>
              <TextInput style={styles.input} value={vm.farmName} onChangeText={vm.setFarmName} />
            </>
          )}

          {vm.error && <Text style={styles.error}>{vm.error}</Text>}

          <Button
            label={mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
            onPress={vm.submit}
            loading={vm.loading}
            style={{ marginTop: 8 }}
          />

          <View style={styles.linkRow}>
            <View
              style={[
                styles.linkDot,
                { backgroundColor: link === 'online' ? colors.success : link === 'offline' ? colors.error : colors.outline },
              ]}
            />
            <Text
              style={[
                styles.hint,
                { marginTop: 0, flexShrink: 1, color: link === 'online' ? colors.success : link === 'offline' ? colors.error : colors.outline },
              ]}
            >
              {link === 'checking'
                ? 'Verificando o servidor...'
                : link === 'online'
                  ? 'Servidor conectado — sua conta fica salva no servidor.'
                  : 'Sem resposta do servidor. Confira se o backend está rodando no computador e se o celular está na mesma rede Wi-Fi (ou use o hotspot do celular). Se o endereço abaixo estiver errado, toque em "Alterar".'}
            </Text>
          </View>
          {link === 'offline' && (
            <Pressable onPress={vm.retryLink} style={{ alignSelf: 'center', marginTop: 8 }}>
              <Text style={styles.serverToggleAction}>Tentar de novo</Text>
            </Pressable>
          )}

          <Pressable onPress={vm.toggleServer} style={styles.serverToggle}>
            <MaterialIcons name="dns" size={14} color={colors.outline} />
            <Text style={styles.serverToggleText} numberOfLines={1}>
              Servidor: {vm.apiUrl || '...'}
            </Text>
            <Text style={styles.serverToggleAction}>{vm.showServer ? 'Fechar' : 'Alterar'}</Text>
          </Pressable>

          {vm.showServer && (
            <View style={{ marginTop: 8 }}>
              <TextInput
                style={styles.input}
                placeholder="http://192.168.0.10:4000"
                placeholderTextColor={colors.outline}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                value={vm.apiUrl}
                onChangeText={vm.setApiUrl}
              />
              <Button
                label="TESTAR E SALVAR"
                variant="outline"
                onPress={vm.saveServer}
                loading={vm.checkingServer}
                style={{ marginTop: 10 }}
              />
              {vm.serverStatus && (
                <Text style={[styles.serverStatus, { color: vm.serverStatus.ok ? colors.success : colors.error }]}>
                  {vm.serverStatus.text}
                </Text>
              )}
            </View>
          )}
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
  linkRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, marginTop: 16 },
  linkDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  serverToggleText: { ...typography.monoSm, color: colors.outline, flexShrink: 1 },
  serverToggleAction: { ...typography.bodySemiBold, color: colors.secondary },
  serverStatus: { ...typography.bodySm, marginTop: 10, textAlign: 'center' },
});
