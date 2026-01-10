/**
 * Configurações centralizadas para o sistema de alertas
 */

export const ALERT_CONFIG = {
  // Limites de tempo
  DIAS_ATRASO_LIMITE: 0,
  DIAS_PARADA_LIMITE: 7,
  
  // Identificadores
  CATEGORIA_EXPEDICAO_NOME: 'expedi',
  
  // Tipos de alerta
  ALERT_TYPES: {
    ATRASO: 'atraso',
    INATIVIDADE: 'inatividade',
    SEGURO: 'seguro',
    TRANSPORTE: 'transporte'
  },
  
  // Status de OS
  STATUS_ATIVOS: ['elaboracao', 'execucao'],
  STATUS_INATIVOS: ['concluido', 'cancelado'],
  
  // Configurações de e-mail
  EMAIL_FROM_NAME: 'AlmoxHub - Sistema de Alertas',
  
  // Rate limiting
  MAX_REQUESTS_PER_HOUR: 5,
  RATE_LIMIT_WINDOW: 3600000 // 1 hora em ms
};

/**
 * Configurações de cores e estilos para cada tipo de alerta
 */
export const ALERT_STYLES = {
  atraso: {
    emoji: '⚠️',
    titulo: 'Alerta de Atraso',
    subtitulo: 'Ordem de Serviço Atrasada',
    corPrimaria: '#dc2626',
    corSecundaria: '#991b1b',
    corFundo: '#fef2f2',
    corBorda: '#dc2626'
  },
  inatividade: {
    emoji: '📊',
    titulo: 'Alerta de Inatividade',
    subtitulo: 'OS sem Movimentação',
    corPrimaria: '#f59e0b',
    corSecundaria: '#d97706',
    corFundo: '#fffbeb',
    corBorda: '#f59e0b'
  },
  seguro: {
    emoji: '🛡️',
    titulo: 'Alerta de Seguro',
    subtitulo: 'Expedição sem Cobertura',
    corPrimaria: '#3b82f6',
    corSecundaria: '#1d4ed8',
    corFundo: '#eff6ff',
    corBorda: '#3b82f6'
  },
  transporte: {
    emoji: '🚚',
    titulo: 'Alerta de Transporte',
    subtitulo: 'Expedição sem Transporte',
    corPrimaria: '#6366f1',
    corSecundaria: '#4f46e5',
    corFundo: '#eef2ff',
    corBorda: '#6366f1'
  }
};