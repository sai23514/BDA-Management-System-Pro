import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ThemeProvider, CssBaseline, type PaletteMode } from '@mui/material';
import { buildTheme } from '../theme';

interface ColorModeContextValue {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => undefined,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useColorMode = (): ColorModeContextValue => useContext(ColorModeContext);

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>(
    () => (localStorage.getItem('colorMode') as PaletteMode | null) ?? 'light',
  );

  const contextValue = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((prev) => {
          const next: PaletteMode = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem('colorMode', next);
          return next;
        }),
    }),
    [mode],
  );

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
