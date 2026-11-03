// Acesso ao GPS do aparelho (a única parte do app que fala com expo-location).
import * as Location from 'expo-location';

import { Coords } from '../models';

// Pede permissão (se ainda não tiver) e devolve a posição atual. Devolve null se o usuário negar
// a permissão, se o GPS estiver desligado ou se demorar demais — o scan segue sem localização.
export async function getCurrentCoords(timeoutMs = 8000): Promise<Coords | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!position) return null;
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

// Situação da permissão sem abrir o diálogo (para mostrar o chip "GPS" na câmera).
export async function hasLocationPermission(): Promise<boolean> {
  try {
    return (await Location.getForegroundPermissionsAsync()).granted;
  } catch {
    return false;
  }
}
