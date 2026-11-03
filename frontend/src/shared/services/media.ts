// Acesso à câmera e à galeria do aparelho (a única parte do app que fala com expo-image-picker).
import * as ImagePicker from 'expo-image-picker';

import { PhotoSource } from '../models';

export type { PhotoSource };

// Escolhe uma foto da galeria para analisar. Devolve null se o usuário cancelar.
export async function pickFromLibrary(quality = 0.6): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality,
  });
  return result.canceled ? null : result.assets[0].uri;
}

// Foto de perfil/capa: tira com a câmera ou escolhe da galeria, com recorte na proporção pedida.
// Devolve null se cancelar; lança erro se a permissão da câmera for negada.
export async function pickProfilePhoto(source: PhotoSource, aspect: [number, number]): Promise<string | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Permissão de câmera necessária.');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect, quality: 0.7 });
    return result.canceled ? null : result.assets[0].uri;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect,
    quality: 0.7,
  });
  return result.canceled ? null : result.assets[0].uri;
}
