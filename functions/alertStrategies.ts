import { ALERT_CONFIG, ALERT_STYLES } from './alertConfig.js';
import { 
  gerarTemplateAlertaAtraso, 
  gerarTemplateAlertaInatividade,
  gerarTemplateAlertaSeguro,
  gerarTemplateAlertaTransporte 
} from './emailTemplates.js';
import { enviarNotificacaoEmail, validarOrdem } from './notificationService.js';
import { logEstruturado } from './utils/logging.js';

/**
 * Processa ordens atrasadas
 */
export async function processarOrdensAtrasadas(base44, ordens, pessoasMap) {
  const hoje = new Date();
  const resultados = { total: 0, processadas: 0, erros: [] };
  
  // Filtrar ordens atrasadas
  const ordensAtrasadas = ordens.filter(os => {
    const validacao = validarOrdem(os);
    if (!validacao.valid) return false;
    
    return (
      os.prazo &&
      !ALERT_CONFIG.STATUS_INATIVOS.includes(os.status) &&
      new Date(os.prazo) < hoje
    );
  });
  
  resultados.total = ordensAtrasadas.length;
  
  logEstruturado('INFO', 'processarOrdensAtrasadas', 
    { total: resultados.total }, 
    'Iniciando processamento de ordens atrasadas');
  
  for (const os of ordensAtrasadas) {
    const lider = pessoasMap.get(os.lider_id);
    
    if (!lider) {
      resultados.erros.push({
        osId: os.id,
        tipo: ALERT_CONFIG.ALERT_TYPES.ATRASO,
        erro: 'Líder não encontrado'
      });
      continue;
    }
    
    const diasAtraso = Math.floor((hoje - new Date(os.prazo)) / (1000 * 60 * 60 * 24));
    
    const resultado = await enviarNotificacaoEmail({
      base44,
      destinatario: lider,
      tipo: ALERT_CONFIG.ALERT_TYPES.ATRASO,
      assunto: `${ALERT_STYLES.atraso.emoji} URGENTE: OS ${os.codigo} está atrasada`,
      corpo: gerarTemplateAlertaAtraso(lider, os, diasAtraso),
      referencia_id: os.id,
      referencia_tipo: 'tarefa',
      mensagem: `A OS ${os.codigo} está ${diasAtraso} dia${diasAtraso > 1 ? 's' : ''} atrasada`
    });
    
    if (resultado.success && !resultado.skipped) {
      resultados.processadas++;
    } else if (!resultado.success) {
      resultados.erros.push({
        osId: os.id,
        liderEmail: lider.email,
        tipo: ALERT_CONFIG.ALERT_TYPES.ATRASO,
        erro: resultado.error
      });
    }
  }
  
  logEstruturado('INFO', 'processarOrdensAtrasadas', resultados, 'Processamento concluído');
  return resultados;
}

/**
 * Processa ordens paradas/inativas
 */
export async function processarOrdensParadas(base44, ordens, pessoasMap) {
  const hoje = new Date();
  const resultados = { total: 0, processadas: 0, erros: [] };
  
  const ordensParadas = ordens.filter(os => {
    const validacao = validarOrdem(os);
    if (!validacao.valid) return false;
    
    if (!os.updated_date) return false;
    
    const diasParada = Math.floor((hoje - new Date(os.updated_date)) / (1000 * 60 * 60 * 24));
    
    return (
      !ALERT_CONFIG.STATUS_INATIVOS.includes(os.status) &&
      diasParada > ALERT_CONFIG.DIAS_PARADA_LIMITE
    );
  });
  
  resultados.total = ordensParadas.length;
  
  logEstruturado('INFO', 'processarOrdensParadas', 
    { total: resultados.total }, 
    'Iniciando processamento de ordens paradas');
  
  for (const os of ordensParadas) {
    const lider = pessoasMap.get(os.lider_id);
    
    if (!lider) {
      resultados.erros.push({
        osId: os.id,
        tipo: ALERT_CONFIG.ALERT_TYPES.INATIVIDADE,
        erro: 'Líder não encontrado'
      });
      continue;
    }
    
    const diasParada = Math.floor((hoje - new Date(os.updated_date)) / (1000 * 60 * 60 * 24));
    
    const resultado = await enviarNotificacaoEmail({
      base44,
      destinatario: lider,
      tipo: ALERT_CONFIG.ALERT_TYPES.INATIVIDADE,
      assunto: `${ALERT_STYLES.inatividade.emoji} OS ${os.codigo} sem movimentação há ${diasParada} dias`,
      corpo: gerarTemplateAlertaInatividade(lider, os, diasParada),
      referencia_id: os.id,
      referencia_tipo: 'tarefa',
      mensagem: `A OS ${os.codigo} está sem movimentação há ${diasParada} dias`
    });
    
    if (resultado.success && !resultado.skipped) {
      resultados.processadas++;
    } else if (!resultado.success) {
      resultados.erros.push({
        osId: os.id,
        liderEmail: lider.email,
        tipo: ALERT_CONFIG.ALERT_TYPES.INATIVIDADE,
        erro: resultado.error
      });
    }
  }
  
  logEstruturado('INFO', 'processarOrdensParadas', resultados, 'Processamento concluído');
  return resultados;
}

