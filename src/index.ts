/**
 * Entry point del módulo: le comunica al app shell las extensiones y la
 * configuración de este microfrontend.
 */
import { getAsyncLifecycle, getSyncLifecycle, defineConfigSchema } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import GlycemiaControlDashboardLink from './glycemia-control-dashboard-link.component';

const moduleName = '@openmrs/esm-glycemia-control-app';

const options = {
  featureName: 'glycemiaControl',
  moduleName,
};

/** Le indica al app shell dónde están los archivos de traducción (`../translations`). */
export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

/** Setup que corre al cargar el módulo: define el esquema de configuración. */
export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

/** Link "Control de glucemia" del sidebar del patient chart (ver `routes.json`). */
export const glycemiaControlDashboardLink = getSyncLifecycle(GlycemiaControlDashboardLink, options);

/** Contenido de la sección: tabla de lecturas + formulario de carga (ver `routes.json`). */
export const glycemiaControlDetailedSummary = getAsyncLifecycle(() => import('./glycemia-control.component'), options);
