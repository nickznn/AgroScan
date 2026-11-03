import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../shared/state/AppContext';
import { Result } from '../../../shared/models';
import { getCurrentCoords, hasLocationPermission } from '../../../shared/services/location';
import { pickFromLibrary } from '../../../shared/services/media';
import { attempt } from '../../../shared/utils/command';

// Etapas reais do envio (a tela mostra em qual delas estamos).
export type ScanStage = 'locating' | 'uploading';
export type GpsStatus = 'checking' | 'on' | 'off';

export function useScannerViewModel() {
  const { addDetection } = useApp();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState<ScanStage>('locating');
  const [gps, setGps] = useState<GpsStatus>('checking');

  useEffect(() => {
    let active = true;
    hasLocationPermission().then((granted) => active && setGps(granted ? 'on' : 'off'));
    return () => {
      active = false;
    };
  }, []);

  // Toque no chip "GPS desligado": pede a permissão e confere se a posição chega.
  const enableGps = useCallback(async () => {
    setGps('checking');
    setGps((await getCurrentCoords()) ? 'on' : 'off');
  }, []);

  // Pega a posição, envia a foto e devolve o id do relatório criado. Sem GPS o scan segue sem localização.
  const analyze = useCallback(
    async (uri: string | null): Promise<Result<string>> => {
      setPhotoUri(uri);
      setStage('locating');
      setAnalyzing(true);
      const coords = await getCurrentCoords();
      setGps(coords ? 'on' : 'off');
      setStage('uploading');
      const result = await attempt(async () => (await addDetection(uri, coords)).id, 'Tente novamente.');
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

  return { photoUri, analyzing, stage, gps, enableGps, analyze, analyzeFromLibrary };
}
