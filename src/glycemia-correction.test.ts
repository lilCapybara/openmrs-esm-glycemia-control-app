import { describe, expect, it } from 'vitest';
import type { Config } from './config-schema';
import { getCorrectionForValue, getGlycemiaValidationError } from './glycemia-correction';

const config: Config = {
  glycemiaConceptUuid: 'concept-uuid',
  glucoseUnit: 'mg/dL',
  insulinCorrectionScale: [
    { lowerLimit: 150, upperLimit: 180, correctionUnits: 2 },
    { lowerLimit: 181, upperLimit: 250, correctionUnits: 4 },
    { lowerLimit: 251, upperLimit: 300, correctionUnits: 6 },
    { lowerLimit: 301, upperLimit: 9999, correctionUnits: 10 },
  ],
  noCorrectBelow: 150,
  lowAlertThreshold: 60,
  highAlertThreshold: 300,
  encounterTypeUuid: 'encounter-type-uuid',
  locationUuid: 'location-uuid',
};

describe('getCorrectionForValue', () => {
  it.each([
    [59, null, true],
    [60, null, false],
    [149, null, false],
    [150, 2, false],
    [180, 2, false],
    [181, 4, false],
    [250, 4, false],
    [251, 6, false],
    [300, 6, false],
    [301, 10, true],
  ])('valor %i -> corrección %s, alerta %s', (value, correctionUnits, shouldAlert) => {
    expect(getCorrectionForValue(value, config)).toEqual({ correctionUnits, shouldAlert });
  });
});

describe('getGlycemiaValidationError', () => {
  it('acepta enteros dentro del rango', () => {
    expect(getGlycemiaValidationError(20)).toBeNull();
    expect(getGlycemiaValidationError(110)).toBeNull();
    expect(getGlycemiaValidationError(600)).toBeNull();
  });

  it('no marca error con el campo vacío', () => {
    expect(getGlycemiaValidationError('')).toBeNull();
  });

  it('rechaza decimales', () => {
    expect(getGlycemiaValidationError(110.5)).toBe('notInteger');
  });

  it('rechaza valores fuera de rango', () => {
    expect(getGlycemiaValidationError(0)).toBe('outOfRange');
    expect(getGlycemiaValidationError(19)).toBe('outOfRange');
    expect(getGlycemiaValidationError(601)).toBe('outOfRange');
  });
});
