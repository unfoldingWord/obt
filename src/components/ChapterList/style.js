// Styles migrated to sx prop - this file kept for backward compatibility
// Breakpoints should be used directly in sx prop
const useStyles = () => ({
  chapterList: {
    margin: 1,
    columnGap: 3,
    // Breakpoints handled in sx prop
  },
});

export const useButtonStyles = () => ({
  root: {
    display: 'flex',
    minWidth: 'inherit',
  },
});

export default useStyles;
