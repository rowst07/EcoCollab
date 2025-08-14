import { THEME, ThemeName } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';


export function useThemeColor(name: keyof typeof THEME.light) {
  const scheme: ThemeName = useColorScheme();
  return THEME[scheme][name];
}

export function useTheme() {
  const scheme: ThemeName = useColorScheme();
  return THEME[scheme];
}
