import AsyncStorage from '@react-native-async-storage/async-storage';
import { DetectionResult, ServiceOrder, Sector, User, Crop } from '../types';

const API_URL_KEY = 'agroscan:apiUrl';
const TOKEN_KEY = 'agroscan:token';

// IP da máquina que roda o backend na rede local. Se mudar de rede (ex: Wi-Fi da faculdade),
// ajuste em Configurações > Servidor, dentro do próprio app — não precisa reinstalar nada.
export const DEFAULT_API_URL = 'http://192.168.0.73:4000';

let cachedBaseUrl: string | null = null;
let cachedToken: string | null = null;

export async function getApiUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  const stored = await AsyncStorage.getItem(API_URL_KEY);
  cachedBaseUrl = stored || DEFAULT_API_URL;
  return cachedBaseUrl;
}

export async function setApiUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, '');
  cachedBaseUrl = trimmed;
  await AsyncStorage.setItem(API_URL_KEY, trimmed);
}

export async function getToken(): Promise<string | null> {
  if (cachedToken !== null) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = await getApiUrl();
  const token = await getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(`Não foi possível conectar ao servidor (${baseUrl}). Verifique o IP em Configurações.`);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(data?.error || 'Erro inesperado no servidor');
  }
  return data as T;
}

// ---------- Auth ----------
export async function register(input: { name?: string; email: string; password: string; farmName: string }) {
  const data = await request<{ token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await setToken(data.token);
  return data.user;
}

export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await setToken(data.token);
  return data.user;
}

export async function fetchMe() {
  const data = await request<{ user: User }>('/auth/me');
  return data.user;
}

export async function logout() {
  await setToken(null);
}

// ---------- Detections ----------
export async function fetchDetections() {
  const data = await request<{ detections: DetectionResult[] }>('/detections');
  return data.detections;
}

export async function createDetection(photoUri: string | null) {
  const form = new FormData();
  if (photoUri) {
    form.append('photo', { uri: photoUri, name: 'scan.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  const data = await request<{ detection: DetectionResult }>('/detections', {
    method: 'POST',
    body: form,
  });
  return data.detection;
}

// ---------- Orders ----------
export async function fetchOrders() {
  const data = await request<{ orders: ServiceOrder[] }>('/orders');
  return data.orders;
}

export async function createOrder(input: { product: string; sector: string; crop: Crop }) {
  const data = await request<{ order: ServiceOrder }>('/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.order;
}

export async function updateOrderStatus(id: string, status: ServiceOrder['status']) {
  const data = await request<{ order: ServiceOrder }>(`/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data.order;
}

// ---------- Sectors ----------
export async function fetchSectors() {
  const data = await request<{ sectors: Sector[] }>('/sectors');
  return data.sectors;
}
