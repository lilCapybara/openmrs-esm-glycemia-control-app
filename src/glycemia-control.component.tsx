/**
 * Pantalla principal del módulo de control de glucemia: formulario de carga
 * y tabla con el historial de lecturas del paciente activo.
 */
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
import { useConfig, usePatient } from '@openmrs/esm-framework';
import type { Config } from './config-schema';
import {
  getCorrectionForValue,
  getGlycemiaValidationError,
  MAX_VALID_GLYCEMIA,
  MIN_VALID_GLYCEMIA,
} from './glycemia-correction';
import { useGlycemiaReadings, saveGlycemiaReading } from './glycemia.resource';
import styles from './glycemia-control.scss';

const GlycemiaControl: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<Config>();
  const { patientUuid } = usePatient();
  const [newValue, setNewValue] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const { readings, isLoading, error, mutate } = useGlycemiaReadings(patientUuid);

  const validationError = getGlycemiaValidationError(newValue);
  const validationMessage =
    validationError === 'notInteger'
      ? t('validationNotInteger', 'Enter a whole number (no decimals).')
      : validationError === 'outOfRange'
        ? t('validationOutOfRange', 'The value must be between {{min}} and {{max}} {{unit}}.', {
            min: MIN_VALID_GLYCEMIA,
            max: MAX_VALID_GLYCEMIA,
            unit: config.glucoseUnit,
            interpolation: { escapeValue: false },
          })
        : '';

  const headers = [
    { key: 'obsDatetime', header: t('date', 'Date') },
    { key: 'value', header: t('value', 'Value') },
    { key: 'correction', header: t('suggestedCorrection', 'Suggested correction') },
    { key: 'alert', header: t('alert', 'Alert') },
  ];

  const rows = readings.map((r) => {
    const { correctionUnits, shouldAlert } = getCorrectionForValue(r.value, config);
    return {
      id: r.uuid,
      obsDatetime: new Date(r.obsDatetime).toLocaleString(),
      value: `${r.value} ${config.glucoseUnit}`,
      correction:
        correctionUnits !== null
          ? t('correctionUnits', '{{units}} IU', { units: correctionUnits })
          : t('noCorrection', 'No correction'),
      alert: shouldAlert ? (
        <Tag type="red">{t('notifyStaff', 'Notify staff')}</Tag>
      ) : (
        <Tag type="green">{t('ok', 'OK')}</Tag>
      ),
    };
  });

  const handleSave = async () => {
    if (newValue === '' || getGlycemiaValidationError(newValue) !== null) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      await saveGlycemiaReading(patientUuid, Number(newValue), config);
      setNewValue('');
      mutate();
    } catch (e) {
      setSaveError(true);
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.welcome}>{t('glycemiaControl', 'Glycemia control')}</h3>

      <div className={styles.form}>
        <NumberInput
          id="new-glycemia-value"
          label={t('newReading', 'New reading ({{unit}})', {
            unit: config.glucoseUnit,
            interpolation: { escapeValue: false },
          })}
          value={newValue}
          onChange={(_e, { value }) => setNewValue(value === '' ? '' : Number(value))}
          invalid={validationError !== null}
          invalidText={validationMessage}
          min={0}
          hideSteppers
        />
        <Button onClick={handleSave} disabled={isSaving || newValue === '' || validationError !== null}>
          {isSaving ? t('saving', 'Saving...') : t('saveReading', 'Save reading')}
        </Button>
        {saveError && (
          <InlineNotification
            kind="error"
            title={t('saveError', 'Could not save the reading. Please try again.')}
            lowContrast
            onCloseButtonClick={() => setSaveError(false)}
          />
        )}
      </div>

      {isLoading && <InlineLoading description={t('loadingReadings', 'Loading readings...')} />}
      {error && <p>{t('loadError', 'An error occurred while loading the readings.')}</p>}

      {!isLoading && !error && (
        <DataTable rows={rows} headers={headers}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer title={t('glycemiaReadings', 'Glycemia readings')}>
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
