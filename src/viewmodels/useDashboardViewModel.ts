import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { averageHealth, firstNameOf } from '../models/rules';

export function useDashboardViewModel() {
  const { user, history, sectors } = useApp();

  return useMemo(
    () => ({
      firstName: firstNameOf(user?.name),
      avgHealth: averageHealth(sectors),
      recent: history.slice(0, 3),
      hasOfflineItems: history.some((h) => h.offline),
    }),
    [user, history, sectors]
  );
}
