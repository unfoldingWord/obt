import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: '8px !important',
    margin: '0 1px !important',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px !important',
    borderBottomRightRadius: '0 !important',
    overflow: 'hidden',
    backgroundColor: theme.palette.background?.paper || '#fff',
    cursor: 'auto',
  },
  title: {
    color: theme.palette.cardHeaderText?.main || theme.palette.text?.secondary || '#555',
  },
  header: {
    background:
      theme.palette.cardHeaderBg?.main || theme.palette.secondary?.main || '#ffb732',
    padding: '4px',
    color: theme.palette.cardHeaderText?.main || '#023047',
  },
  children: {
    marginTop: '8px',
    lineHeight: '1.25',
  },
  dragIndicator: {
    marginRight: '4px',
    color: theme.palette.cardHeaderText?.main || theme.palette.text?.secondary || '#555',
  },
}));

export default useStyles;
