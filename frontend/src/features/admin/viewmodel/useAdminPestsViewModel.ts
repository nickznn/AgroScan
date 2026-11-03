import { useCallback, useState } from 'react';
import { createAdminPest, deleteAdminPest, fetchAdminPests, updateAdminPest } from '../../../shared/services/adminApi';
import { Result } from '../../../shared/models';
import { AdminPest } from '../../../shared/models/admin';
import { attempt, failure } from '../../../shared/utils/command';
import { useAsyncData } from '../../../shared/utils/useAsyncData';
import { PestDraft, draftFromPest, emptyPestDraft, validatePestDraft } from '../model/adminRules';

export function useAdminPestsViewModel() {
  const state = useAsyncData(fetchAdminPests, []);
  const [draft, setDraft] = useState<PestDraft>(emptyPestDraft());
  // null = criando uma praga nova; texto = id da praga que está sendo editada.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startCreate = useCallback(() => {
    setEditingId(null);
    setDraft(emptyPestDraft());
  }, []);

  const startEdit = useCallback((pest: AdminPest) => {
    setEditingId(pest.id);
    setDraft(draftFromPest(pest));
  }, []);

  const updateDraft = useCallback(<K extends keyof PestDraft>(key: K, value: PestDraft[K]) => setDraft((d) => ({ ...d, [key]: value })), []);

  const save = useCallback(async (): Promise<Result> => {
    const checked = validatePestDraft(draft);
    if (!checked.ok) return failure(checked.error);
    setSaving(true);
    const result = await attempt(
      () => (editingId ? updateAdminPest(editingId, checked.input) : createAdminPest(checked.input)),
      'Não foi possível salvar a praga.'
    );
    setSaving(false);
    if (result.ok) await state.reload();
    return result.ok ? { ok: true, data: undefined } : result;
  }, [draft, editingId, state]);

  const remove = useCallback(
    async (pest: AdminPest): Promise<Result> => {
      const result = await attempt(() => deleteAdminPest(pest.id), 'Não foi possível apagar a praga.');
      if (result.ok) state.setData((list) => (list ? list.filter((p) => p.id !== pest.id) : list));
      return result;
    },
    [state]
  );

  return {
    pests: state.data ?? [],
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    reload: state.reload,
    draft,
    updateDraft,
    editingId,
    saving,
    startCreate,
    startEdit,
    save,
    remove,
  };
}
