import { useCallback, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus, Result } from '../models';
import { filterOrders } from '../models/rules';
import { attempt, failure } from '../utils/command';

export type OrderFilter = OrderStatus | 'all';

export function useOrdersViewModel() {
  const { orders, sectors, updateOrderStatus, addOrder } = useApp();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [product, setProduct] = useState('');
  const [sectorIndex, setSectorIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => filterOrders(orders, filter), [orders, filter]);

  const setStatus = useCallback(
    (id: string, status: OrderStatus): Promise<Result> =>
      attempt(() => updateOrderStatus(id, status), 'Não foi possível atualizar a ordem.'),
    [updateOrderStatus]
  );

  const createOrder = useCallback(async (): Promise<Result> => {
    if (!product.trim()) return failure('Informe o defensivo/produto da ordem.');
    if (sectors.length === 0) return failure('Nenhum setor disponível ainda.');
    const sector = sectors[sectorIndex];
    setSaving(true);
    const result = await attempt(
      () => addOrder({ product: product.trim(), sector: sector.name, crop: sector.crop }),
      'Não foi possível criar a ordem.'
    );
    setSaving(false);
    if (result.ok) {
      setProduct('');
      setSectorIndex(0);
    }
    return result;
  }, [product, sectors, sectorIndex, addOrder]);

  return { sectors, filter, setFilter, filtered, product, setProduct, sectorIndex, setSectorIndex, saving, setStatus, createOrder };
}
