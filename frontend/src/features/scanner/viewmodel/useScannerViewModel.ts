import { useCallback, useState } from 'react';
import { useApp } from '../../../shared/state/AppContext';
import { Result } from '../../../shared/models';
import { pickFromLibrary } from '../../../shared/services/media';
import { attempt } from '../../../shared/utils/command';

export function useScannerViewModel() {
  const { addDetection } = useApp();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Envia a foto (ou nada, se a câmera falhou) para o servidor e devolve o id do relatório criado.
  const analyze = useCallback(
    async (uri: string | null): Promise<Result<string>> => {
      setPhotoUri(uri);
      setAnalyzing(true);
      const result = await attempt(async () => (await addDetection(uri)).id, 'Tente novamente.');
      setAnalyzing(false);
      setPhotoUri(null);
      return result;
    },
    [addDetection]
  );

  // Escolhe da galeria e analisa. Devolve null se o usuário cancelar a escolha.
  const analyzeFromLibrary = useCallback(async (): Promise<Result<string> | null> => {
    const picked = await attempt(() => pickFromLibrary(), 'Não foi possível abrir a galeria.');
    if (!picked.ok) return picked;
    return picked.data ? analyze(picked.data) : null;
  }, [analyze]);

  return { photoUri, analyzing, analyze, analyzeFromLibrary };
}
