\# @openmrs/esm-glycemia-control-app



Módulo frontend (O3 ESM) para el registro y seguimiento de glucemias capilares (HGT) de los residentes de la Residencia Santa María, con sugerencia automática de corrección con insulina corriente según una escala provista por el hogar.



Forma parte del proyecto de Práctica Profesional Supervisada (PPS) de TUDAI (UNICEN), junto con el backend en \[`Historia-clinica-Residencia-Santa-Maria`](https://github.com/lilCapybara/Historia-clinica-Residencia-Santa-Maria).



\## ¿Qué hace?



Agrega una sección "Glycemia control" al patient chart de OpenMRS 3. Desde ahí se puede:

\- Ver el historial de lecturas de glucemia de un paciente (fecha, valor, corrección sugerida, alerta).

\- Cargar una nueva lectura, que queda guardada como un `Encounter` en el backend.

\- Ver automáticamente, para cada lectura, cuántas unidades de insulina corriente correspondería aplicar (según una escala configurable) y si el valor amerita avisar al personal (por estar muy bajo o muy alto).



\## Arquitectura / cómo está organizado



Es un microfrontend O3 estándar (single-spa), con esta estructura relevante dentro de `src/`:



src/
├── index.ts                                 # entry point: registra extensiones y config schema
├── routes.json                               # declara slots/extensiones ante el app shell
├── config-schema.ts                          # esquema de configuración (UUIDs, escala de corrección, umbrales)
├── glycemia-control.component.tsx            # UI principal: tabla de lecturas + formulario de carga
├── glycemia.resource.ts                      # llamadas a la REST API de OpenMRS (leer/guardar obs)
└── glycemia-correction.ts                    # lógica pura de cálculo de corrección y alertas





\### Puntos clave para quien vaya a tocar este código



**1. El módulo vive dentro del patient chart, no es una página standalone.**
`glycemia-control.component.tsx` se renderiza como una extensión dentro del slot `patient-chart-glycemia-control-dashboard-slot` (ver `routes.json`), nunca como ruta propia tipo `/glycemia-control`. Esto importa porque:

- El componente **no recibe el paciente por props ni por `react-router-dom`'s `useParams`**. Al ser una extensión O3 (un parcel de single-spa separado), no comparte el contexto de `<Router>` del shell — `useParams` siempre devuelve `undefined` ahí adentro.
- En cambio, se usa `usePatient()` de `@openmrs/esm-framework`, que lee el paciente activo desde el estado global de la app, no del árbol de React:
```ts
  const { patientUuid } = usePatient();
```
  Si en algún momento ves que `patientUuid` llega `undefined`/`null` en un componente nuevo dentro del patient chart, **esta es la primera sospecha**: revisá si estás usando `useParams` en vez de `usePatient`.

El link del sidebar ("Glycemia control") no se arma a mano: se registra en `index.ts` con el helper `createDashboardLink` de `@openmrs/esm-patient-common-lib`, que es el mismo que usan las secciones nativas del patient chart (Programs, Appointments, Billing history, etc.). Esto garantiza que el link tenga exactamente el mismo estilo, ícono y comportamiento (hover, estado activo) que el resto, sin tener que replicar CSS a mano — cosa que además es imposible de hacer 1:1, porque esas clases son CSS Modules con hash generado al compilar esa librería.



\*\*2. Cómo se guarda una lectura (`glycemia.resource.ts`)\*\*



Una lectura se guarda como un `Encounter` con un único `Obs` (no se usa un endpoint de `obs` directo):



```ts

POST /ws/rest/v1/encounter

{

&#x20; "patient": patientUuid,

&#x20; "encounterType": encounterTypeUuid,

&#x20; "location": locationUuid,

&#x20; "obs": \[{ "concept": glycemiaConceptUuid, "value": number }]

}

```



Detalle importante de `openmrsFetch`: \*\*stringifica el `body` automáticamente si le pasás un objeto JS, pero NO agrega el header `Content-Type`\*\*. Hay que pasar ambas cosas:



```ts

openmrsFetch('/ws/rest/v1/encounter', {

&#x20; method: 'POST',

&#x20; headers: { 'Content-Type': 'application/json' },

&#x20; body, // objeto plano, NO hacer JSON.stringify manualmente

});

```



Si volvés a ver un 500 "Content type ... not supported" o un 400 "missing patient", revisá que no se haya vuelto a introducir un doble `JSON.stringify` o que falte el header.



\*\*3. Cómo se leen las lecturas\*\*



`useGlycemiaReadings(patientUuid)` pega contra:



GET /ws/rest/v1/obs?patient={patientUuid}\&concept={glycemiaConceptUuid}\&v=custom:(uuid,value,obsDatetime)



usando `useSWR`. Expone `mutate()`, que hay que llamar después de un `saveGlycemiaReading` exitoso para refrescar la tabla sin recargar la página (ya está cableado así en `glycemia-control.component.tsx`).



\*\*4. Lógica de corrección (`glycemia-correction.ts`)\*\*



Es lógica pura, sin dependencias de red ni de React — fácil de testear aisladamente. Dado un valor de glucemia y la config:

\- Si el valor es menor a `noCorrectBelow`, no corresponde corrección (`correctionUnits: null`).

\- Si no, busca en `insulinCorrectionScale` el rango (`lowerLimit`–`upperLimit`) al que pertenece el valor y devuelve las `correctionUnits` de ese rango.

\- `shouldAlert` es `true` si el valor está por debajo de `lowAlertThreshold` o por encima de `highAlertThreshold`, independientemente de la corrección.



\*\*5. Configuración (`config-schema.ts`)\*\*



Todo lo específico de la institución (UUIDs, escala, umbrales) es configurable, no hardcodeado en el componente:



| Clave | Qué es |

|---|---|

| `glycemiaConceptUuid` | UUID del concept OpenMRS que representa "glucemia" |

| `encounterTypeUuid` | UUID del Encounter Type usado para registrar la lectura |

| `locationUuid` | Location por defecto del encuentro |

| `glucoseUnit` | Unidad mostrada en la UI (ej. `mg/dL`) |

| `insulinCorrectionScale` | Array de rangos `{ lowerLimit, upperLimit, correctionUnits }` |

| `noCorrectBelow` | Por debajo de este valor, no se sugiere corrección |

| `lowAlertThreshold` / `highAlertThreshold` | Umbrales para marcar alerta |



Estos valores se configuran vía el config system de O3 (archivo de config del backend/import map), no se tocan en el código del módulo.



\## Cómo correr en desarrollo



```bash

yarn install

yarn start --backend http://localhost

```



Esto levanta el dev server de O3 apuntando a un backend local. El módulo se integra al patient chart automáticamente vía `routes.json`.



\## Tests



```bash

yarn test       # vitest

yarn verify     # lint + typescript + coverage (lo que corre en CI)

```



El test actual (`glycemia-control.test.tsx`) solo verifica que el componente renderice sin romper. \*\*Pendiente\*\*: mockear `usePatient()` para poder testear el flujo con un `patientUuid` real (hoy el test corre con `usePatient()` devolviendo `undefined`, por eso vas a ver `DEBUG patientUuid: null` en la salida — ese log de debug además debería eliminarse del componente).


## Nota sobre @openmrs/esm-patient-common-lib y el build

Este módulo depende de `@openmrs/esm-patient-common-lib` (para `createDashboardLink`). A diferencia de `@openmrs/esm-framework`, este paquete **no viene compilado**: se publica como código fuente TypeScript crudo, pensado para compilarse dentro del monorepo real de OpenMRS (vía Turborepo), no para instalarse suelto en un proyecto como este.

Por default, la configuración de build de OpenMRS (`openmrs/default-rspack-config`) excluye *todo* `node_modules` del loader de TypeScript, asumiendo que las dependencias ya vienen en JS plano. Eso rompe la compilación en cuanto se importa algo de `esm-patient-common-lib` (errores de parseo tipo "Expected ',', got 'ident'" sobre sintaxis TS normal).

La solución está en `rspack.config.js`: en vez de reexportar la config default tal cual, mutamos `scriptRuleConfig.exclude` (un objeto expuesto por `@openmrs/rspack-config` justamente para este tipo de ajuste) para que la carpeta de `esm-patient-common-lib` sí pase por el loader:

```js
const rspackConfig = require('openmrs/default-rspack-config');

rspackConfig.scriptRuleConfig.exclude = /node_modules\/(?!@openmrs\/esm-patient-common-lib)/;

module.exports = rspackConfig;
```

**Si en el futuro agregás otra dependencia `@openmrs/esm-*` sin compilar y rompe el build con errores de parseo de TypeScript**, el problema casi seguro es este mismo: hay que sumarla a esa regex (ej. `(?!@openmrs\/(esm-patient-common-lib|esm-otro-paquete))`).


\## Cosas pendientes / a mejorar



\- Sacar el `console.log('DEBUG patientUuid', ...)` de `glycemia-control.component.tsx` (quedó de la etapa de debugging).

\- Testear `usePatient()` mockeado en `glycemia-control.test.tsx`.

\- Agregar un test unitario para `getCorrectionForValue` (es lógica pura, ideal para testear sin mocks).

\- Validar en el formulario que el valor cargado esté en un rango fisiológicamente razonable antes de habilitar "Guardar".

