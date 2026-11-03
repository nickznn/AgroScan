import { useMemo } from 'react';
import { fetchAudit } from '../../../shared/services/adminApi';
import { useAsyncData } from '../../../shared/utils/useAsyncData';
import { describeAction } from '../model/adminRules';

export function useAdminActivityViewModel() {
  const state = useAsyncData(() => fetchAudit(100), []);

  const entries = useMemo(
    () => (state.data ?? []).map((entry) => ({ ...entry, info: describeAction(entry.action) })),
    [state.data]
  );

  return { entries, loading: state.loading, refreshing: state.refreshing, error: state.error, reload: state.reload };
}
