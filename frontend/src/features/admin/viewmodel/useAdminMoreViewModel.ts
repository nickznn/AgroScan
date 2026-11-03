import { useApp } from '../../../shared/state/AppContext';

export function useAdminMoreViewModel() {
  const { user } = useApp();
  return {
    displayName: user?.name ?? 'Administrador',
    avatarUrl: user?.avatarUrl ?? null,
  };
}
