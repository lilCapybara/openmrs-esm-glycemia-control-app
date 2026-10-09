/**
 * This is the entrypoint file of the application. It communicates the
 * important features of this microfrontend to the app shell. It
 * connects the app shell to the React application(s) that make up this
 * microfrontend.
 */
import { getAsyncLifecycle, getSyncLifecycle, defineConfigSchema } from '@openmrs/esm-framework';
import { createDashboardLink } from '@openmrs/esm-patient-common-lib';

import { configSchema } from './config-schema';

const moduleName = '@openmrs/esm-glycemia-control-app';

const options = {
  featureName: 'glycemiaControl',
  moduleName,
};

/**
 * This tells the app shell how to obtain translation files: that they
 * are JSON files in the directory `../translations` (which you should
 * see in the directory structure).
 */
export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

/**
 * This function performs any setup that should happen at microfrontend
 * load-time (such as defining the config schema) and then returns an
 * object which describes how the React application(s) should be
 * rendered.
 */
export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

/**
 * Link del sidebar del patient chart. Usa el helper compartido
 * `createDashboardLink` para heredar exactamente el mismo estilo
 * (clases CSS, ícono, estados hover/activo) que el resto de las
 * secciones del patient chart (Programs, Appointments, Billing history, etc.).
 */
export const glycemiaControlDashboardLink = getSyncLifecycle(
  createDashboardLink({
    path: 'glycemia-control',
    title: 'Glycemia control',
    icon: 'omrs-icon-syringe',
  }),
  options,
);

/**
 * Contenido que se muestra dentro de la sección (la tabla + formulario).
 */
export const glycemiaControlDetailedSummary = getAsyncLifecycle(() => import('./glycemia-control.component'), options);
