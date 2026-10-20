import type { Config, InsulinCorrectionRange } from './config-schema';

export interface CorrectionResult {
  correctionUnits: number | null; // null = no corregir
  shouldAlert: boolean;
}

export function getCorrectionForValue(value: number, config: Config): CorrectionResult {
  const { insulinCorrectionScale, noCorrectBelow, lowAlertThreshold, highAlertThreshold } = config;

  const shouldAlert = value < lowAlertThreshold || value > highAlertThreshold;

  if (value < noCorrectBelow) {
    return { correctionUnits: null, shouldAlert };
  }

  const range: InsulinCorrectionRange | undefined = insulinCorrectionScale.find(
    (r) => value >= r.lowerLimit && value <= r.upperLimit,
  );

  return {
    correctionUnits: range ? range.correctionUnits : null,
    shouldAlert,
  };
}

export const MIN_VALID_GLYCEMIA = 20;
export const MAX_VALID_GLYCEMIA = 600;
export type GlycemiaValidationError = 'notInteger' | 'outOfRange';

/** Devuelve el motivo por el que el valor no es una lectura válida, o null si lo es. */
export function getGlycemiaValidationError(value: number | ''): GlycemiaValidationError | null {
  if (value === '') return null; // campo vacío: el botón ya está deshabilitado
  if (!Number.isInteger(value)) return 'notInteger';
  if (value < MIN_VALID_GLYCEMIA || value > MAX_VALID_GLYCEMIA) return 'outOfRange';
  return null;
}