/**
 * Processa expedições sem seguro
 */
export async function processarExpedicoesSemSeguro(base44, ordens, pessoasMap, categoriaExpedicao) {
  const resultados = { total: 0, processadas: 0, erros: [] };
  
  if (!categoriaExpedicao) {
    logEstruturado('WARN', 'processarExpedicoesSemSeguro', {}, 'Categoria de expedição não encontrada');
    return resultados;
  }
  
  const expedicoesSemSeguro = ordens.filter(os => {
    const validacao = validarOrdem(os);
    if (!validacao.valid) return false;
    
    return (
      os.categoria_id === categoriaExpedicao.id &&
      !ALERT_CONFIG.STATUS_INATIVOS.includes(os.status) &&
      Array.isArray(os.detalhamento_expedicao) &&
      os.detalhamento_expedicao.some(exp => !exp.usar_seguro)
    );
  });
  
  resultados.total = expedicoesSemSeguro.length;
  
  logEstruturado('INFO', 'processarExpedicoesSemSeguro', 
    { total: resultados.total }, 
    'Iniciando processamento de expedições sem seguro');
  
  for (const os of expedicoesSemSeguro) {
    const lider = pessoasMap.get(os.lider_id);
    
    if (!lider) {
      resultados.erros.push({
        osId: os.id,
        tipo: ALERT_CONFIG.ALERT_TYPES.SEGURO,
        erro: 'Líder não encontrado'
      });
      continue;
    }
    
    const resultado = await enviarNotificacaoEmail({
      base44,
      destinatario: lider,
      tipo: ALERT_CONFIG.ALERT_TYPES.SEGURO,
      assunto: `${ALERT_STYLES.seguro.emoji} Expedição ${os.codigo} sem cobertura de seguro`,
      corpo: gerarTemplateAlertaSeguro(lider, os),
      referencia_id: os.id,
      referencia_tipo: 'tarefa',
      mensagem: `A expedição ${os.codigo} está sem cobertura de seguro`
    });
    
    if (resultado.success && !resultado.skipped) {
      resultados.processadas++;
    } else if (!resultado.success) {
      resultados.erros.push({
        osId: os.id,
        liderEmail: lider.email,
        tipo: ALERT_CONFIG.ALERT_TYPES.SEGURO,
        erro: resultado.error
      });
    }
  }
  
  logEstruturado('INFO', 'processarExpedicoesSemSeguro', resultados, 'Processamento concluído');
  return resultados;
}

/**
 * Processa expedições sem transporte
 */
export async function processarExpedicoesSemTransporte(base44, ordens, pessoasMap, categoriaExpedicao) {
  const resultados = { total: 0, processadas: 0, erros: [] };
  
  if (!categoriaExpedicao) {
    logEstruturado('WARN', 'processarExpedicoesSemTransporte', {}, 'Categoria de expedição não encontrada');
    return resultados;
  }
  
  const expedicoesSemTransporte = ordens.filter(os => {
    const validacao = validarOrdem(os);
    if (!validacao.valid) return false;
    
    return (
      os.categoria_id === categoriaExpedicao.id &&
      !ALERT_CONFIG.STATUS_INATIVOS.includes(os.status) &&
      (!os.detalhamento_expedicao || os.detalhamento_expedicao.length === 0)
    );
  });
  
  resultados.total = expedicoesSemTransporte.length;
  
  logEstruturado('INFO', 'processarExpedicoesSemTransporte', 
    { total: resultados.total }, 
    'Iniciando processamento de expedições sem transporte');
  
  for (const os of expedicoesSemTransporte) {
    const lider = pessoasMap.get(os.lider_id);
    
    if (!lider) {
      resultados.erros.push({
        osId: os.id,
        tipo: ALERT_CONFIG.ALERT_TYPES.TRANSPORTE,
        erro: 'Líder não encontrado'
      });
      continue;
    }
    
    const resultado = await enviarNotificacaoEmail({
      base44,
      destinatario: lider,
      tipo: ALERT_CONFIG.ALERT_TYPES.TRANSPORTE,
      assunto: `${ALERT_STYLES.transporte.emoji} Expedição ${os.codigo} sem transporte definido`,
      corpo: gerarTemplateAlertaTransporte(lider, os),
      referencia_id: os.id,
      referencia_tipo: 'tarefa',
      mensagem: `A expedição ${os.codigo} não possui transporte definido`
    });
    
    if (resultado.success && !resultado.skipped) {
      resultados.processadas++;
    } else if (!resultado.success) {
      resultados.erros.push({
        osId: os.id,
        liderEmail: lider.email,
        tipo: ALERT_CONFIG.ALERT_TYPES.TRANSPORTE,
        erro: resultado.error
      });
    }
  }
  
  logEstruturado('INFO', 'processarExpedicoesSemTransporte', resultados, 'Processamento concluído');
  return resultados;
}