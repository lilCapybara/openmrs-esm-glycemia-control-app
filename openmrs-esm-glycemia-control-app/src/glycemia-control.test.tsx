/**
 * This is the root test for this page. It simply checks that the page
 * renders. If the components of your page are highly interdependent,
 * (e.g., if the `Root` component had state that communicated
 * information between `Greeter` and `PatientGetter`) then you might
 * want to do most of your testing here. If those components are
 * instead quite independent (as is the case in this example), then
 * it would make more sense to test those components independently.
 *
 * The key thing to remember, always, is: write tests that behave like
 * users. They should *look* for elements by their visual
 * characteristics, *interact* with them, and (mostly) *assert* based
 * on things that would be visually apparent to a user.
 *
 * To learn more about how we do testing, see the following resources:
 *   https://o3-docs.vercel.app/docs/frontend-modules/testing
 *   https://kentcdodds.com/blog/how-to-know-what-to-test
 *   https://kentcdodds.com/blog/testing-implementation-details
 *   https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
 *
 * Kent C. Dodds is the inventor of `@testing-library`:
 *   https://testing-library.com/docs/guiding-principles
 */

import React from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useConfig } from '@openmrs/esm-framework';
import type { Config } from './config-schema';
import GlycemiaControl from './glycemia-control.component';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mockUseConfig = vi.mocked(useConfig<Config>);

const mockPatient = {
  id: 'a9e6c5c3-f19f-498c-9ada-ec7a1a2c1871',
  resourceType: 'Patient',
} as fhir.Patient;

it('renders the glycemia control landing page', () => {
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
  mockUseConfig.mockReturnValue(config);

  render(
    <MemoryRouter initialEntries={['/patient/a9e6c5c3-f19f-498c-9ada-ec7a1a2c1871/chart/glycemia-control']}>
      <Routes>
        <Route path="/patient/:patientUuid/chart/glycemia-control" element={<GlycemiaControl />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByRole('heading', { name: /glycemia control/i })).toBeInTheDocument();
});
