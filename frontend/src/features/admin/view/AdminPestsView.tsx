import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../../shared/theme';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Severity } from '../../../shared/models';
import { AdminPest } from '../../../shared/models/admin';
import { useAdminPestsViewModel } from '../viewmodel/useAdminPestsViewModel';
import { CROPS, severityText } from '../model/adminRules';
import { ActionButton, EmptyState, ErrorState, LoadingState, Pill } from './AdminParts';

const SEVERITY_COLOR: Record<Severity, string> = { critical: colors.error, moderate: colors.warning, low: colors.success };
const SEVERITIES: Severity[] = ['critical', 'moderate', 'low'];

export function AdminPestsView() {
  const vm = useAdminPestsViewModel();
  // Se o formulário está aberto é estado só da tela; o conteúdo dele (draft) é do ViewModel.
  const [formVisible, setFormVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    vm.startCreate();
    setFormError(null);
    setFormVisible(true);
  };
  const openEdit = (pest: AdminPest) => {
    vm.startEdit(pest);
    setFormError(null);
    setFormVisible(true);
  };

  const save = async () => {
    const result = await vm.save();
    if (result.ok) setFormVisible(false);
    else setFormError(result.error);
  };

  const askDelete = (pest: AdminPest) =>
    Alert.alert('Apagar praga?', pest.usage > 0 ? `${pest.name} é usada em ${pest.usage} detecção(ões), por isso não pode ser apagada.` : `${pest.name} será removida do catálogo.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          const result = await vm.remove(pest);
          if (!result.ok) Alert.alert('Não foi possível apagar', result.error);
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Catálogo de pragas" tone="admin" badge="ADMIN" />
      {vm.loading ? (
        <LoadingState />
      ) : vm.error && vm.pests.length === 0 ? (
        <ErrorState message={vm.error} onRetry={vm.reload} />
      ) : (
        <FlatList
          data={vm.pests}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          onRefresh={vm.reload}
          refreshing={vm.refreshing}
          ListHeaderComponent={
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginBottom: 10 }]}>
              {vm.pests.length} praga(s). O scanner sorteia entre estas pragas ao analisar uma foto.
            </Text>
          }
          ListEmptyComponent={<EmptyState icon="bug-report" text="Nenhuma praga cadastrada." />}
          renderItem={({ item: p }) => (
            <Card accentColor={SEVERITY_COLOR[p.severity]} style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.titleMd}>{p.name}</Text>
                  <Text style={[typography.bodySm, { color: colors.secondary, fontStyle: 'italic' }]}>{p.scientificName}</Text>
                </View>
                <Pill label={`SEVERIDADE ${severityText(p.severity).toUpperCase()}`} color={SEVERITY_COLOR[p.severity]} bg={SEVERITY_COLOR[p.severity] + '1f'} />
              </View>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 8 }]} numberOfLines={3}>
                {p.description}
              </Text>
              <Text style={[typography.monoSm, { color: colors.outline, marginTop: 8 }]}>
                {p.crop} · área afetada {p.affectedAreaRange[0]}% a {p.affectedAreaRange[1]}% · {p.usage} detecção(ões)
              </Text>
              <View style={styles.actions}>
                <ActionButton icon="edit" label="Editar" onPress={() => openEdit(p)} />
                <ActionButton icon="delete" label="Apagar" tone="danger" onPress={() => askDelete(p)} />
              </View>
            </Card>
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={openCreate}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>

      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={typography.headlineMd}>{vm.editingId ? 'Editar praga' : 'Nova praga'}</Text>
            <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Nome</Text>
              <TextInput style={styles.input} value={vm.draft.name} onChangeText={(t) => vm.updateDraft('name', t)} placeholder="Ex.: Lagarta Falsa Medideira" placeholderTextColor={colors.outline} />
              <Text style={styles.label}>Nome científico</Text>
              <TextInput style={styles.input} value={vm.draft.scientificName} onChangeText={(t) => vm.updateDraft('scientificName', t)} placeholder="Ex.: Chrysodeixis includens" placeholderTextColor={colors.outline} />

              <Text style={styles.label}>Cultura</Text>
              <View style={styles.chips}>
                {CROPS.map((c) => (
                  <Pressable key={c} onPress={() => vm.updateDraft('crop', c)} style={[styles.chip, vm.draft.crop === c && styles.chipActive]}>
                    <Text style={[typography.bodySm, vm.draft.crop === c && { color: '#fff' }]}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Severidade</Text>
              <View style={styles.chips}>
                {SEVERITIES.map((s) => (
                  <Pressable key={s} onPress={() => vm.updateDraft('severity', s)} style={[styles.chip, vm.draft.severity === s && { backgroundColor: SEVERITY_COLOR[s] }]}>
                    <Text style={[typography.bodySm, vm.draft.severity === s && { color: '#fff' }]}>{severityText(s)}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Descrição</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={vm.draft.description} onChangeText={(t) => vm.updateDraft('description', t)} placeholder="O que é e que dano causa" placeholderTextColor={colors.outline} />
              <Text style={styles.label}>Ação recomendada</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={vm.draft.recommendedAction} onChangeText={(t) => vm.updateDraft('recommendedAction', t)} placeholder="O que fazer quando aparecer" placeholderTextColor={colors.outline} />

              <Text style={styles.label}>Área afetada (%): mínimo e máximo</Text>
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} keyboardType="decimal-pad" value={vm.draft.min} onChangeText={(t) => vm.updateDraft('min', t)} />
                <Text style={[typography.bodyMd, { marginHorizontal: 10 }]}>a</Text>
                <TextInput style={[styles.input, { flex: 1 }]} keyboardType="decimal-pad" value={vm.draft.max} onChangeText={(t) => vm.updateDraft('max', t)} />
              </View>
            </ScrollView>
            {formError ? <Text style={[typography.bodySm, { color: colors.error, marginTop: 10 }]}>{formError}</Text> : null}
            <Button label={vm.editingId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PRAGA'} onPress={save} loading={vm.saving} style={{ marginTop: 14, backgroundColor: colors.admin }} />
            <Button label="CANCELAR" variant="outline" onPress={() => setFormVisible(false)} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.adminAccent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20 },
  label: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 2, borderColor: colors.outlineVariant, borderRadius: radius.default, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.onSurface, minHeight: 46 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHigh },
  chipActive: { backgroundColor: colors.adminAccent },
});
