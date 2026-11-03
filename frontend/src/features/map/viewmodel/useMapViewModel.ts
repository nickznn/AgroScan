import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../shared/state/AppContext';
import { Crop } from '../../../shared/models';
import { regionFor, toGeoPoints } from '../model/geo';
import { countBySeverity } from '../model/mapRules';

export type CropFilter = Crop | 'Todas';

// focusId: foco que deve abrir selecionado (vem do botão "Ver no mapa" do relatório).
export function useMapViewModel(focusId?: string) {
  const { history } = useApp();
  const [cropFilter, setCropFilter] = useState<CropFilter>('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) return;
    setCropFilter('Todas');
    setSelectedId(focusId);
  }, [focusId]);

  const filtered = useMemo(
    () => history.filter((item) => cropFilter === 'Todas' || item.pest.crop === cropFilter),
    [history, cropFilter]
  );
  const points = useMemo(() => toGeoPoints(filtered), [filtered]);
  const withoutLocation = filtered.length - points.length;

  const selected = points.find((p) => p.item.id === selectedId)?.item ?? null;
  const counts = useMemo(() => countBySeverity(points.map((p) => p.item)), [points]);
  // Com um foco selecionado o mapa aproxima nele; senão, enquadra todos.
  const region = useMemo(() => {
    const target = points.find((p) => p.item.id === selectedId);
    return regionFor(target ? [target] : points);
  }, [points, selectedId]);

  return { cropFilter, setCropFilter, points, region, selected, selectedId, select: setSelectedId, counts, withoutLocation };
}
