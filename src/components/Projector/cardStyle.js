// Styles migrated to sx prop - this file kept for backward compatibility
export const useStyles = () => ({
  select: { maxWidth: '100%', marginBottom: 2 },
  boxWrap: {
    marginBottom: 2,
    width: '320px',
    height: '180px',
    background: 'background.default',
    border: '1px solid #ccc',
  },
  iframeWrap: {
    width: '100%',
    height: '100%',
    display: 'flex',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iframe: {
    border: 'none',
    background: 'background.paper',
  },
  fontWrap: {
    marginTop: 1,
    width: '300px',
    marginBottom: 2,
  },
  settingsWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 0,
    position: 'relative',
  },
});

export default useStyles;
