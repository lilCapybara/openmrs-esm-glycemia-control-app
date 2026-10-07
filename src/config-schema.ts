
/**
 * Config schema for the glycemia control module.
 *
 * To understand the schema below, please read the configuration system
 * documentation:
 *   https://openmrs.github.io/openmrs-esm-core/#/main/config
 * Note especially the section "How do I make my module configurable?"
 *   https://openmrs.github.io/openmrs-esm-core/#/main/config?id=im-developing-an-esm-module-how-do-i-make-it-configurable
 * and the Schema Reference
 *   https://openmrs.github.io/openmrs-esm-core/#/main/config?id=schema-reference
 */
import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  glycemiaConceptUuid: {
    _type: Type.ConceptUuid,
    _default: '4e396ca3-e951-4c6c-92e9-683ba642169e',
    _description: 'UUID del concept que representa la lectura de glucemia.',
  },
  glucoseUnit: {
    _type: Type.String,
    _default: 'mg/dL',
    _description: 'Unidad de medida mostrada para las lecturas.',
  },
  insulinCorrectionScale: {
    _type: Type.Array,
    _default: [
      { lowerLimit: 150, upperLimit: 180, correctionUnits: 2 },
      { lowerLimit: 181, upperLimit: 250, correctionUnits: 4 },
      { lowerLimit: 251, upperLimit: 300, correctionUnits: 6 },
      { lowerLimit: 301, upperLimit: 9999, correctionUnits: 10 },
    ],
    _description:
      'Escala de corrección con insulina corriente subcutánea según rango de HGT (mg/dL), según la tabla provista por el hogar.',
    _elements: {
      lowerLimit: {
        _type: Type.Number,
        _default: 0,
        _description: 'Límite inferior del rango (mg/dL), inclusive.',
      },
      upperLimit: {
        _type: Type.Number,
        _default: 0,
        _description: 'Límite superior del rango (mg/dL), inclusive.',
      },
      correctionUnits: {
        _type: Type.Number,
        _default: 0,
        _description: 'Unidades de insulina corriente a corregir en este rango.',
      },
    },
  },
  noCorrectBelow: {
    _type: Type.Number,
    _default: 150,
    _description: 'Por debajo de este valor (mg/dL) no se corrige con insulina.',
  },
  lowAlertThreshold: {
    _type: Type.Number,
    _default: 60,
    _description: 'Por debajo de este valor (mg/dL) se debe avisar al personal.',
  },
  highAlertThreshold: {
    _type: Type.Number,
    _default: 300,
    _description: 'Por encima de este valor (mg/dL) se debe avisar al personal.',
  },
  encounterTypeUuid: {
    _type: Type.UUID,
    _default: '50ce5a90-e738-47c3-bd5b-68464615ce62',
    _description: 'UUID del Encounter Type "Glycemia Reading" usado para registrar la lectura.',
  },
  locationUuid: {
    _type: Type.UUID,
    _default: 'fc6cecb2-9ab1-4974-988e-295f59000f50',
    _description: 'UUID de la Location por defecto para el encuentro (Recepcion).',
  },
};

export interface InsulinCorrectionRange {
  lowerLimit: number;
  upperLimit: number;
  correctionUnits: number;
}

export type Config = {
  glycemiaConceptUuid: string;
  glucoseUnit: string;
  insulinCorrectionScale: Array<InsulinCorrectionRange>;
  noCorrectBelow: number;
  lowAlertThreshold: number;
  highAlertThreshold: number;
  encounterTypeUuid: string;
  locationUuid: string;
};
