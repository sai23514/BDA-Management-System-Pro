import { createTheme, type Theme, type ThemeOptions, type PaletteMode } from '@mui/material';

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: { main: '#4f46e5', light: '#818cf8', dark: '#3730a3' },
    secondary: { main: '#ec4899' },
    success: { main: '#16a34a' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#0ea5e9' },
    ...(mode === 'light'
      ? {
          background: { default: '#f4f6fb', paper: '#ffffff' },
          text: { primary: '#1e293b', secondary: '#64748b' },
        }
      : {
          background: { default: '#0f172a', paper: '#1e293b' },
          text: { primary: '#f1f5f9', secondary: '#94a3b8' },
        }),
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
});

export const buildTheme = (mode: PaletteMode): Theme => createTheme(getDesignTokens(mode));
