import React from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { DashboardExtension } from '@openmrs/esm-framework';

/**
 * Link del sidebar del patient chart. Usa DashboardExtension (el mismo componente
 * que usan las secciones nativas) para heredar estilo, ícono y estado activo.
 * El título se traduce acá, con las traducciones de este módulo.
 */

const GlycemiaControlDashboardLink: React.FC<{ basePath: string }> = ({ basePath }) => {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <DashboardExtension
        basePath={basePath}
        path="glycemia-control"
        title={t('glycemiaControl', 'Glycemia control')}
        icon="omrs-icon-syringe"
      />
    </BrowserRouter>
  );
};

export default GlycemiaControlDashboardLink;
