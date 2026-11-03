import { useCallback, useState } from 'react';
import { deleteAdminOrder, fetchAdminOrders, updateAdminOrderStatus } from '../../../shared/services/adminApi';
import { OrderStatus, Result } from '../../../shared/models';
import { AdminOrder } from '../../../shared/models/admin';
import { attempt } from '../../../shared/utils/command';
import { useAsyncData } from '../../../shared/utils/useAsyncData';

export type AdminOrderFilter = OrderStatus | 'all';

export function useAdminOrdersViewModel() {
  const [filter, setFilter] = useState<AdminOrderFilter>('all');
  const state = useAsyncData(() => fetchAdminOrders(filter), [filter]);

  const setStatus = useCallback(
    async (order: AdminOrder, status: OrderStatus): Promise<Result> => {
      const result = await attempt(async () => {
        const updated = await updateAdminOrderStatus(order.id, status);
        // Com um filtro de status ativo, a ordem que mudou de status sai da lista.
        state.setData((list) => (list ? list.flatMap((o) => (o.id !== updated.id ? [o] : filter === 'all' || filter === updated.status ? [updated] : [])) : list));
      }, 'Não foi possível mudar o status.');
      return result;
    },
    [state, filter]
  );

  const remove = useCallback(
    async (order: AdminOrder): Promise<Result> => {
      const result = await attempt(async () => {
        await deleteAdminOrder(order.id);
        state.setData((list) => (list ? list.filter((o) => o.id !== order.id) : list));
      }, 'Não foi possível apagar a ordem.');
      return result;
    },
    [state]
  );

  return {
    orders: state.data ?? [],
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    reload: state.reload,
    filter,
    setFilter,
    setStatus,
    remove,
  };
}
