// Styles migrated to sx prop - this file kept for backward compatibility
export const useStyles = () => ({
  link: {
    cursor: 'pointer',
    color: 'primary.main',
    display: 'inline-block',
    '&:hover': { textDecoration: 'underline' },
  },
});

export default useStyles;
