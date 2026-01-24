// Styles migrated to sx prop - this file kept for backward compatibility
// Breakpoints should be used directly in sx prop
export const useStyles = () => ({
  bookList: {
    margin: 1,
    columnGap: 3,
    // Breakpoints handled in sx prop: xs: { columnCount: 1 }, sm: { columnCount: 2 }, etc.
  },
});

export const useBookStyles = () => ({
  root: {
    display: 'flex',
    minWidth: 'inherit',
  },
});
