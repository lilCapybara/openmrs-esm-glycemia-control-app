/**
 * This is the entry page component for the glycemia control module.
 * Build the real UI (glucose readings table, entry form, etc.) here.
 */

import { usePatient } from '@openmrs/esm-framework';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  NumberInput,
  Button,
  Tag,
  InlineLoading,
  InlineNotification,
} from '@carbon/react';
import { useConfig } from '@openmrs/esm-framework';
import type { Config } from './config-schema';
import { getCorrectionForValue } from './glycemia-correction';
import { useGlycemiaReadings, saveGlycemiaReading } from './glycemia.resource';
import styles from './glycemia-control.scss';

const headers = [
  { key: 'obsDatetime', header: 'Fecha' },
  { key: 'value', header: 'Valor' },
  { key: 'correction', header: 'Corrección sugerida' },
  { key: 'alert', header: 'Alerta' },
];

const GlycemiaControl: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<Config>();
  const { patientUuid } = usePatient();
  const [newValue, setNewValue] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { readings, isLoading, error, mutate } = useGlycemiaReadings(patientUuid);

  const rows = readings.map((r) => {
    const { correctionUnits, shouldAlert } = getCorrectionForValue(r.value, config);
    return {
      id: r.uuid,
      obsDatetime: new Date(r.obsDatetime).toLocaleString(),
      value: `${r.value} ${config.glucoseUnit}`,
      correction: correctionUnits !== null ? `${correctionUnits} UI` : 'No corregir',
      alert: shouldAlert ? <Tag type="red">¡Avisar!</Tag> : <Tag type="green">OK</Tag>,
    };
  });

  const handleSave = async () => {
    if (newValue === '') return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveGlycemiaReading(patientUuid, Number(newValue), config);
      setNewValue('');
      mutate();
    } catch (e) {
      setSaveError('No se pudo guardar la lectura. Revisá la consola para más detalle.');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };
  // eslint-disable-next-line no-console
  console.log('DEBUG patientUuid:', patientUuid);
  return (
    <div className={styles.container}>
      <h3 className={styles.welcome}>{t('welcomeText', 'Glycemia control')}</h3>

      <div className={styles.form}>
        <NumberInput
          id="new-glycemia-value"
          label={`Nueva lectura (${config.glucoseUnit})`}
          value={newValue}
          onChange={(_e, { value }) => setNewValue(value === '' ? '' : Number(value))}
          min={0}
          hideSteppers
        />
        <Button onClick={handleSave} disabled={isSaving || newValue === ''}>
          {isSaving ? 'Guardando...' : 'Guardar lectura'}
        </Button>
        {saveError && (
          <InlineNotification
            kind="error"
            title={saveError}
            lowContrast
            onCloseButtonClick={() => setSaveError(null)}
          />
        )}
      </div>

      {isLoading && <InlineLoading description="Cargando lecturas..." />}
      {error && <p>Ocurrió un error al cargar las lecturas.</p>}

      {!isLoading && !error && (
        <DataTable rows={rows} headers={headers}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer title="Lecturas de glucemia">
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      )}
    </div>
  );
};

export default GlycemiaControl;
