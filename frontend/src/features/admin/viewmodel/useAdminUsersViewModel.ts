import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../shared/state/AppContext';
import { deleteAdminUser, fetchAdminUsers, updateAdminUser } from '../../../shared/services/adminApi';
import { Result } from '../../../shared/models';
import { AdminUser, UserFilter } from '../../../shared/models/admin';
import { attempt } from '../../../shared/utils/command';
import { useAsyncData } from '../../../shared/utils/useAsyncData';
import { canActOnUser } from '../model/adminRules';

export function useAdminUsersViewModel() {
  const { user: me } = useApp();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  // Espera o administrador parar de digitar antes de consultar o servidor.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const state = useAsyncData(() => fetchAdminUsers(query, filter), [query, filter]);

  const replace = useCallback(
    (updated: AdminUser) => state.setData((list) => (list ? list.map((u) => (u.id === updated.id ? updated : u)) : list)),
    [state]
  );

  const run = useCallback(
    async (target: AdminUser, action: () => Promise<void>, fallback: string): Promise<Result> => {
      setBusyId(target.id);
      const result = await attempt(action, fallback);
      setBusyId(null);
      return result;
    },
    []
  );

  const toggleRole = useCallback(
    (target: AdminUser) =>
      run(
        target,
        async () => replace(await updateAdminUser(target.id, { role: target.role === 'admin' ? 'user' : 'admin' })),
        'Não foi possível alterar o papel.'
      ),
    [run, replace]
  );

  const toggleActive = useCallback(
    (target: AdminUser) => run(target, async () => replace(await updateAdminUser(target.id, { active: !target.active })), 'Não foi possível alterar a conta.'),
    [run, replace]
  );

  const remove = useCallback(
    (target: AdminUser) =>
      run(
        target,
        async () => {
          await deleteAdminUser(target.id);
          state.setData((list) => (list ? list.filter((u) => u.id !== target.id) : list));
        },
        'Não foi possível excluir o usuário.'
      ),
    [run, state]
  );

  return {
    users: state.data ?? [],
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    reload: state.reload,
    search,
    setSearch,
    filter,
    setFilter,
    busyId,
    canAct: (target: AdminUser) => !!me && canActOnUser(me.id, target),
    toggleRole,
    toggleActive,
    remove,
  };
}
