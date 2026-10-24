import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { canSubmitCredentials } from '../models/rules';
import { getApiUrl, isReachable, testAndSaveApiUrl } from '../services/client';
import { messageOf } from '../utils/command';

export type LoginMode = 'login' | 'signup';
// O celular consegue falar com o backend neste endereço?
export type ServerLink = 'checking' | 'online' | 'offline';

export function useLoginViewModel() {
  const { login, register } = useApp();
  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('Fazenda Bela Vista');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Servidor: sem isso, um IP errado impede o login e a única tela pra corrigir (Configurações) fica inacessível.
  const [showServer, setShowServer] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [checkingServer, setCheckingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [link, setLink] = useState<ServerLink>('checking');

  const checkLink = useCallback(async (url: string) => {
    setLink('checking');
    setLink((await isReachable(url, 4000)) ? 'online' : 'offline');
  }, []);

  useEffect(() => {
    getApiUrl().then((url) => {
      setApiUrl(url);
      checkLink(url);
    });
  }, [checkLink]);

  const retryLink = useCallback(() => getApiUrl().then(checkLink), [checkLink]);
  const toggleServer = useCallback(() => setShowServer((v) => !v), []);

  const saveServer = useCallback(async () => {
    setCheckingServer(true);
    setServerStatus(null);
    try {
      await testAndSaveApiUrl(apiUrl);
      setServerStatus({ ok: true, text: 'Conectado! Endereço salvo. Agora é só entrar.' });
      setError(null);
      setLink('online');
    } catch (err) {
      setServerStatus({ ok: false, text: messageOf(err, 'Não foi possível conectar.') });
    } finally {
      setCheckingServer(false);
    }
  }, [apiUrl]);

  const submit = useCallback(async () => {
    if (!canSubmitCredentials(email, password)) {
      setError('Informe um e-mail e senha válidos (mínimo 4 caracteres).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, farmName.trim() || 'Minha Fazenda');
      }
    } catch (err) {
      setError(messageOf(err, 'Não foi possível continuar. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  }, [email, password, farmName, mode, login, register]);

  return {
    mode, setMode,
    email, setEmail,
    password, setPassword,
    farmName, setFarmName,
    loading, error, submit,
    link, retryLink,
    showServer, toggleServer,
    apiUrl, setApiUrl, checkingServer, serverStatus, saveServer,
  };
}
