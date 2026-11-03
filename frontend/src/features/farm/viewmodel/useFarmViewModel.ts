import { useApp } from '../../../shared/state/AppContext';
import { FARM } from '../model/farm';

export function useFarmViewModel() {
  const { sectors, user } = useApp();
  return {
    sectors,
    farmName: user?.farmName ?? FARM.name,
    farmPhotoUrl: user?.farmPhotoUrl ?? null,
    farm: FARM,
  };
}
