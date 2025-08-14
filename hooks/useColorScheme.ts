import { useColorScheme as _useColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const system = _useColorScheme();
  return system ?? 'dark';
}
