import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigurableLink, usePatient } from '@openmrs/esm-framework';

const GlycemiaControlDashboardLink: React.FC = () => {
  const { t } = useTranslation();
  const { patientUuid } = usePatient();

  if (!patientUuid) return null;

  return (
    <ConfigurableLink to={`patient/${patientUuid}/chart/glycemia-control`}>
      {t('glycemiaControl', 'Glycemia control')}
    </ConfigurableLink>
  );
};

export default GlycemiaControlDashboardLink;
