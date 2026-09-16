/**
 * This is the entry page component for the glycemia control module.
 * Build the real UI (glucose readings table, entry form, etc.) here.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes } from './boxes/slot/boxes.component';
import Resources from './resources/resources.component';
import styles from './glycemia-control.scss';

const GlycemiaControl: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h3 className={styles.welcome}>{t('welcomeText', 'Glycemia control')}</h3>
      {/* Boxes: demonstrates the extension system - remove once you have real content */}
      <Boxes />
      <Resources />
    </div>
  );
};

export default GlycemiaControl;
