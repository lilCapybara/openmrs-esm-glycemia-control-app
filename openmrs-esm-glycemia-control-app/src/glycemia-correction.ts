import { Config, InsulinCorrectionRange } from './config-schema';

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
