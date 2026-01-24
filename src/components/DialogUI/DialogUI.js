import React from 'react';

import PropTypes from 'prop-types';

import Draggable from 'react-draggable';

import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  DialogTitle,
  IconButton,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';

import { Paper } from 'translation-helps-rcl/dist/components';

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
      bounds="parent"
    >
      <Paper {...props} />
    </Draggable>
  );
}

function DialogUI({
  primary = { text: false, onClick: false, disabled: false },
  secondary = { text: false, onClick: false, disabled: false },
  classes = {},
  maxWidth = 'md',
  title = false,
  children,
  open,
  onClose,
  isClosable = true,
  draggable = true,
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Dialog
      classes={classes.root}
      open={open}
      fullWidth={true}
      maxWidth={maxWidth}
      onClose={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClose(e);
      }}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
    >
      {title && (
        <>
          <DialogTitle
            sx={{
              margin: 0,
              padding: 2,
              cursor: draggable ? 'move' : 'default',
            }}
            id={draggable ? 'draggable-dialog-title' : ''}
          >
            {title}
          </DialogTitle>
          {isClosable && (
            <IconButton
              aria-label="close"
              sx={{
                position: 'absolute',
                right: theme.spacing(1),
                top: theme.spacing(1),
                color: theme.palette.grey[500],
              }}
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          )}
        </>
      )}
      <DialogContent className={classes.content}>{children}</DialogContent>
      {(primary?.onClick || secondary?.onClick) && (
        <DialogActions sx={{ marginBottom: 1, marginRight: 1 }}>
          {secondary?.onClick && (
            <Button
              onClick={secondary.onClick}
              variant={'contained'}
              disabled={secondary.disabled ?? false}
            >
              {secondary?.text ?? t('Cancel')}
            </Button>
          )}
          {primary?.onClick && (
            <Button
              onClick={primary.onClick}
              color={'primary'}
              variant={'contained'}
              disabled={primary.disabled ?? false}
            >
              {primary?.text ?? t('Apply')}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

export default DialogUI;

DialogUI.defaultProps = {
  primary: { text: false, onClick: false, disabled: false },
  secondary: { text: false, onClick: false, disabled: false },
  classes: {},
  maxWidth: 'md',
  title: false,
  open: false,
  isClosable: true,
};

DialogUI.propTypes = {
  primary: PropTypes.shape({
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    onClick: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
    disabled: PropTypes.bool,
  }),
  secondary: PropTypes.shape({
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    onClick: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
    disabled: PropTypes.bool,
  }),
  maxWidth: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  isClosable: PropTypes.bool,
  classes: PropTypes.object,
  children: PropTypes.any,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};
