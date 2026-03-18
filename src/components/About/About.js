import React, { useState, useEffect } from 'react';

import ReactMarkdown from 'react-markdown';
import { ListItemIcon, MenuItem } from '@mui/material';

import { DialogUI } from '../../components';

import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

import changeLog from '../../docs/CHANGELOG.md';
import packageJson from '../../../package.json';

function About({ open, setOpen, handleClick }) {
  const [log, setLog] = useState();

  useEffect(() => {
    fetch(changeLog)
      .then((response) => response.text())
      .then((text) => {
        setLog({ text: text });
      });
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const textLabel = packageJson
    ? `v${packageJson?.version}`
    : `Information about application`;

  return (
    <>
      <MenuItem onClick={handleClick} divider={true}>
        <ListItemIcon>
          <InfoRoundedIcon fontSize="small" />
        </ListItemIcon>
        {textLabel}
      </MenuItem>
      <DialogUI
        open={open}
        maxWidth={'sm'}
        onClose={handleClose}
        title={`About v${packageJson?.version}`}
      >
        {packageJson?.description}
        <ReactMarkdown className={'md'}>
          {log ? log.text : 'Version of application'}
        </ReactMarkdown>
      </DialogUI>
    </>
  );
}

export default About;
