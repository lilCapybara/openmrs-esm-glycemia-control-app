/**
 * Tests de la pantalla de control de glucemia, escritos como los usaría una
 * persona: se busca por texto/etiqueta, se interactúa y se verifica lo visible.
 * `usePatient()` y la capa de datos (`glycemia.resource`) se mockean.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useConfig, usePatient } from '@openmrs/esm-framework';
import type { Config } from './config-schema';
import GlycemiaControl from './glycemia-control.component';
import { saveGlycemiaReading, useGlycemiaReadings } from './glycemia.resource';

vi.mock('./glycemia.resource', () => ({
  useGlycemiaReadings: vi.fn(),
  saveGlycemiaReading: vi.fn(),
}));

const mockUseConfig = vi.mocked(useConfig<Config>);
const mockUsePatient = vi.mocked(usePatient);
const mockUseGlycemiaReadings = vi.mocked(useGlycemiaReadings);
const mockSaveGlycemiaReading = vi.mocked(saveGlycemiaReading);

const patientUuid = 'a9e6c5c3-f19f-498c-9ada-ec7a1a2c1871';

const config: Config = {
  glycemiaConceptUuid: '4e396ca3-e951-4c6c-92e9-683ba642169e',
  glucoseUnit: 'mg/dL',
  insulinCorrectionScale: [
    { lowerLimit: 150, upperLimit: 180, correctionUnits: 2 },
    { lowerLimit: 181, upperLimit: 250, correctionUnits: 4 },
    { lowerLimit: 251, upperLimit: 300, correctionUnits: 6 },
    { lowerLimit: 301, upperLimit: 9999, correctionUnits: 10 },
  ],
  noCorrectBelow: 150,
  lowAlertThreshold: 60,
  highAlertThreshold: 300,
  encounterTypeUuid: '50ce5a90-e738-47c3-bd5b-68464615ce62',
  locationUuid: 'fc6cecb2-9ab1-4974-988e-295f59000f50',
};

const mutate = vi.fn();

function mockReadings(readings: Array<{ uuid: string; value: number; obsDatetime: string }> = []) {
  mockUseGlycemiaReadings.mockReturnValue({
    readings,
    isLoading: false,
    error: undefined,
    mutate,
  } as unknown as ReturnType<typeof useGlycemiaReadings>);
}

describe('GlycemiaControl', () => {
  beforeEach(() => {
    mockUseConfig.mockReturnValue(config);
    mockUsePatient.mockReturnValue({ patientUuid } as unknown as ReturnType<typeof usePatient>);
    mockSaveGlycemiaReading.mockResolvedValue(undefined as never);
    mockReadings();
  });

  it('renders the glycemia control page', () => {
    render(<GlycemiaControl />);

    expect(screen.getByRole('heading', { name: /glycemia control/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save reading/i })).toBeDisabled();
  });

  it('shows the range error and keeps the save button disabled for an out-of-range value', async () => {
    const user = userEvent.setup();
    render(<GlycemiaControl />);

    await user.type(screen.getByLabelText(/new reading/i), '0');

    expect(screen.getByText(/the value must be between/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save reading/i })).toBeDisabled();
  });

  it('saves a valid reading for the current patient', async () => {
    const user = userEvent.setup();
    render(<GlycemiaControl />);

    await user.type(screen.getByLabelText(/new reading/i), '120');
    await user.click(screen.getByRole('button', { name: /save reading/i }));

    await waitFor(() => expect(mockSaveGlycemiaReading).toHaveBeenCalledWith(patientUuid, 120, config));
    await waitFor(() => expect(mutate).toHaveBeenCalled());
  });

  it('shows an error message when saving fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSaveGlycemiaReading.mockRejectedValue(new Error('boom'));
    render(<GlycemiaControl />);

    await user.type(screen.getByLabelText(/new reading/i), '120');
    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(await screen.findByText(/could not save the reading/i)).toBeInTheDocument();
  });

  it('flags readings above the high threshold in the history table', () => {
    mockReadings([{ uuid: 'r1', value: 320, obsDatetime: '2026-10-19T10:00:00.000-0300' }]);
    render(<GlycemiaControl />);

    expect(screen.getByText('320 mg/dL')).toBeInTheDocument();
    expect(screen.getByText(/notify staff/i)).toBeInTheDocument();
  });
});
