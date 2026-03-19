import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { os_id } = await req.json();

    if (!os_id) {
      return Response.json({ error: 'os_id é obrigatório' }, { status: 400 });
    }

    // Buscar a OS
    const osList = await base44.asServiceRole.entities.OrdemServico.filter({ id: os_id });
    const os = osList[0];

    if (!os) {
      return Response.json({ error: 'OS não encontrada' }, { status: 404 });
    }

    // Verificar se é expedição
    const categorias = await base44.asServiceRole.entities.Categoria.list();
    const categoria = categorias.find(c => c.id === os.categoria_id);
    const isExpedicao = categoria?.nome?.toLowerCase().includes('expedição');

    if (!isExpedicao) {
      return Response.json({ 
        message: 'OS não é de expedição, fluxo não aplicável' 
      });
    }

    // Inicializar fluxo se não existir
    let fluxo = os.fluxo_expedicao || {
      etapa_atual: 1,
      solicitacao_completa: true,
      solicitacao_data: os.created_date,
      separacao_completa: false,
      preparacao_completa: false,
      envio_completo: false,
      entrega_completa: false
    };

    let mudancas = false;

    // Etapa 2: Separação - Todos os itens marcados como separados
    if (!fluxo.separacao_completa && os.itens_documento?.length > 0) {
      const todosSeparados = os.itens_documento.every(item => item.separado === true);
      if (todosSeparados) {
        fluxo.separacao_completa = true;
        fluxo.separacao_data = new Date().toISOString();
        fluxo.etapa_atual = Math.max(fluxo.etapa_atual, 3);
        mudancas = true;
      }
    }

    // Etapa 3: Preparação - Volumes e detalhamento de expedição cadastrados
    if (fluxo.separacao_completa && !fluxo.preparacao_completa) {
      const temVolumes = os.volumes?.length > 0;
      const temExpedicao = os.detalhamento_expedicao?.length > 0;
      
      if (temVolumes && temExpedicao) {
        fluxo.preparacao_completa = true;
        fluxo.preparacao_data = new Date().toISOString();
        fluxo.etapa_atual = Math.max(fluxo.etapa_atual, 4);
        mudancas = true;
      }
    }

    // Etapa 4: Envio - Data de expedição preenchida
    if (fluxo.preparacao_completa && !fluxo.envio_completo) {
      const temDataExpedicao = os.detalhamento_expedicao?.some(exp => exp.data_expedicao);
      
      if (temDataExpedicao) {
        fluxo.envio_completo = true;
        fluxo.envio_data = new Date().toISOString();
        fluxo.etapa_atual = Math.max(fluxo.etapa_atual, 5);
        mudancas = true;
      }
    }

    // Etapa 5: Entrega - Data de entrega preenchida
    if (fluxo.envio_completo && !fluxo.entrega_completa && os.data_entrega) {
      fluxo.entrega_completa = true;
      fluxo.entrega_data = new Date().toISOString();
      fluxo.etapa_atual = 5;
      mudancas = true;
    }

    // Calcular progresso baseado no fluxo
    let progresso = 0;
    if (fluxo.solicitacao_completa) progresso = 20;
    if (fluxo.separacao_completa) progresso = 40;
    if (fluxo.preparacao_completa) progresso = 60;
    if (fluxo.envio_completo) progresso = 80;
    if (fluxo.entrega_completa) progresso = 100;

    // Sempre atualizar se o progresso calculado for diferente do atual
    const progressoMudou = os.progresso !== progresso;
    
    if (mudancas || progressoMudou) {
      await base44.asServiceRole.entities.OrdemServico.update(os_id, {
        fluxo_expedicao: fluxo,
        progresso: progresso
      });

      return Response.json({
        success: true,
        fluxo_atualizado: fluxo,
        progresso_atualizado: progresso,
        mudancas_fluxo: mudancas,
        mudancas_progresso: progressoMudou,
        mensagem: mudancas ? 'Fluxo de expedição atualizado com sucesso' : 'Progresso sincronizado com o fluxo'
      });
    }

    return Response.json({
      success: true,
      fluxo_atual: fluxo,
      progresso_atual: progresso,
      mensagem: 'Fluxo e progresso já estão sincronizados'
    });

  } catch (error) {
    console.error('Erro ao atualizar fluxo de expedição:', error);
    return Response.json({ 
      error: 'Erro ao processar fluxo de expedição',
      details: error.message 
    }, { status: 500 });
  }
});