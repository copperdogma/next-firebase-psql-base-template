'use client';

import { createTheme, responsiveFontSizes, ThemeOptions } from '@mui/material/styles';
import { red, blue, grey, lightBlue } from '@mui/material/colors';
import { PaletteMode, Theme } from '@mui/material';

/**
 * Define spacing constants for consistent use throughout the app
 * These will be referenced in the theme
 */
const SPACING_UNIT = 8;

/**
 * Enhanced color palette with better contrast for accessibility
 */
const PALETTE = {
  light: {
    primary: {
      main: blue[700], // Good contrast with white
      dark: blue[800],
      light: blue[500],
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1e88e5',
      dark: '#0d47a1',
      light: '#4791db',
      contrastText: '#ffffff',
    },
    error: {
      main: red[700],
      dark: red[900],
      light: red[500],
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121', // Darker for better readability
      secondary: '#424242', // Darker for better contrast
    },
    divider: grey[300],
    action: {
      active: 'rgba(0, 0, 0, 0.7)', // Darker for better visibility
      hover: 'rgba(0, 0, 0, 0.1)',
      selected: 'rgba(0, 0, 0, 0.15)',
    },
  },
  dark: {
    primary: {
      main: lightBlue[300], // Lighter blue for dark mode - better contrast
      dark: lightBlue[400],
      light: lightBlue[200],
      contrastText: '#000000', // Black text on light blue
    },
    secondary: {
      main: '#64b5f6', // Lighter blue for dark mode
      dark: '#42a5f5',
      light: '#90caf9',
      contrastText: '#000000',
    },
    error: {
      main: red[400], // Lighter red for dark mode
      dark: red[500],
      light: red[300],
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5', // Lighter for better visibility on dark backgrounds
    },
    divider: grey[700],
    action: {
      active: 'rgba(255, 255, 255, 0.7)', // Brighter for better visibility in dark mode
      hover: 'rgba(255, 255, 255, 0.1)',
      selected: 'rgba(255, 255, 255, 0.15)',
    },
  },
};

// Create a theme instance for each mode
const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  // Set consistent spacing
  spacing: SPACING_UNIT,

  palette: {
    mode,
    ...(mode === 'light' ? PALETTE.light : PALETTE.dark),
  },

  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.02857em',
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'dark' ? '#6b6b6b #2b2b2b' : '#959595 #f5f5f5',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
            backgroundColor: mode === 'dark' ? '#2b2b2b' : '#f5f5f5',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: mode === 'dark' ? '#6b6b6b' : '#959595',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
            backgroundColor: mode === 'dark' ? '#818181' : '#bdbdbd',
          },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
            backgroundColor: mode === 'dark' ? '#818181' : '#bdbdbd',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: mode === 'dark' ? '#818181' : '#bdbdbd',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s',
          fontWeight: 500,
        },
        contained: ({ theme }: { theme: Theme }) => ({
          boxShadow: theme.shadows[1],
          '&:hover': {
            boxShadow: theme.shadows[2],
          },
        }),
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
        // Improve focus visibility for accessibility
        sizeMedium: {
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: mode === 'light' ? PALETTE.light.primary.main : PALETTE.dark.primary.main,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow:
            mode === 'dark' ? '0px 2px 8px rgba(0, 0, 0, 0.5)' : '0px 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          boxShadow: theme.shadows[1],
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow:
            mode === 'dark' ? '0px 3px 15px rgba(0, 0, 0, 0.4)' : '0px 3px 15px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 8,
          // Improve focus visibility for accessibility
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: mode === 'light' ? PALETTE.light.primary.main : PALETTE.dark.primary.main,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingBottom: 24,
          paddingTop: 24,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          // Ensure proper text contrast in filled and outlined variants
          '& .MuiInputBase-input': {
            color: mode === 'dark' ? PALETTE.dark.text.primary : PALETTE.light.text.primary,
          },
          // Improve focus states for accessibility
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          // Ensure proper label contrast
          color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          '&.Mui-focused': {
            color: mode === 'dark' ? PALETTE.dark.primary.main : PALETTE.light.primary.main,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          // Improve link visibility
          color: mode === 'dark' ? PALETTE.dark.primary.main : PALETTE.light.primary.main,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
          // Improve focus visibility for accessibility
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: mode === 'light' ? PALETTE.light.primary.main : PALETTE.dark.primary.main,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          // Improve divider visibility
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
});

// Create responsive themes for light and dark modes
export const lightTheme = responsiveFontSizes(createTheme(getDesignTokens('light')));

export const darkTheme = responsiveFontSizes(createTheme(getDesignTokens('dark')));

// Export the spacing unit for consistent use in custom styles
export const SPACING = SPACING_UNIT;

// Use a theme provider to switch between light and dark modes
