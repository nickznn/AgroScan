import { useMemo } from 'react';
import { useApp } from '../../../shared/state/AppContext';
import { fetchOverview } from '../../../shared/services/adminApi';
import { Severity } from '../../../shared/models';
import { useAsyncData } from '../../../shared/utils/useAsyncData';
import { firstNameOf } from '../../../shared/models/greeting';
import { barRatios, percent } from '../model/adminRules';

const SEVERITY_ORDER: Severity[] = ['critical', 'moderate', 'low'];

export function useAdminDashboardViewModel() {
  const { user } = useApp();
  const state = useAsyncData(fetchOverview, []);
  const overview = state.data;

  const derived = useMemo(() => {
    if (!overview) return null;
    const week = overview.detections.last7Days;
    const ratios = barRatios(week.map((d) => d.count));
    const topRatios = barRatios(overview.topPests.map((p) => p.count));
    return {
      weekBars: week.map((d, i) => ({ label: d.label, count: d.count, ratio: ratios[i] })),
      weekTotal: week.reduce((sum, d) => sum + d.count, 0),
      severity: SEVERITY_ORDER.map((key) => ({
        key,
        count: overview.detections.bySeverity[key],
        percent: percent(overview.detections.bySeverity[key], overview.detections.total),
      })),
      ranking: overview.topPests.map((p, i) => ({ ...p, ratio: topRatios[i] })),
      openOrders: overview.orders.pending + overview.orders.in_progress,
    };
  }, [overview]);

  return {
    firstName: firstNameOf(user?.name),
    overview,
    derived,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    reload: state.reload,
  };
}
