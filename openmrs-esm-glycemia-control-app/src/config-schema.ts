import { Type } from '@openmrs/esm-framework';

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
export const configSchema = {
  // Add your own config keys here as you build the module, e.g.:
  // glucoseUnit: {
  //   _type: Type.String,
  //   _default: 'mg/dL',
  //   _description: 'Unit used to display glucose readings.',
  // },
};

export type Config = {};
