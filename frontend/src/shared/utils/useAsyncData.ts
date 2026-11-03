import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncData<T> {
  data: T | null;
  /** true só na primeira carga (mostra o indicador de carregando). */
  loading: boolean;
  /** true durante uma recarga (puxar para atualizar) com dados já na tela. */
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** Troca os dados na hora (usado depois de uma ação, sem esperar nova consulta). */
  setData: (updater: (current: T | null) => T | null) => void;
}

/**
 * Carrega dados assíncronos (uma consulta à API) e refaz a consulta quando as dependências mudam.
 * Ignora respostas atrasadas: se uma consulta nova começar antes da anterior terminar, só vale a última.
 */
export function useAsyncData<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncData<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  const hasData = useRef(false);

  const run = useCallback(async () => {
    const id = ++latest.current;
    if (hasData.current) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await loadRef.current();
      if (id !== latest.current) return;
      hasData.current = true;
      setDataState(result);
      setError(null);
    } catch (err) {
      if (id !== latest.current) return;
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados.');
    } finally {
      if (id === latest.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((updater: (current: T | null) => T | null) => setDataState((current) => updater(current)), []);

  return { data, loading, refreshing, error, reload: run, setData };
}
