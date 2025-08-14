// constants/colors.ts

export type ThemeName = 'light' | 'dark';

export const BRAND = {
  primary: '#2E7D32',   // verde da app (ações principais)
  danger:  '#D32F2F',   // vermelho (cancelar/erro)
  accent:  '#EA3323',   // vermelho-acento (upload antigo, se precisares)
  star:    '#FFA000',   // classificação
};

// Cores por tipo de resíduo (constantes, iguais em ambos os temas)
export const RESIDUE_COLORS: Record<string, string> = {
  papel:    '#2196F3',  // azul
  plastico: '#FFEB3B',  // amarelo
  vidro:    '#4CAF50',  // verde
  pilhas:   '#F44336',  // vermelho
  organico: '#795548',  // castanho
  metal:    '#9E9E9E',  // cinza
  outros:   '#9C27B0',  // roxo
};

// Paletas de interface (light e dark) alinhadas com o que já tens
export const THEME = {
  light: {
    bg:        '#FFFFFF',
    card:      '#FFFFFF',
    overlay:   '#00000099',
    border:    '#EEEEEE',
    hairline:  '#F0F0F0',
    input:     '#FFFFFF',
    inputBorder: '#DDDDDD',

    text:      '#111111',
    textInput: '#333333',
    textMuted: '#666666',
    icon:      '#888888',

    primary:   BRAND.primary,
    danger:    BRAND.danger,
    star:      BRAND.star,
  },
  dark: {
    bg:        '#000000',
    card:      '#262626ff',
    overlay:   '#00000099',
    border:    '#18181B',
    hairline:  '#18181B',
    input:     '#EEEDD7',
    inputBorder: '#262626',

    text:      '#E5E7EB',
    textInput: '#EEEDD7',
    textMuted: '#9CA3AF',
    icon:      '#E5E7EB',

    primary:   BRAND.primary,
    danger:    BRAND.danger,
    star:      BRAND.star,
  },
} as const;

// ----- Map styles (Google/Apple no react-native-maps) -----
export const MAP_STYLE = {
  light: [] as any[], // estilo default
  dark: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
  ] as any[],
};
