import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { File } from 'expo-file-system';
import { DetectionResult, ServiceOrder, Sector, User, Crop } from '../types';

const API_URL_KEY = 'agroscan:apiUrl';
const TOKEN_KEY = 'agroscan:token';
const API_PORT = 4000;

// Último recurso: só vale se não der pra descobrir o endereço sozinho (veja detectDevServerUrl)
// e ninguém tiver salvo um endereço na tela de login / Configurações.
export const DEFAULT_API_URL = `http://192.168.0.125:${API_PORT}`;

/**
 * Em desenvolvimento (Expo Go) o app baixa o JavaScript do Metro, que roda no mesmo notebook do
 * backend. O IP que aparece na URL do bundle é, portanto, o IP do backend — assim não é preciso
 * digitar o IP toda vez que a rede muda. Devolve null em tunnel, web, USB (localhost) e build final.
 */
export function detectDevServerUrl(): string | null {
  try {
    const source = NativeModules.SourceCode;
    const scriptURL: unknown = source?.scriptURL ?? source?.getConstants?.()?.scriptURL;
    if (typeof scriptURL !== 'string') return null;
    const host = scriptURL.match(/^https?:\/\/(\d{1,3}(?:\.\d{1,3}){3})[:/]/)?.[1];
    if (!host || host.startsWith('127.') || host === '0.0.0.0') return null;
    return `http://${host}:${API_PORT}`;
  } catch {
    return null;
  }
}

let cachedBaseUrl: string | null = null;
let cachedToken: string | null = null;

// Prioridade: endereço salvo manualmente > endereço detectado > padrão.
export async function getApiUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  const stored = await AsyncStorage.getItem(API_URL_KEY);
  cachedBaseUrl = stored || detectDevServerUrl() || DEFAULT_API_URL;
  return cachedBaseUrl;
}

export async function setApiUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, '');
  cachedBaseUrl = trimmed;
  await AsyncStorage.setItem(API_URL_KEY, trimmed);
}

// Confere se o servidor responde nesse endereço e só então salva (usado na tela de login e nas Configurações).
export async function testAndSaveApiUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/.+/i.test(clean)) {
    throw new ApiError('Use o formato http://192.168.0.10:4000');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${clean}/health`, { signal: controller.signal });
    if (!res.ok) throw new ApiError('O servidor respondeu com erro.');
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Não foi possível conectar nesse endereço. Confira o IP e se o backend está rodando.');
  } finally {
    clearTimeout(timer);
  }
  await setApiUrl(clean);
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

const REQUEST_TIMEOUT_MS = 15000;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = await getApiUrl();
  const token = await getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const isUpload = options.body instanceof FormData;
  if (!isUpload && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  // Sem timeout, um IP errado numa rede que descarta pacotes deixa o botão girando por minutos.
  // Uploads (FormData) ficam de fora de propósito: mantêm exatamente o caminho já validado no celular.
  const controller = new AbortController();
  const timer = isUpload ? null : setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, isUpload ? { ...options, headers } : { ...options, headers, signal: controller.signal });
  } catch (err) {
    const detail = controller.signal.aborted
      ? 'O servidor demorou demais para responder.'
      : err instanceof Error
        ? err.message
        : String(err);
    console.warn(`[api] fetch falhou para ${path}:`, detail);
    throw new ApiError(
      `Não foi possível conectar ao servidor (${baseUrl}). ${detail} Confira se o backend está rodando e se o endereço do servidor está certo.`
    );
  } finally {
    if (timer) clearTimeout(timer);
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

export async function updateProfile(input: { name?: string; farmName?: string }) {
  const data = await request<{ user: User }>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function logout() {
  await setToken(null);
}

async function uploadUserPhoto(path: string, photoUri: string) {
  const form = new FormData();
  const file = new File(photoUri);
  form.append('photo', file, 'photo.jpg');
  const data = await request<{ user: User }>(path, { method: 'POST', body: form });
  return data.user;
}

export async function uploadAvatar(photoUri: string) {
  return uploadUserPhoto('/auth/me/avatar', photoUri);
}

export async function uploadFarmPhoto(photoUri: string) {
  return uploadUserPhoto('/auth/me/farm-photo', photoUri);
}

// ---------- Detections ----------
export async function fetchDetections() {
  const data = await request<{ detections: DetectionResult[] }>('/detections');
  return data.detections;
}

export async function createDetection(photoUri: string | null) {
  const form = new FormData();
  if (photoUri) {
    // SDK 57: FormData precisa de um Blob de verdade (via a classe File), não mais de
    // um objeto {uri, name, type} solto — isso agora dá "Unsupported FormDataPart implementation".
    const file = new File(photoUri);
    form.append('photo', file, 'scan.jpg');
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
