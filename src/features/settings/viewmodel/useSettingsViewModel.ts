import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../shared/state/AppContext';
import { OFFLINE_AREAS } from '../model/offlineAreas';
import { Result } from '../../../shared/models';
import { getApiUrl, testAndSaveApiUrl } from '../../../shared/services/client';
import { attempt } from '../../../shared/utils/command';

export function useSettingsViewModel() {
  const { lastSync, isSyncing, syncNow, logout, history } = useApp();
  const [apiUrl, setApiUrl] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getApiUrl().then(setApiUrl);
  }, []);

  const saveApiUrl = useCallback(async (): Promise<Result> => {
    setTesting(true);
    const result = await attempt(() => testAndSaveApiUrl(apiUrl), '');
    setTesting(false);
    return result;
  }, [apiUrl]);

  return {
    lastSync,
    isSyncing,
    syncNow,
    pendingCount: history.filter((h) => h.offline).length,
    apiUrl,
    setApiUrl,
    testing,
    saveApiUrl,
    offlineAreas: OFFLINE_AREAS,
    logout,
  };
}
