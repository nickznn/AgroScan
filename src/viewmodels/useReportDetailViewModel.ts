import { useApp } from '../context/AppContext';
import { severityLabel } from '../models/rules';

export function useReportDetailViewModel(id: string) {
  const { history, orders } = useApp();
  const item = history.find((h) => h.id === id);

  // O estágio vem como "L3-L4 (Desenvolvimento)": a primeira palavra vira destaque e o resto, legenda.
  const [stageMain = '', ...stageRest] = item ? item.stage.split(' ') : [];

  return {
    item,
    ordersCount: orders.length,
    severityLabel: item ? severityLabel(item.pest.severity) : '',
    stageMain,
    stageDetail: stageRest.join(' '),
  };
}
