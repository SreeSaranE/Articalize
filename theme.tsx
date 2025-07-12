import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

export const LightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: '#FFFFFF',
    text: '#000000',
    card: '#F0F0F0',
    primary: '#007BFF',
  },
};

export const DarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: '#121212',
    text: '#FFFFFF',
    card: '#1E1E1E',
    primary: '#1E90FF',
  },
};
