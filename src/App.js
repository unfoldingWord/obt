import React, { useContext } from 'react';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { ThemeProvider as V4ThemeProvider } from '@material-ui/core/styles';

import { AppContext } from './context';
import {
  Shortcut,
  Swipes,
  Intro,
  TypoReport,
  SubMenuBar,
  StartDialog,
} from './components';
import WorkSpaceWrap from './WorkSpaceWrap';

import { themes } from './themes';
import './styles/app.css';
import { LinkDialog } from './components';

//const Intro = React.lazy(() => import('./components/Intro/Intro'));
//const Card = React.lazy(() => import('./components/Card/Card'));
//const TypoReport = React.lazy(() => import('./components/TypoReport/TypoReport'));
//const SubMenuBar = React.lazy(() => import('./components/SubMenuBar/SubMenuBar'));

export default function App() {
  const {
    state: { theme },
  } = useContext(AppContext);

  Shortcut();
  Swipes();
  return (
    <ThemeProvider theme={themes[theme]}>
      <V4ThemeProvider theme={themes[theme]}>
        <CssBaseline />
        <StartDialog />
        <Intro />
        <SubMenuBar />
        <TypoReport />
        <WorkSpaceWrap />
        <LinkDialog />
      </V4ThemeProvider>
    </ThemeProvider>
  );
}
