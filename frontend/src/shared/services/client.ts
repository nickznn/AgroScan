import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { NativeModules } from 'react-native';
import { File } from 'expo-file-system';
import { DetectionResult, ServiceOrder, Sector, User, Crop } from '../models';

const API_URL_KEY = 'agroscan:apiUrl';
const TOKEN_KEY = 'agroscan:token';
const API_PORT = 4000;

// Último recurso: só vale se não der pra descobrir o endereço sozinho (veja detectDevServerUrl)
// e ninguém tiver salvo um endereço na tela de login / Configurações.
export const DEFAULT_API_URL = `http://localhost:${API_PORT}`;

// Extrai o IPv4 de strings como "192.168.0.10:8081", "exp://192.168.0.10:8081" ou "http://192.168.0.10:8081/index.bundle?...".
function ipv4FromUri(uri: unknown): string | null {
  if (typeof uri !== 'string') return null;
  const host = uri.match(/^(?:[a-z][a-z0-9+.-]*:\/\/)?(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:[/?]|$)/i)?.[1];
  if (!host || host.startsWith('127.') || host === '0.0.0.0') return null;
  return host;
}

/**
 * Em desenvolvimento (Expo Go) o app baixa o JavaScript do Metro, que roda no mesmo computador do
 * backend. O IP que aparece nesse endereço é, portanto, o IP do backend — assim não é preciso
 * digitar o IP toda vez que a rede muda. Devolve null em tunnel (que usa um nome, não um IP),
 * USB (localhost) e build final.
 */
export function detectDevServerUrl(): string | null {
  const sources: unknown[] = [];
  try {
    sources.push(Constants.expoConfig?.hostUri);
    sources.push(Constants.linkingUri);
  } catch {
    // ignora: tenta as outras fontes
  }
  try {
    const source = NativeModules.SourceCode;
    sources.push(source?.scriptURL ?? source?.getConstants?.()?.scriptURL);
  } catch {
    // ignora
  }
  for (const candidate of sources) {
    const host = ipv4FromUri(candidate);
    if (host) return `http://${host}:${API_PORT}`;
  }
  return null;
}

let cachedBaseUrl: string | null = null;
let cachedToken: string | null = null;

// O adaptador "fetch" do axios mantém o mesmo caminho de rede que já estava validado no celular (inclusive o upload de fotos).
const plain = axios.create({ adapter: 'fetch' });

export async function isReachable(url: string, timeoutMs = 2500): Promise<boolean> {
  try {
    const res = await plain.get(`${url.replace(/\/+$/, '')}/health`, { timeout: timeoutMs });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}

async function resolveApiUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(API_URL_KEY);
  const detected = detectDevServerUrl();

  // Um endereço salvo dias atrás pode ter ficado velho (o IP do notebook muda de rede em rede).
  // Se ele não responde mas o detectado responde, troca pelo detectado e salva.
  if (stored && detected && stored !== detected && !(await isReachable(stored)) && (await isReachable(detected))) {
    await AsyncStorage.setItem(API_URL_KEY, detected);
    return detected;
  }
  // Prioridade: endereço salvo > endereço detectado > padrão.
  return stored || detected || DEFAULT_API_URL;
}

let pendingUrl: Promise<string> | null = null;

export async function getApiUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  if (!pendingUrl) {
    pendingUrl = resolveApiUrl().finally(() => {
      pendingUrl = null;
    });
  }
  cachedBaseUrl = await pendingUrl;
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
  try {
    await plain.get(`${clean}/health`, { timeout: 5000 });
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) throw new ApiError('O servidor respondeu com erro.');
    throw new ApiError('Não foi possível conectar nesse endereço. Confira o IP e se o backend está rodando.');
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

// Instância única do axios: o endereço do servidor e o token entram em cada requisição pelo interceptor.
const http = axios.create({ adapter: 'fetch', timeout: REQUEST_TIMEOUT_MS });

http.interceptors.request.use(async (config) => {
  config.baseURL = await getApiUrl();
  const token = await getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  if (config.data instanceof FormData) {
    // Upload: sem timeout curto (a foto pode demorar) e sem Content-Type fixo, para o fetch montar o multipart com o separador certo.
    config.timeout = 0;
    config.headers.setContentType(false);
  }
  return config;
});

function describeError(err: unknown, path: string): ApiError {
  if (axios.isAxiosError(err)) {
    const serverMessage = (err.response?.data as { error?: string } | undefined)?.error;
    if (err.response) return new ApiError(serverMessage || 'Erro inesperado no servidor');
    const baseUrl = err.config?.baseURL ?? '';
    const timedOut = err.code === AxiosError.ECONNABORTED || err.code === AxiosError.ETIMEDOUT;
    const detail = timedOut ? 'O servidor demorou demais para responder.' : err.message;
    console.warn(`[api] requisição falhou para ${path}:`, detail);
    return new ApiError(
      `Não foi possível conectar ao servidor (${baseUrl}). ${detail} Confira se o backend está rodando e se o endereço do servidor está certo.`
    );
  }
  return new ApiError(err instanceof Error ? err.message : 'Erro inesperado');
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const config: AxiosRequestConfig = { url: path, method: options.method ?? 'GET', data: options.body };
  try {
    const response = await http.request<T>(config);
    return response.data;
  } catch (err) {
    throw describeError(err, path);
  }
}

// ---------- Auth ----------
export async function register(input: { name?: string; email: string; password: string; farmName: string }) {
  const data = await request<{ token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: input,
  });
  await setToken(data.token);
  return data.user;
}

export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: { email, password },
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
    body: input,
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
    body: input,
  });
  return data.order;
}

export async function updateOrderStatus(id: string, status: ServiceOrder['status']) {
  const data = await request<{ order: ServiceOrder }>(`/orders/${id}`, {
    method: 'PATCH',
    body: { status },
  });
  return data.order;
}

// ---------- Sectors ----------
export async function fetchSectors() {
  const data = await request<{ sectors: Sector[] }>('/sectors');
  return data.sectors;
}
