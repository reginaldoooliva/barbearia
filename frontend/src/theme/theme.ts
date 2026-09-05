// Sistema de design da Barbershop — inspirado em barbearias clássicas:
// paleta escura (couro/carvão), dourado como cor de destaque (latão),
// tipografia condensada em pôster para títulos.

export const colors = {
  background: '#141110',
  surface: '#1D1917',
  surfaceAlt: '#252019',
  border: '#332C24',

  primary: '#C9A15A', // dourado/latão
  primaryDark: '#A6813F',
  onPrimary: '#141110',

  accent: '#8C2F39', // vermelho poste de barbearia
  onAccent: '#F5EFE6',

  textPrimary: '#F5EFE6',
  textSecondary: '#B9AD9B',
  textMuted: '#7C7263',

  success: '#4C9A6A',
  warning: '#C9A15A',
  danger: '#B4453F',

  white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'BebasNeue_400Regular',
  bodyRegular: 'SourceSans3_400Regular',
  bodyMedium: 'SourceSans3_500Medium',
  bodySemibold: 'SourceSans3_600SemiBold',
  bodyBold: 'SourceSans3_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const statusColors: Record<string, string> = {
  RESERVADO: colors.warning,
  CONFIRMADO: colors.success,
  CANCELADO: colors.danger,
};

export const statusLabels: Record<string, string> = {
  RESERVADO: 'Reservado',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
};
