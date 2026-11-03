import { useCallback, useMemo, useState } from 'react';
import { useApp } from '../../../shared/state/AppContext';
import { Severity } from '../../../shared/models';
import { filterDetections } from '../model/detectionRules';

export function useHistoryViewModel() {
  const { history } = useApp();
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Severity[]>([]);

  const toggleFilter = useCallback((key: Severity) => {
    setActiveFilters((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  }, []);

  const filtered = useMemo(() => filterDetections(history, query, activeFilters), [history, query, activeFilters]);

  return { query, setQuery, activeFilters, toggleFilter, filtered };
}
