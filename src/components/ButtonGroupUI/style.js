// Styles migrated to sx prop - this file kept for backward compatibility
export const useStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    '& > *': {
      margin: 0,
    },
  },
});

export const useButtonStyles = () => ({
  root: {
    fontWeight: 'bold',
  },
});
