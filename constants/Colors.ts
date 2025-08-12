// src/theme.ts

export type ThemeMode = 'light' | 'dark';

/** 1) Cores dos tipos de resíduos (globais) */
export const RESIDUO_CORES: Record<string, string> = {
  papel:    '#2196F3',
  plastico: '#FFEB3B',
  vidro:    '#4CAF50',
  pilhas:   '#F44336',
  organico: '#795548',
  metal:    '#9E9E9E',
  outros:   '#9C27B0'
};

/** 2) Paletas de cor Light/Dark (alinhadas com o teu design atual) */
export const THEME = {
  light: {
    mode: 'light' as ThemeMode,
    // Base
    background: '#FFFFFF',
    headerBg:   '#000000',
    cardBg:     '#FFFFFF',
    border:     '#EEEEEE',

    // Texto
    text:       '#111111',
    textMuted:  '#666666',

    // Inputs / barras
    inputBg:    '#000000', // para manter o estilo dos teus inputs “escuros” no light (login style)
    inputText:  '#FFFFFF',
    searchBg:   '#FFFFFF',
    searchBorder: '#CCCCCC',

    // Ações
    primary:    '#2E7D32', // verde
    danger:     '#D32F2F', // vermelho
    accent:     '#000000',

    // Chips/Badges
    chipBg:     '#F6F6F6',
    chipBorder: '#EEEEEE',

    // Callouts
    calloutBg:  '#FFFFFF',
  },

  dark: {
    mode: 'dark' as ThemeMode,
    // Base
    background: '#000000',
    headerBg:   '#000000',
    cardBg:     '#0B0B0B',
    border:     '#18181B',

    // Texto
    text:       '#E5E7EB',
    textMuted:  '#9CA3AF',

    // Inputs / barras
    inputBg:    '#111111',
    inputText:  '#E5E7EB',
    searchBg:   '#111111',
    searchBorder: '#262626',

    // Ações
    primary:    '#2E7D32',
    danger:     '#D32F2F',
    accent:     '#FFFFFF',

    // Chips/Badges
    chipBg:     '#111111',
    chipBorder: '#262626',

    // Callouts
    calloutBg:  '#0B0B0B',
  }
} as const;

export type AppTheme = typeof THEME.dark;

/** Helper simples: devolve a paleta pela mode (default: dark) */
export const getTheme = (mode: ThemeMode = 'dark'): AppTheme => THEME[mode];


/** 3) (Opcional) Estilo de mapa escuro para react-native-maps */
export const MAP_STYLE_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a3a3a3' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3a3a3a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#223322' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#3a3a3a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#444444' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1a26' }] }
];
