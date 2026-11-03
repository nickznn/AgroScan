// Chamadas da API de administração (/admin/*). Só quem tem o papel "admin" consegue usá-las: o servidor confere.
import { AdminOrder, AdminOverview, AdminPest, AdminUser, AuditEntry, PestInput, UserFilter } from '../models/admin';
import { OrderStatus, Role } from '../models';
import { request } from './client';

export async function fetchOverview(): Promise<AdminOverview> {
  return request<AdminOverview>('/admin/overview');
}

// ---------- usuários ----------
export async function fetchAdminUsers(search: string, filter: UserFilter): Promise<AdminUser[]> {
  const params: string[] = [];
  if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
  if (filter === 'admin') params.push('role=admin');
  if (filter === 'suspended') params.push('status=suspended');
  const data = await request<{ users: AdminUser[] }>(`/admin/users${params.length ? `?${params.join('&')}` : ''}`);
  return data.users;
}

export async function updateAdminUser(id: number, patch: { role?: Role; active?: boolean }): Promise<AdminUser> {
  const data = await request<{ user: AdminUser }>(`/admin/users/${id}`, { method: 'PATCH', body: patch });
  return data.user;
}

export async function deleteAdminUser(id: number): Promise<void> {
  await request(`/admin/users/${id}`, { method: 'DELETE' });
}

// ---------- ordens de todos os usuários ----------
export async function fetchAdminOrders(status: OrderStatus | 'all'): Promise<AdminOrder[]> {
  const data = await request<{ orders: AdminOrder[] }>(`/admin/orders${status === 'all' ? '' : `?status=${status}`}`);
  return data.orders;
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
  const data = await request<{ order: AdminOrder }>(`/admin/orders/${id}`, { method: 'PATCH', body: { status } });
  return data.order;
}

export async function deleteAdminOrder(id: string): Promise<void> {
  await request(`/admin/orders/${id}`, { method: 'DELETE' });
}

// ---------- catálogo de pragas ----------
export async function fetchAdminPests(): Promise<AdminPest[]> {
  const data = await request<{ pests: AdminPest[] }>('/admin/pests');
  return data.pests;
}

export async function createAdminPest(input: PestInput): Promise<AdminPest> {
  const data = await request<{ pest: AdminPest }>('/admin/pests', { method: 'POST', body: input });
  return data.pest;
}

export async function updateAdminPest(id: string, input: PestInput): Promise<AdminPest> {
  const data = await request<{ pest: AdminPest }>(`/admin/pests/${id}`, { method: 'PATCH', body: input });
  return data.pest;
}

export async function deleteAdminPest(id: string): Promise<void> {
  await request(`/admin/pests/${id}`, { method: 'DELETE' });
}

// ---------- auditoria ----------
export async function fetchAudit(limit = 100): Promise<AuditEntry[]> {
  const data = await request<{ entries: AuditEntry[] }>(`/admin/audit?limit=${limit}`);
  return data.entries;
}
