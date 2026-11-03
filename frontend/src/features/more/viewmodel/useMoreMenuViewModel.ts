import { useApp } from '../../../shared/state/AppContext';

export function useMoreMenuViewModel() {
  const { user } = useApp();
  return {
    displayName: user?.name ?? 'Produtor',
    farmName: user?.farmName ?? 'Fazenda Bela Vista',
    avatarUrl: user?.avatarUrl ?? null,
  };
}
