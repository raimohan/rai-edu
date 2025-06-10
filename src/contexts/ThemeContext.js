import { createContext } from 'react';

export const themeColors = {
  blue: { primary: 'blue-500', light: 'blue-100', text: 'blue-600' },
  red: { primary: 'red-500', light: 'red-100', text: 'red-600' },
  black: { primary: 'gray-900', light: 'gray-200', text: 'gray-800' },
  green: { primary: 'green-500', light: 'green-100', text: 'green-600' },
  yellow: { primary: 'yellow-500', light: 'yellow-100', text: 'yellow-600' },
  purple: { primary: 'purple-500', light: 'purple-100', text: 'purple-600' },
  pink: { primary: 'pink-500', light: 'pink-100', text: 'pink-600' },
};

// Naya badlaav: Humne yahan ek default value di hai taaki app crash na ho
export const ThemeContext = createContext({
    theme: themeColors.blue,
    currentTheme: 'blue',
    setCurrentTheme: () => {}, // ek khaali function
});

