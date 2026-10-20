# @openmrs/esm-glycemia-control-app

Módulo frontend (O3 ESM) para el registro y seguimiento de glucemias capilares (HGT) de los residentes de la Residencia Santa María, con sugerencia automática de corrección con insulina corriente según una escala provista por el hogar.

Forma parte del proyecto de Práctica Profesional Supervisada (PPS) de TUDAI (UNICEN), junto con el backend y el despliegue en [Historia-clinica-Residencia-Santa-Maria](https://github.com/lilCapybara/Historia-clinica-Residencia-Santa-Maria).

## ¿Qué hace?

Agrega una sección "Control de glucemia" al patient chart de OpenMRS 3. Desde ahí se puede:

- Ver el historial de lecturas de un paciente (fecha, valor, corrección sugerida, alerta).
- Cargar una nueva lectura, que queda guardada como un Encounter en el backend. El valor se valida antes de habilitar "Guardar" (ver [Validación](#4-validación-y-corrección-glycemia-correctionts)).
- Ver, para cada lectura, cuántas unidades de insulina corriente corresponde aplicar (según una escala configurable) y si el valor amerita avisar al personal por estar muy bajo o muy alto.

Los textos están en inglés y español (ver [Traducciones](#traducciones)).

## Cómo está organizado

Es un microfrontend O3 estándar (single-spa). Estructura relevante:

```
src/
├── index.ts                                  # entry point: registra extensiones y config schema
├── routes.json                               # declara slots/extensiones ante el app shell
├── config-schema.ts                          # esquema de configuración (UUIDs, escala, umbrales)
├── glycemia-control-dashboard-link.component.tsx  # link del sidebar del patient chart
├── glycemia-control.component.tsx            # UI principal: tabla de lecturas + formulario
├── glycemia.resource.ts                      # llamadas a la REST API de OpenMRS
├── glycemia-correction.ts                    # lógica pura: corrección, alertas y validación
├── glycemia-correction.test.ts               # tests de la lógica pura
└── glycemia-control.test.tsx                 # tests del componente
translations/
├── en.json
└── es.json
```

## Puntos clave para quien vaya a tocar este código

### 1. El módulo vive dentro del patient chart

`glycemia-control.component.tsx` se renderiza como extensión en el slot `patient-chart-glycemia-control-dashboard-slot` (ver `routes.json`), nunca como ruta propia. Por eso:

- El componente **no** recibe el paciente por props ni por `useParams`. Al ser una extensión O3 (un parcel de single-spa separado), no comparte el contexto de `<Router>` del shell, y `useParams` devuelve `undefined`.
- Se usa `usePatient()` de `@openmrs/esm-framework`, que lee el paciente activo del estado global de la app:

  ```ts
  const { patientUuid } = usePatient();
  ```

  Si en un componente nuevo `patientUuid` llega `undefined`, la primera sospecha es haber usado `useParams` en lugar de `usePatient`.

**El link del sidebar** está en `glycemia-control-dashboard-link.component.tsx`. Usa `DashboardExtension` de `@openmrs/esm-framework`, el mismo componente que usan las secciones nativas (Programs, Appointments, Billing history…), así hereda estilo, ícono y estado activo sin copiar CSS. Dos detalles:

- `DashboardExtension` hace `t(title)` sin valor por defecto. Por eso el título se traduce acá, con las traducciones de este módulo, antes de pasarlo: `title={t('glycemiaControl', 'Glycemia control')}`.
- `basePath` lo inyecta el patient chart.

> Antes se usaba `createDashboardLink` de `@openmrs/esm-patient-common-lib`, pero ese paquete se publica como TypeScript sin compilar y obligaba a modificar `rspack.config.js`. Se reemplazó por `DashboardExtension`, que viene compilado dentro de `esm-framework`. No volver a agregar esa dependencia.

### 2. Cómo se guarda una lectura (`glycemia.resource.ts`)

Una lectura se guarda como un Encounter con un único Obs (no se usa un endpoint de obs directo):

```
POST /ws/rest/v1/encounter
{
  "patient": patientUuid,
  "encounterType": encounterTypeUuid,
  "location": locationUuid,
  "obs": [{ "concept": glycemiaConceptUuid, "value": number }]
}
```

`openmrsFetch` stringifica el body automáticamente si le pasás un objeto JS, pero **no agrega el header `Content-Type`**. Hay que pasar ambas cosas:

```ts
openmrsFetch('/ws/rest/v1/encounter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body, // objeto plano, NO hacer JSON.stringify manualmente
});
```

Si aparece un 500 `Content type ... not supported` o un 400 `missing patient`, revisar que no se haya vuelto a introducir un doble `JSON.stringify` o que falte el header.

### 3. Cómo se leen las lecturas

`useGlycemiaReadings(patientUuid)` pega contra:

```
GET /ws/rest/v1/obs?patient={patientUuid}&concept={glycemiaConceptUuid}&v=custom:(uuid,value,obsDatetime)
```

con `useSWR`. Expone `mutate()`, que se llama después de un `saveGlycemiaReading` exitoso para refrescar la tabla sin recargar la página.

### 4. Validación y corrección (`glycemia-correction.ts`)

Lógica pura, sin red ni React, fácil de testear.

**Corrección** (`getCorrectionForValue(value, config)`):

- Si el valor es menor a `noCorrectBelow`, no corresponde corrección (`correctionUnits: null`).
- Si no, busca en `insulinCorrectionScale` el rango (`lowerLimit`–`upperLimit`) al que pertenece el valor y devuelve sus `correctionUnits`.
- `shouldAlert` es `true` si el valor está por debajo de `lowAlertThreshold` o por encima de `highAlertThreshold`, independientemente de la corrección.

Escala actual: 150–180 → 2 UI, 181–250 → 4 UI, 251–300 → 6 UI, más de 300 → 10 UI. Por debajo de 150 no se corrige. Alerta si es menor a 60 o mayor a 300.

**Validación** (`getGlycemiaValidationError(value)`): devuelve un código y no un texto, para que la UI lo traduzca.

| Código | Cuándo |
|---|---|
| `notInteger` | el valor tiene decimales |
| `outOfRange` | está fuera de `MIN_VALID_GLYCEMIA` (20) – `MAX_VALID_GLYCEMIA` (600) |

Solo se aceptan enteros a propósito: la escala usa límites enteros (180 y 181), y un valor como 180,5 caería en un hueco entre rangos. El botón "Guardar" queda deshabilitado mientras haya un error.

### 5. Configuración (`config-schema.ts`)

Todo lo específico de la institución es configurable, no está escrito en el componente:

| Clave | Qué es |
|---|---|
| `glycemiaConceptUuid` | UUID del concepto "Glycemia level" |
| `encounterTypeUuid` | UUID del tipo de encuentro "Glycemia Reading" |
| `locationUuid` | Ubicación por defecto del encuentro ("Recepcion") |
| `glucoseUnit` | Unidad mostrada en la UI (ej. `mg/dL`) |
| `insulinCorrectionScale` | Array de rangos `{ lowerLimit, upperLimit, correctionUnits }` |
| `noCorrectBelow` | Por debajo de este valor no se sugiere corrección |
| `lowAlertThreshold` / `highAlertThreshold` | Umbrales para marcar alerta |

Los valores por defecto del esquema son los UUID del entorno de desarrollo. En el programa se fijan de forma explícita en `OpenMRS/frontend/residencia-config.json` del repositorio de despliegue, bajo la clave `@openmrs/esm-glycemia-control-app`. Esos tres UUID tienen que coincidir con los que crea `distro/configuration` del backend.

### Traducciones

Se usa `t('clave', 'Texto por defecto en inglés', { variables })`. Los archivos están en `translations/` (`en.json`, `es.json`); se muestra el idioma de la sesión de OpenMRS.

Para agregar un texto: usar `t` con un valor por defecto en inglés y sumar la clave en los dos JSON.

**Cuidado con las unidades:** i18next escapa por defecto los valores interpolados, y la `/` de `mg/dL` aparecería como `mg&#x2F;dL`. Cuando se interpola la unidad hay que pasar `interpolation: { escapeValue: false }`:

```ts
t('newReading', 'New reading ({{unit}})', {
  unit: config.glucoseUnit,
  interpolation: { escapeValue: false },
})
```

## Cómo correr en desarrollo

```
yarn install
yarn start
```

El script `start` de `package.json` ya incluye `--backend http://localhost:80` y `--config-file` apuntando a `../PPS Residencia Santa Maria/OpenMRS/frontend/residencia-config.json`. Por eso:

- **No agregar otro `--backend`** al correrlo: falla con `arg.endsWith is not a function`.
- Esa ruta es relativa a la carpeta del módulo y supone que el repo de despliegue está al lado. Si lo tenés en otro lado, ajustá la ruta en el script.
- Alternativa sin config externa: `yarn openmrs develop --backend http://localhost`.

Se necesita un backend corriendo (ver el repo de despliegue). El módulo se integra al patient chart vía `routes.json`.

## Tests

```
yarn test      # vitest
yarn verify    # lint + typescript + coverage (lo que corre en CI)
```

- `glycemia-correction.test.ts`: límites de la escala, umbrales de alerta y validación.
- `glycemia-control.test.tsx`: renderizado, error de rango, guardado correcto, error al guardar y alerta en el historial.

Cosas a saber al escribir tests:

- `vitest.config.ts` usa `mockReset: true`: los mocks se configuran en un `beforeEach`, no una sola vez.
- `@openmrs/esm-framework` se reemplaza por su mock (`esm-framework/mock`). `usePatient`, `useConfig` y la capa de datos (`./glycemia.resource`) se mockean en cada test.
- El mock de `react-i18next` (`__mocks__/react-i18next.js`) no interpola variables: los tests buscan texto parcial (por ejemplo `/the value must be between/i`).
- `tools/setup-tests.ts` mockea `@openmrs/esm-offline` por un error de interoperabilidad CJS/ESM de `uuid`. Sin ese mock, los tests fallan con `Cannot read properties of undefined (reading 'v1')`.
- El warning `Failed prop type: Invalid prop children supplied to DataTable` de Carbon es inocuo.

## Despliegue

El módulo se agrega al programa como módulo propio (no está publicado en npm). Procedimiento completo en el repositorio de despliegue; en resumen:

```
yarn build
```

1. Copiar el contenido de `dist/` a `OpenMRS/frontend/custom-modules/esm-glycemia-control-app/` (conservando `module.json`).
2. `module.json` debe tener `name` igual al de `package.json` (`@openmrs/esm-glycemia-control-app`), `entry` igual a `openmrs-esm-glycemia-control-app.js` y `version` igual a la de `package.json`.
3. Reconstruir y recrear el frontend:

   ```
   docker compose build frontend
   docker compose up -d --force-recreate frontend
   ```

**Compatibilidad:** el módulo se compila con `@openmrs/esm-framework` 11.x (pre-release) y declara compatibilidad con 9.x en el build. Funciona con la imagen de referencia `3.7.x` que usa el programa. Al actualizar la imagen base conviene volver a probarlo.

## Pendientes

- Decidir si deben poder registrarse las lecturas "LO" y "HI" que informa el glucómetro cuando está fuera de rango (hoy: solo enteros entre 20 y 600).
- Actualizar `repository`, `homepage` y `bugs` de `package.json` (siguen apuntando a la plantilla) y las variables `ESM_NAME` / `JS_NAME` de `.github/workflows/ci.yml`.
- Agregar traducciones a otros idiomas si hicieran falta (los archivos de la plantilla quedaron como base).