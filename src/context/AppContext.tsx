import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { DetectionResult, ServiceOrder, Sector, User, Crop } from '../types';
import * as api from '../api/client';

interface AppContextValue {
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, farmName: string) => Promise<void>;
  logout: () => Promise<void>;

  history: DetectionResult[];
  addDetection: (photoUri: string | null) => Promise<DetectionResult>;

  orders: ServiceOrder[];
  updateOrderStatus: (id: string, status: ServiceOrder['status']) => Promise<void>;
  addOrder: (order: { product: string; sector: string; crop: Crop }) => Promise<void>;

  sectors: Sector[];

  lastSync: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [history, setHistory] = useState<DetectionResult[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);

  const loadAllData = useCallback(async () => {
    const [nextHistory, nextOrders, nextSectors] = await Promise.all([
      api.fetchDetections(),
      api.fetchOrders(),
      api.fetchSectors(),
    ]);
    setHistory(nextHistory);
    setOrders(nextOrders);
    setSectors(nextSectors);
    setLastSync(Date.now());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await api.getToken();
        if (token) {
          const me = await api.fetchMe();
          setUser(me);
          await loadAllData();
        }
      } catch {
        await api.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadAllData]);

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      try {
        const loggedUser = await api.login(email, password);
        setUser(loggedUser);
        await loadAllData();
      } catch (err) {
        setAuthError(err instanceof api.ApiError ? err.message : 'Não foi possível entrar');
        throw err;
      }
    },
    [loadAllData]
  );

  const register = useCallback(
    async (email: string, password: string, farmName: string) => {
      setAuthError(null);
      try {
        const newUser = await api.register({ email, password, farmName });
        setUser(newUser);
        await loadAllData();
      } catch (err) {
        setAuthError(err instanceof api.ApiError ? err.message : 'Não foi possível criar a conta');
        throw err;
      }
    },
    [loadAllData]
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setHistory([]);
    setOrders([]);
    setSectors([]);
  }, []);

  const addDetection = useCallback(async (photoUri: string | null) => {
    const detection = await api.createDetection(photoUri);
    setHistory((prev) => [detection, ...prev]);
    return detection;
  }, []);

  const updateOrderStatusFn = useCallback(async (id: string, status: ServiceOrder['status']) => {
    const updated = await api.updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }, []);

  const addOrder = useCallback(async (order: { product: string; sector: string; crop: Crop }) => {
    const created = await api.createOrder(order);
    setOrders((prev) => [created, ...prev]);
  }, []);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      await loadAllData();
    } finally {
      setIsSyncing(false);
    }
  }, [loadAllData]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      authError,
      login,
      register,
      logout,
      history,
      addDetection,
      orders,
      updateOrderStatus: updateOrderStatusFn,
      addOrder,
      sectors,
      lastSync,
      isSyncing,
      syncNow,
    }),
    [
      user,
      isLoading,
      authError,
      login,
      register,
      logout,
      history,
      addDetection,
      orders,
      updateOrderStatusFn,
      addOrder,
      sectors,
      lastSync,
      isSyncing,
      syncNow,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
