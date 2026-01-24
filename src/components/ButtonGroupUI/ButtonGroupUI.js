import React from 'react';

import { ButtonGroup, Button, Box } from '@mui/material';

export default function ButtonGroupUI({
  buttons = [],
  buttonGroupProps = {},
  style = {},
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '& > *': {
          margin: 0,
        },
        ...style,
      }}
    >
      <ButtonGroup {...buttonGroupProps}>
        {buttons.map((el, index) => (
          <Button key={index} sx={{ fontWeight: 'bold' }} onClick={el.onClick}>
            {el.title}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}
