import { Severity } from '../../../shared/models';
import { colors } from '../../../shared/theme';
import { GeoPoint, Region } from '../model/geo';

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: colors.error,
  moderate: colors.warning,
  low: colors.success,
};

export interface GeoMapProps {
  points: GeoPoint[];
  region: Region;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}
