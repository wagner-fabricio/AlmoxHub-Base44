import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STATUS_INATIVOS = ['concluido', 'cancelado'];
const DIAS_PARADA_LIMITE = 7;

async function alertaJaEnviadoHoje(base44, osId, tipoAlerta, liderId) {
  try {
    const alertas = await base44.entities.AlertaEnviado.list();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);
    return alertas.some(a => {
      const d = new Date(a.data_envio);
      return a.os_id === osId && a.tipo_alerta === tipoAlerta && a.lider_id === liderId && d >= hoje && d <= hojeFim;
    });
  } catch {
    return false;
  }
}

async function registrarAlertaEnviado(base44, osId, tipoAlerta, liderId, success) {
  try {
    await base44.entities.AlertaEnviado.create({
      os_id: osId, tipo_alerta: tipoAlerta, lider_id: liderId,
      data_envio: new Date().toISOString().split('T')[0], success
    });
  } catch { /* ignorar */ }
}

async function criarNotificacaoInApp(base44, destinatarioId, osId, mensagem) {
  await base44.entities.Notificacao.create({
    destinatario_id: destinatarioId,
    tipo: 'mudanca_status',
    referencia_id: osId,
    referencia_tipo: 'tarefa',
    mensagem,
    lida: false
  });
}

Deno.serve(async (req) => {
  const inicioExecucao = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar dados
    const [todasOrdens, todasPessoas] = await Promise.all([
      base44.asServiceRole.entities.OrdemServico.list(),
      base44.asServiceRole.entities.Pessoa.list()
    ]);

    const ordens = todasOrdens.filter(os => !STATUS_INATIVOS.includes(os.status));
    const pessoasMap = new Map(todasPessoas.map(p => [p.id, p]));
    const hoje = new Date();

    let notificadasAtraso = 0;
    let notificadasInatividade = 0;

    // Processar ordens atrasadas
    const ordensAtrasadas = ordens.filter(os => os.prazo && new Date(os.prazo) < hoje);
    for (const os of ordensAtrasadas) {
      const lider = pessoasMap.get(os.lider_id);
      if (!lider) continue;
      const jaEnviado = await alertaJaEnviadoHoje(base44.asServiceRole, os.id, 'atraso', lider.id);
      if (jaEnviado) continue;
      const dias = Math.floor((hoje - new Date(os.prazo)) / (1000 * 60 * 60 * 24));
      await criarNotificacaoInApp(base44.asServiceRole, lider.id, os.id,
        `A OS ${os.codigo} está ${dias} dia${dias > 1 ? 's' : ''} atrasada`);
      await registrarAlertaEnviado(base44.asServiceRole, os.id, 'atraso', lider.id, true);
      notificadasAtraso++;
    }

    // Processar ordens paradas
    const ordensParadas = ordens.filter(os => {
      if (!os.updated_date) return false;
      const dias = Math.floor((hoje - new Date(os.updated_date)) / (1000 * 60 * 60 * 24));
      return dias > DIAS_PARADA_LIMITE;
    });
    for (const os of ordensParadas) {
      const lider = pessoasMap.get(os.lider_id);
      if (!lider) continue;
      const jaEnviado = await alertaJaEnviadoHoje(base44.asServiceRole, os.id, 'inatividade', lider.id);
      if (jaEnviado) continue;
      const dias = Math.floor((hoje - new Date(os.updated_date)) / (1000 * 60 * 60 * 24));
      await criarNotificacaoInApp(base44.asServiceRole, lider.id, os.id,
        `A OS ${os.codigo} está sem movimentação há ${dias} dias`);
      await registrarAlertaEnviado(base44.asServiceRole, os.id, 'inatividade', lider.id, true);
      notificadasInatividade++;
    }

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'enviar_alertas', entity_type: 'OrdemServico', entity_id: null,
      user_id: user.id,
      details: JSON.stringify({ ordensAtrasadas: notificadasAtraso, ordensParadas: notificadasInatividade, tempoExecucao: Date.now() - inicioExecucao }),
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      notificadas_atraso: notificadasAtraso,
      notificadas_inatividade: notificadasInatividade,
      tempoExecucao: Date.now() - inicioExecucao
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});