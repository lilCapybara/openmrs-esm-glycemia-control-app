const rspackConfig = require('openmrs/default-rspack-config');

/**
 * El loader de TypeScript de OpenMRS excluye TODO `node_modules` por
 * default, asumiendo que las dependencias ya vienen compiladas a JS
 * plano (como @openmrs/esm-framework). Pero @openmrs/esm-patient-common-lib
 * se distribuye como código fuente TypeScript sin compilar (pensado para
 * compilarse dentro del monorepo real de OpenMRS vía Turborepo). Acá
 * ampliamos la exclusión para que ESA carpeta puntual sí pase por
 * swc-loader, sin afectar al resto de las dependencias.
 */
rspackConfig.scriptRuleConfig.exclude = /node_modules\/(?!@openmrs\/esm-patient-common-lib)/;

module.exports = rspackConfig;
