import { useMemo, useState } from 'react';
import { useApp } from '../../../shared/state/AppContext';
import { Crop, DetectionResult } from '../../../shared/models';
import { positionFor } from '../model/mapLayout';
import { countBySeverity } from '../model/mapRules';

export type CropFilter = Crop | 'Todas';

export interface MapPoint {
  item: DetectionResult;
  x: number;
  y: number;
}

export function useMapViewModel() {
  const { history } = useApp();
  const [cropFilter, setCropFilter] = useState<CropFilter>('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const points: MapPoint[] = useMemo(
    () =>
      history
        .filter((item) => cropFilter === 'Todas' || item.pest.crop === cropFilter)
        .map((item) => ({ item, ...positionFor(item) })),
    [history, cropFilter]
  );

  const selected = points.find((p) => p.item.id === selectedId)?.item;
  const counts = useMemo(() => countBySeverity(points.map((p) => p.item)), [points]);

  return { cropFilter, setCropFilter, points, selected, select: setSelectedId, counts };
}
