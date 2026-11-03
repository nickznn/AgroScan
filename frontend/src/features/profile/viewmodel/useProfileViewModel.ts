import { useCallback, useMemo, useState } from 'react';
import { useApp } from '../../../shared/state/AppContext';
import { PhotoSource, Result } from '../../../shared/models';
import { averageHealth, countOrdersByStatus } from '../../../shared/models/rules';
import { pickProfilePhoto } from '../../../shared/services/media';
import { attempt, failure } from '../../../shared/utils/command';

export function useProfileViewModel() {
  const { user, history, orders, sectors, updateProfile, uploadAvatar, uploadFarmPhoto } = useApp();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [farmName, setFarmName] = useState(user?.farmName ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const stats = useMemo(
    () => ({
      analyses: history.length,
      sectors: sectors.length,
      avgHealth: averageHealth(sectors),
      orders: orders.length,
      orderCounts: countOrdersByStatus(orders),
    }),
    [history, sectors, orders]
  );

  const startEditing = useCallback(() => {
    setName(user?.name ?? '');
    setFarmName(user?.farmName ?? '');
    setEditing(true);
  }, [user]);

  const cancelEditing = useCallback(() => setEditing(false), []);

  const save = useCallback(async (): Promise<Result> => {
    if (!name.trim() || !farmName.trim()) return failure('Preencha nome e fazenda.');
    setSaving(true);
    const result = await attempt(() => updateProfile({ name: name.trim(), farmName: farmName.trim() }), 'Não foi possível salvar.');
    setSaving(false);
    if (result.ok) setEditing(false);
    return result;
  }, [name, farmName, updateProfile]);

  // Tira/escolhe a foto e envia. Devolve null quando o usuário cancela a escolha.
  const changePhoto = useCallback(
    async (
      source: PhotoSource,
      aspect: [number, number],
      send: (uri: string) => Promise<void>,
      setBusy: (busy: boolean) => void
    ): Promise<Result | null> => {
      const picked = await attempt(() => pickProfilePhoto(source, aspect), 'Não foi possível abrir a foto.');
      if (!picked.ok) return picked;
      if (!picked.data) return null;
      setBusy(true);
      const result = await attempt(() => send(picked.data as string), 'Não foi possível enviar a foto.');
      setBusy(false);
      return result;
    },
    []
  );

  const changeAvatar = useCallback(
    (source: PhotoSource) => changePhoto(source, [1, 1], uploadAvatar, setUploadingAvatar),
    [changePhoto, uploadAvatar]
  );
  const changeCover = useCallback(
    (source: PhotoSource) => changePhoto(source, [16, 9], uploadFarmPhoto, setUploadingCover),
    [changePhoto, uploadFarmPhoto]
  );

  return {
    user,
    editing, startEditing, cancelEditing,
    name, setName, farmName, setFarmName, saving, save,
    uploadingAvatar, uploadingCover, changeAvatar, changeCover,
    stats,
  };
}
