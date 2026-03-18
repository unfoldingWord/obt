import React, { useContext } from 'react';

import { Button, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { AppContext, ReferenceContext } from '../../context';

import { resetWorkspace } from '../../helper';

function WorkspaceManager({ onClose }) {
  const {
    state: { currentLanguage, resourcesApp },
    actions: { setAppConfig, setLanguageResources },
  } = useContext(AppContext);

  const {
    state: { referenceSelected },
    actions: { goToBookChapterVerse },
  } = useContext(ReferenceContext);

  const { t } = useTranslation();

  const handleReset = () => {
    resetWorkspace({
      bookId: referenceSelected.bookId,
      setAppConfig,
      setLanguageResources,
      goToBookChapterVerse,
      currentLanguage,
      currentReferenceSelected: referenceSelected,
      resourcesApp,
      resetAll: false,
    });

    onClose();
  };

  return (
    <MenuItem button={false} divider={true}>
      <Button
        onClick={handleReset}
        variant="contained"
        color="default"
        size="small"
        fullWidth
      >
        {t('Reset_cards')}
      </Button>
    </MenuItem>
  );
}

export default WorkspaceManager;
