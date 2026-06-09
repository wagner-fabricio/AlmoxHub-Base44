// Paleta de cores Axia suave — padrão visual elegante e uniforme para os relatórios gerenciais.
// Inspirada nas cores oficiais Axia (#0000FF azul forte, #FF6B00 laranja, #0A003C azul escuro,
// #A0B4D2 azul acinzentado) mas com tons suavizados para um look executivo e moderno.

export const AXIA = {
  // Primário Axia suavizado (substitui o azul puro #0000FF)
  primary: '#4F6BED',
  primaryLight: '#A5B4FC',
  primarySoft: '#E0E7FF',
  primaryDark: '#0A003C',

  // Accent Axia suavizado (substitui o laranja puro #FF6B00)
  accent: '#F59E0B',
  accentLight: '#FDBA74',
  accentSoft: '#FED7AA',

  // Azul acinzentado Axia (mantido — já é suave)
  blueGray: '#A0B4D2',
  blueGrayDark: '#7A95BA',

  // Status — tons suaves
  success: '#34D399',     // verde suave
  successDark: '#10B981',
  warning: '#FBBF24',     // amarelo suave
  warningDark: '#F59E0B',
  danger: '#F87171',      // vermelho suave
  dangerDark: '#EF4444',

  // Apoio
  indigo: '#818CF8',
  purple: '#A78BFA',
  cyan: '#67E8F9',
  pink: '#F9A8D4',
  neutral: '#94A3B8',
  neutralLight: '#CBD5E1',
};

// Paleta sequencial para gráficos com múltiplas séries (categorias, almoxarifados, etc.)
export const AXIA_PALETTE = [
  AXIA.primary,        // #4F6BED — azul Axia suave
  AXIA.accent,         // #F59E0B — laranja Axia suave
  AXIA.success,        // #34D399 — verde
  AXIA.blueGray,       // #A0B4D2 — azul acinzentado Axia
  AXIA.indigo,         // #818CF8
  AXIA.purple,         // #A78BFA
  AXIA.cyan,           // #67E8F9
  AXIA.warning,        // #FBBF24
  AXIA.pink,           // #F9A8D4
  AXIA.primaryLight,   // #A5B4FC
];

// Cores semânticas para status de OS
export const STATUS_COLORS = {
  elaboracao: AXIA.neutral,        // cinza
  execucao: AXIA.primary,          // azul Axia
  concluido: AXIA.success,         // verde
  cancelado: AXIA.danger,          // vermelho suave
};

// Cores para gráficos de recebimento
export const RECEBIMENTO_COLORS = {
  conformes: AXIA.success,
  comProblemas: AXIA.danger,
  pendentes: AXIA.warning,
};