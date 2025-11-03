// src/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f7fafc',   // พื้นหลังนอกสุด (อ่อน)
      paper: '#ffffff',     // การ์ด/กล่องฟอร์ม
    },
    divider: 'rgba(0,0,0,0.08)',
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { color: 'rgba(0,0,0,0.88)' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
        },
        input: {
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { color: 'rgba(0,0,0,0.55)' } },
    },
    MuiDivider: {
      styleOverrides: { root: { opacity: 1 } },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});
