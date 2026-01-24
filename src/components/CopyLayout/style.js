// Styles migrated to sx prop - this file kept for backward compatibility
export const useStyles = () => ({
  menuItemLayoutList: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  elementNameLayoutList: {
    whiteSpace: 'normal',
    maxWidth: 416, // 52 * 8
  },

  copyIcon: {
    marginLeft: 2,
    '&:hover': {
      color: 'info.main',
    },
  },

  deleteIcon: {
    '&:hover': {
      color: 'error.main',
    },
  },

  select: {
    width: 216, // 27 * 8
  },
  textField: {
    width: '210px',
  },
});
