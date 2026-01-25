import React, { useContext, useEffect, useState, useRef } from 'react';

import axios from 'axios';
import { MenuItem, Menu, Button, Box, useTheme } from '@mui/material';
import { getXY } from 'resource-workspace-rcl';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import { AppContext, ReferenceContext } from '../../context';
import { SelectResourcesLanguages, DialogUI, FeedbackDialog } from '../../components';

import { subjects, bibleSubjects, obsSubjects, langNames } from '../../config/materials';
import { defaultCard, server, columns } from '../../config/base';
import { fetchTcReadyRepos, getRepoSlug, getUniqueResources, packageLangs } from '../../helper';

import LanguageIcon from '@mui/icons-material/Language';

function SearchResources({ anchorEl, onClose, open }) {
  const {
    state: { appConfig, resourcesApp, languageResources },
    actions: { setAppConfig, setResourcesApp },
  } = useContext(AppContext);

  const {
    state: {
      referenceSelected: { bookId },
    },
  } = useContext(ReferenceContext);

  const { t } = useTranslation();
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);

  const prevResources = useRef([]);
  const uniqueResources = getUniqueResources(appConfig, resourcesApp);
  const { enqueueSnackbar } = useSnackbar();
  const handleAddMaterial = (item) => {
    setAppConfig((prev) => {
      const next = {};
      for (let k in prev) {
        // Use prev[k] (not appConfig[k]) to ensure we use the latest state in React 18
        const pos = getXY(prev[k], columns[k], defaultCard[k].h, defaultCard[k].w);
        next[k] = prev[k].concat({
          ...defaultCard[k],
          x: pos.x,
          y: pos.y,
          i: item.owner + '__' + item.name,
        });
      }
      return next;
    });
    setTimeout(function () {
      document
        .querySelector('#' + item.owner + '__' + item.name + '_title')
        .scrollIntoView();
    }, 1000);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleOpenFeedbackDialog = () => {
    handleCloseDialog();
    setOpenFeedbackDialog(true);
    onClose();
  };

  const findNewResources = (_prev, _result) => {
    if (_prev?.length > 0) {
      if (_result.length > _prev.length) {
        const result = [..._result];
        const prev = [..._prev];
        const flatPrev = prev.map((el) => el.id);
        return result.filter((res) => !flatPrev.includes(res.id));
      } else {
        return [];
      }
    }
  };

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const tcReadyRepos = await fetchTcReadyRepos(server);
        const res = await axios.get(
          server +
            '/api/v1/catalog/search?limit=1000&sort=lang,title' +
            '&subject=' +
            subjects.join(',')
        );
        const result = res.data.data
          .map((el) => {
            return {
              id: el.id,
              languageId: el.language.toLowerCase(),
              name: el.name,
              subject: el.subject,
              title: el.title,
              ref: el.branch_or_tag_name,
              owner: el.owner.toString().toLowerCase(),
              link: el.full_name + '/' + el.branch_or_tag_name,
            };
          })
          .filter(
            (el) =>
              tcReadyRepos.has(getRepoSlug(el.owner, el.name)) &&
              languageResources.some((lang) => lang === el.languageId)
          );
        setResourcesApp((prev) => {
          if (prev && result) {
            prevResources.current = prev;
          }
          return result;
        });
      } catch (err) {
        console.log(err);
        setResourcesApp([]);
        enqueueSnackbar(t('No_resources_found'), { variant: 'warning' });
      }
    };

    fetchResources();
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageResources]);

  useEffect(() => {
    const newResources = findNewResources(prevResources.current, resourcesApp);
    if (newResources?.length > 0) {
      const listOBS = newResources.filter((res) =>
        obsSubjects.includes(res.subject)
      ).length;
      const listBible = newResources.filter((res) =>
        bibleSubjects.includes(res.subject)
      ).length;
      const list = `${t('Added_resources')}.
     ${listBible ? `${t('Bible')}: ${listBible}.` : ''}
    ${listOBS ? `${t('OBS')}: ${listOBS}.` : ''}`;

      enqueueSnackbar(list, { variant: 'info' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourcesApp]);

  let blockLang = '';
  const currentSubjects = bookId === 'obs' ? obsSubjects : bibleSubjects;
  const menuItems = uniqueResources
    .filter((el) => currentSubjects.includes(el.subject))
    .map((el) => {
      if (blockLang !== el.languageId) {
        blockLang = el.languageId;
        return (
          <div key={el.id}>
            <Box
              component="p"
              sx={{
                backgroundColor: theme.palette.background.default,
                margin: 1,
                padding: '8px 16px',
              }}
            >
              {packageLangs(langNames[el.languageId])}
            </Box>
            <MenuItem
              sx={{ whiteSpace: 'break-spaces' }}
              onClick={() => handleAddMaterial(el)}
            >
              {el.title} ({el.owner})
            </MenuItem>
          </div>
        );
      } else {
        return (
          <MenuItem
            sx={{ whiteSpace: 'break-spaces' }}
            key={el.id}
            onClick={() => handleAddMaterial(el)}
          >
            {el.title} ({el.owner})
          </MenuItem>
        );
      }
    });

  const emptyMenuItems = (
    <Box
      component="p"
      sx={{
        backgroundColor: theme.palette.background.default,
        margin: 1,
        padding: '8px 16px',
      }}
    >
      {t('No_resources')}
    </Box>
  );

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  const handleCloseFeedbackDialog = () => {
    setOpenFeedbackDialog(false);
  };

  return (
    <>
      <Menu
        color="transparent"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={onClose}
      >
        <MenuItem button={false}>
          <Button
            onClick={handleOpenDialog}
            startIcon={<LanguageIcon size={'small'} />}
            variant="contained"
            color="secondary"
            size="small"
            fullWidth
          >
            {t('Add_resource_languages')}
          </Button>
        </MenuItem>
        {menuItems.length !== 0 ? menuItems : emptyMenuItems}
      </Menu>
      <FeedbackDialog
        handleCloseDialog={handleCloseFeedbackDialog}
        openFeedbackDialog={openFeedbackDialog}
        title={t('If_no_language')}
      />
      <DialogUI
        title={t('Choose_languages_resources')}
        open={openDialog}
        onClose={handleCloseDialog}
        primary={{ text: t('Ok'), onClick: handleCloseDialog }}
      >
        <SelectResourcesLanguages />
        <Box
          sx={{
            marginTop: 5,
            cursor: 'pointer',
            color: 'gray',
            textDecoration: 'underline',
          }}
          onClick={handleOpenFeedbackDialog}
        >
          {t('If_no_language')}
        </Box>
      </DialogUI>
    </>
  );
}

export default SearchResources;
