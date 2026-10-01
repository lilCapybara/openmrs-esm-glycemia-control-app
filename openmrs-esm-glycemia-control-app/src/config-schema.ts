
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
    glycemiaThresholds: {
        _type: Type.Array,
        _default: [70, 180],
        _description: 'Umbrales clínicos (mg/dL): [hipoglucemia, hiperglucemia].',
        _elements: {
            _type: Type.Number,
        },
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

export type Config = {
    glycemiaConceptUuid: string;
    glucoseUnit: string;
    glycemiaThresholds: Array<number>;
    encounterTypeUuid: string;
    locationUuid: string;
};
