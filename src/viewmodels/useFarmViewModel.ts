import { useApp } from '../context/AppContext';
import { FARM } from '../data/sectors';

export function useFarmViewModel() {
  const { sectors, user } = useApp();
  return {
    sectors,
    farmName: user?.farmName ?? FARM.name,
    farmPhotoUrl: user?.farmPhotoUrl ?? null,
    farm: FARM,
  };
}
