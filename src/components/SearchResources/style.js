// Styles migrated to sx prop - this file kept for backward compatibility
// Components should use sx prop directly instead of these classes
export const useStyles = () => ({
  divider: {
    backgroundColor: 'background.default',
    margin: 1,
    padding: '8px 16px',
  },
  menu: { whiteSpace: 'break-spaces' },
  link: {
    marginTop: 5,
    cursor: 'pointer',
    color: 'gray',
    textDecoration: 'underline',
  },
});
