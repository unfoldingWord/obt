import React, { useCallback, useContext, useRef, useState } from 'react';

import {
  AppBar,
  Box,
  Button,
  IconButton,
  Link,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { AppContext, ReferenceContext } from '../../context';
import {
  About,
  BookSelect,
  ChapterSelect,
  FeedbackDialog,
  SearchResources,
  SelectLanguage,
  SelectModeBible,
  Settings,
  ShowReference,
  WorkspaceManager,
  ProjectorAdd,
} from '../../components';

import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import MailRoundedIcon from '@mui/icons-material/MailRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';

import LogoOBT from './logo_obt.png';
import LogoTT from './logo_tt.png';
import Level from './level.svg';
import Gecraft from './gecraft.svg';
import { useSnackbar } from 'notistack';

function SubMenuBar() {
  const {
    state: { loadIntro, openMainMenu, theme, appConfig },
    actions: { setLoadIntro },
  } = useContext(AppContext);
  const {
    state: {
      referenceSelected: { bookId, chapter, verse },
    },
  } = useContext(ReferenceContext);

  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const menuRef = useRef(null);

  const [anchorMainMenu, setAnchorMainMenu] = useState(null);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const [anchorAddMaterial, setAnchorAddMaterial] = useState(null);
  const [openAbout, setOpenAbout] = useState(false);

  const handleClickAddMaterial = (event) => {
    setAnchorAddMaterial(event.currentTarget);
    handleCloseMainMenu();
  };
  const handleClickMainMenu = (event) => {
    setAnchorMainMenu(event.currentTarget);
  };

  const handleCloseMainMenu = () => {
    setAnchorMainMenu(null);
  };
  const handleCloseAddMaterial = () => {
    setAnchorAddMaterial(null);
  };
  const handleOpenUsersGuide = () => {
    setLoadIntro(true);
    handleCloseMainMenu();
  };
  const handleClickOpenAbout = () => {
    setOpenAbout(true);
  };
  const handleOpenFeedbackDialog = () => {
    setOpenFeedbackDialog(true);
    handleCloseMainMenu();
  };
  const handleCloseFeedbackDialog = () => {
    setOpenFeedbackDialog(false);
  };

  const copyToClipboard = useCallback((text) => {
    return navigator.clipboard.writeText(text).then(
      () => {
        enqueueSnackbar(t('Copied_success'), { variant: 'success' });
      },
      (err) => {
        enqueueSnackbar(t('Copied_error'), { variant: 'error' });
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetResourcesLink = () => {
    const r = appConfig['lg'].map((el) => 'r=' + el.i.split('__').join('/')).join('&');
    // Compress layout data for URL - only encode LG breakpoint for shorter URLs
    const layoutCompressed = encodeURIComponent(btoa(JSON.stringify(appConfig.lg)));
    copyToClipboard(
      `${window.location.origin}/share?${r}&b=${bookId}&c=${chapter}&v=${verse}&l=${layoutCompressed}`
    );
  };

  const anchorEl = loadIntro && anchorMainMenu ? anchorMainMenu : menuRef.current;

  return (
    <AppBar className={'intro-appBar'} position="relative">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box
          component="img"
          sx={{
            height: 64,
          }}
          alt="Open Bible Text"
          src={theme === 'obt' ? LogoOBT : LogoTT}
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <SelectModeBible />
          <ShowReference />
          <ChapterSelect />
          <BookSelect />
        </Box>

        <IconButton
          ref={menuRef}
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleClickMainMenu}
        >
          <MenuIcon />
        </IconButton>

        <Menu
          elevation={0}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorMainMenu) || openMainMenu}
          onClose={handleCloseMainMenu}
          slotProps={{
            paper: {
              sx: {
                boxShadow:
                  '0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12),0 1px 3px 0 rgba(0,0,0,0.14)',
              },
            },
          }}
          PopoverClasses={{ paper: 'intro-hamburger' }}
        >
          <MenuItem button={false} divider={true}>
            <Button
              startIcon={<AddIcon size={'small'} />}
              onClick={handleClickAddMaterial}
              variant="contained"
              color="secondary"
              size="small"
              fullWidth
            >
              {t('Add_resources')}
            </Button>
          </MenuItem>

          <WorkspaceManager onClose={handleCloseMainMenu} />

          <MenuItem button={false} divider={true}>
            <SelectLanguage label={t('Interface_lang')} />
          </MenuItem>

          <Settings setAnchorMainMenu={setAnchorMainMenu} />
          <ProjectorAdd handleCloseMainMenu={handleCloseMainMenu} />

          <MenuItem onClick={handleOpenFeedbackDialog} divider={true}>
            <ListItemIcon>
              <MailRoundedIcon fontSize="small" />
            </ListItemIcon>
            {t('Feedback')}
          </MenuItem>

          <FeedbackDialog
            handleCloseDialog={handleCloseFeedbackDialog}
            openFeedbackDialog={openFeedbackDialog}
            title={t('Write_us')}
          />

          <MenuItem onClick={handleOpenUsersGuide} divider={true}>
            <ListItemIcon>
              <HelpRoundedIcon fontSize="small" />
            </ListItemIcon>
            {t('User_guide')}
          </MenuItem>

          <MenuItem button={false} divider={true}>
            <p style={{ whiteSpace: 'break-spaces' }}>{t('Text_under_checkbox_error')}</p>
          </MenuItem>
          <MenuItem divider={true} onClick={handleGetResourcesLink}>
            <ListItemIcon>
              <ShareRoundedIcon fontSize="small" />
            </ListItemIcon>
            {t('Get_shared_links')}
          </MenuItem>
          <About
            open={openAbout}
            setOpen={setOpenAbout}
            handleClick={handleClickOpenAbout}
          />
          <MenuItem
            divider={true}
            component={Link}
            href={'https://level.bible'}
            target="_blank"
          >
            <ListItemIcon>
              <Box
                component="img"
                sx={{
                  height: 16,
                }}
                alt="Level"
                src={Level}
              />
            </ListItemIcon>
            LEVEL.bible
          </MenuItem>
          <MenuItem component={Link} href={'https://gecraft.com'} target="_blank">
            <ListItemIcon>
              <Box
                component="img"
                sx={{
                  height: 18,
                }}
                alt="Gecraft"
                src={Gecraft}
              />
            </ListItemIcon>
            <div>
              <span>Powered by </span>
              <span style={{ color: '#358d62' }}>Gecraft</span>
            </div>
          </MenuItem>
        </Menu>
        <SearchResources
          anchorEl={anchorAddMaterial}
          onClose={handleCloseAddMaterial}
          open={Boolean(anchorAddMaterial)}
        />
      </Toolbar>
    </AppBar>
  );
}

export default SubMenuBar;
