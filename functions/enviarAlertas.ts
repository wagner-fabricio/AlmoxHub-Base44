import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireAuth, checkRateLimit } from './middleware/auth.js';
import { ALERT_CONFIG } from './alertConfig.js';
import { logEstruturado, logAgregado } from './utils/logging.js';
import {
  processarOrdensAtrasadas,
  processarOrdensParadas,
  processarExpedicoesSemSeguro,
  processarExpedicoesSemTransporte
} from './alertStrategies.js';

/**
 * Função refatorada para enviar alertas automáticos sobre OSs críticas
 * 
 * Melhorias implementadas:
 * - Templates HTML modularizados
 * - Cache/Maps para lookups O(1)
 * - Filtros nas queries
 * - Constantes centralizadas
 * - Serviço de notificação
 * - Validação robusta de dados
 * - Logging estruturado
 * - Retorno detalhado
 * - Lógica separada por estratégia
 * - Idempotência (não envia alerta duplicado no mesmo dia)
 * 
 * REQUER: Autenticação e perfil de gestor
 */
export default async function enviarAlertas(req) {
  const inicioExecucao = Date.now();
  
  // Verificar autenticação e autorização
  const auth = await requireAuth(req, { requiredRole: 'gestor' });
  
  if (auth.error) {
    return auth.response;
  }
  
  const { user, pessoa, base44 } = auth;
  
  // Rate limiting
  const rateLimit = checkRateLimit(
    user.id, 
    ALERT_CONFIG.MAX_REQUESTS_PER_HOUR, 
    ALERT_CONFIG.RATE_LIMIT_WINDOW
  );
  
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }
  
  logEstruturado('INFO', 'enviarAlertas', 
    { userId: user.id, pessoaId: pessoa.id }, 
    'Iniciando execução de alertas');
  
  try {
    // Buscar dados com filtros aplicados
    const [todasOrdens, todasPessoas, todasCategorias] = await Promise.all([
      base44.asServiceRole.entities.OrdemServico.list(),
      base44.asServiceRole.entities.Pessoa.list(),
      base44.asServiceRole.entities.Categoria.list()
    ]);
    
    // Aplicar filtros nas queries
    const ordens = todasOrdens.filter(os => 
      !ALERT_CONFIG.STATUS_INATIVOS.includes(os.status)
    );
    
    const pessoas = todasPessoas.filter(p => 
      p.email && p.email.trim() !== ''
    );
    
    const categorias = todasCategorias.filter(c => 
      c.ativa !== false
    );
    
    logEstruturado('INFO', 'enviarAlertas', 
      { 
        ordensAtivas: ordens.length, 
        pessoasComEmail: pessoas.length,
        categoriasAtivas: categorias.length 
      }, 
      'Dados carregados e filtrados');
    
    // Criar Maps para lookups O(1)
    const pessoasMap = new Map(pessoas.map(p => [p.id, p]));
    const categoriasMap = new Map(categorias.map(c => [c.id, c]));
    
    // Identificar categoria de expedição uma única vez
    const categoriaExpedicao = categorias.find(c => 
      c.nome?.toLowerCase().includes(ALERT_CONFIG.CATEGORIA_EXPEDICAO_NOME)
    );
    
    // Processar cada tipo de alerta
    const [
      resultadosAtraso,
      resultadosInatividade,
      resultadosSeguro,
      resultadosTransporte
    ] = await Promise.all([
      processarOrdensAtrasadas(base44.asServiceRole, ordens, pessoasMap),
      processarOrdensParadas(base44.asServiceRole, ordens, pessoasMap),
      processarExpedicoesSemSeguro(base44.asServiceRole, ordens, pessoasMap, categoriaExpedicao),
      processarExpedicoesSemTransporte(base44.asServiceRole, ordens, pessoasMap, categoriaExpedicao)
    ]);
    
    // Consolidar erros
    const todosErros = [
      ...resultadosAtraso.erros,
      ...resultadosInatividade.erros,
      ...resultadosSeguro.erros,
      ...resultadosTransporte.erros
    ];
    
    // Calcular totais
    const totalAlertasEnviados = 
      resultadosAtraso.processadas +
      resultadosInatividade.processadas +
      resultadosSeguro.processadas +
      resultadosTransporte.processadas;
    
    const totalAlertas = 
      resultadosAtraso.total +
      resultadosInatividade.total +
      resultadosSeguro.total +
      resultadosTransporte.total;
    
    const totalFalhas = todosErros.length;
    
    // Registrar auditoria
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'enviar_alertas',
      entity_type: 'OrdemServico',
      entity_id: null,
      user_id: user.id,
      details: JSON.stringify({
        ordensAtrasadas: resultadosAtraso.total,
        ordensParadas: resultadosInatividade.total,
        expedicoesSemSeguro: resultadosSeguro.total,
        expedicoesSemTransporte: resultadosTransporte.total,
        totalEnviados: totalAlertasEnviados,
        totalFalhas,
        tempoExecucao: Date.now() - inicioExecucao
      }),
      timestamp: new Date().toISOString()
    });
    
    // Log agregado final
    logAgregado('enviarAlertas', [
      { tipo: 'atraso', success: true, total: resultadosAtraso.total, enviados: resultadosAtraso.processadas },
      { tipo: 'inatividade', success: true, total: resultadosInatividade.total, enviados: resultadosInatividade.processadas },
      { tipo: 'seguro', success: true, total: resultadosSeguro.total, enviados: resultadosSeguro.processadas },
      { tipo: 'transporte', success: true, total: resultadosTransporte.total, enviados: resultadosTransporte.processadas }
    ]);
    
    // Retorno detalhado
    return Response.json({
      success: true,
      summary: {
        ordensAtrasadas: {
          total: resultadosAtraso.total,
          notificadas: resultadosAtraso.processadas,
          falhadas: resultadosAtraso.erros.length
        },
        ordensParadas: {
          total: resultadosInatividade.total,
          notificadas: resultadosInatividade.processadas,
          falhadas: resultadosInatividade.erros.length
        },
        expedicoesSemSeguro: {
          total: resultadosSeguro.total,
          notificadas: resultadosSeguro.processadas,
          falhadas: resultadosSeguro.erros.length
        },
        expedicoesSemTransporte: {
          total: resultadosTransporte.total,
          notificadas: resultadosTransporte.processadas,
          falhadas: resultadosTransporte.erros.length
        },
        totalAlertasEnviados,
        totalFalhas
      },
      erros: todosErros,
      logs: [],
      tempoExecucao: Date.now() - inicioExecucao
    });
    
  } catch (error) {
    logEstruturado('ERROR', 'enviarAlertas', 
      { userId: user.id }, 
      'Erro crítico ao processar alertas', error);
    
    return Response.json({ 
      success: false, 
      error: 'Erro ao processar alertas',
      details: error.message 
    }, { status: 500 });
  }
}