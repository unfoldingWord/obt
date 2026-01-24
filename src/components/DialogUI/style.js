// Styles migrated to sx prop - this file kept for backward compatibility
// Components should use sx prop directly instead of these classes
const useLocalTitleStyles = () => ({
  root: {
    margin: 0,
    padding: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 1,
    top: 1,
    color: 'grey.500',
  },
  buttons: {
    marginBottom: 1,
    marginRight: 1,
  },
  draggable: {
    cursor: 'move',
  },
  undraggable: {
    cursor: 'default',
  },
});

export default useLocalTitleStyles;
