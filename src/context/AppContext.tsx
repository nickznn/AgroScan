import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DetectionResult, ServiceOrder, User } from '../types';
import { SEED_HISTORY } from '../data/history';
import { INITIAL_ORDERS } from '../data/orders';

const HISTORY_KEY = 'agroscan:history';
const USER_KEY = 'agroscan:user';

interface AppContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, farmName: string) => Promise<void>;
  logout: () => Promise<void>;

  history: DetectionResult[];
  addDetection: (result: DetectionResult) => void;

  orders: ServiceOrder[];
  updateOrderStatus: (id: string, status: ServiceOrder['status']) => void;

  lastSync: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<DetectionResult[]>(SEED_HISTORY);
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedHistory] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(HISTORY_KEY),
        ]);
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedHistory) setHistory(JSON.parse(storedHistory));
      } catch {
        // se o storage falhar, seguimos com os dados padrão em memória
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, farmName: string) => {
    const nextUser: User = { name: email.split('@')[0] || 'Produtor', email, farmName };
    setUser(nextUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_KEY);
  }, []);

  const addDetection = useCallback((result: DetectionResult) => {
    setHistory((prev) => {
      const next = [result, ...prev];
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateOrderStatus = useCallback((id: string, status: ServiceOrder['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setLastSync(Date.now());
    setIsSyncing(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      history,
      addDetection,
      orders,
      updateOrderStatus,
      lastSync,
      isSyncing,
      syncNow,
    }),
    [user, isLoading, login, logout, history, addDetection, orders, updateOrderStatus, lastSync, isSyncing, syncNow]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
