import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5E9278', // Verde salvia
    },
    secondary: {
      main: '#E4DCCF', // Beige
    },
    background: {
      default: '#F6F5F3',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2E2E2E',
      secondary: '#6B6B6B',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
    fontSize: 14,
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#2E2E2E',
          boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.06)',
          borderRadius: '0 0 12px 12px',
          margin: '12px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          textTransform: 'none',
        },
      },
    },
  },
});

export default theme;
