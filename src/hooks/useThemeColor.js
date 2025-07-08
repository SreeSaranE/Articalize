import { useColorScheme } from 'react-native';

export default function useThemeColor() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    isDark,
    backgroundColor: isDark ? '#000' : '#fff',
    textColor: isDark ? '#fff' : '#000',
    inputBackground: isDark ? '#1a1a1a' : '#f0f0f0',
    borderColor: isDark ? '#333' : '#ccc',
  };
}
