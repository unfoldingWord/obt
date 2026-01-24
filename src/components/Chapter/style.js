// Styles migrated to sx prop - this file kept for backward compatibility
export const useCircularStyles = () => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 3,
  },
});
export const useNoContentStyles = () => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '32px 0',
    fontWeight: 'bold',
    height: '100%',
    fontSize: '1.3rem',
  },
});
export default useCircularStyles;
