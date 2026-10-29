import { OrderStatus, ServiceOrder } from '../../../shared/models';

export function filterOrders(orders: ServiceOrder[], status: OrderStatus | 'all'): ServiceOrder[] {
  return status === 'all' ? orders : orders.filter((o) => o.status === status);
}
