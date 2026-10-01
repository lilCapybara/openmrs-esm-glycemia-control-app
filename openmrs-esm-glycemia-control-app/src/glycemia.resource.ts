import useSWR from 'swr';
import { openmrsFetch, useConfig } from '@openmrs/esm-framework';
import { Config } from './config-schema';

export interface GlycemiaReading {
  uuid: string;
  value: number;
  obsDatetime: string;
}

interface ObsResponse {
  results: Array<{
    uuid: string;
    value: number;
    obsDatetime: string;
  }>;
}

/**
 * Trae las lecturas históricas de glucemia de un paciente, ordenadas
 * por fecha (más reciente primero, según lo devuelve la API).
 */
export function useGlycemiaReadings(patientUuid: string) {
  const config = useConfig<Config>();
  const { glycemiaConceptUuid } = config;

  const url = `/ws/rest/v1/obs?patient=${patientUuid}&concept=${glycemiaConceptUuid}&v=custom:(uuid,value,obsDatetime)`;

  const { data, error, isLoading, mutate } = useSWR<{ data: ObsResponse }>(patientUuid ? url : null, openmrsFetch);

  const readings: Array<GlycemiaReading> =
    data?.data?.results?.map((obs) => ({
      uuid: obs.uuid,
      value: obs.value,
      obsDatetime: obs.obsDatetime,
    })) ?? [];

  return {
    readings,
    isLoading,
    error,
    mutate, // llamar después de guardar una lectura nueva, para refrescar la tabla
  };
}

/**
 * Guarda una nueva lectura de glucemia como un Encounter con un único Obs.
 */
export async function saveGlycemiaReading(patientUuid: string, value: number, config: Config) {
  const { glycemiaConceptUuid, encounterTypeUuid, locationUuid } = config;

  const body = {
    patient: patientUuid,
    encounterType: encounterTypeUuid,
    location: locationUuid || undefined,
    obs: [
      {
        concept: glycemiaConceptUuid,
        value,
      },
    ],
  };

  return openmrsFetch('/ws/rest/v1/encounter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
