import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, Tile } from '@carbon/react';
import styles from './glycemia-control.scss';

const GlycemiaControl: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Layer>
        <Tile className={styles.tile}>
          <h1 className={styles.heading}>
            {t('glycemiaControlHeading', 'GlycemiaControl')}
          </h1>
          <p className={styles.content}>
            {t('glycemiaControlDescription', 'Welcome to the GlycemiaControl page.')}
          </p>
        </Tile>
      </Layer>
    </div>
  );
};

export default GlycemiaControl;