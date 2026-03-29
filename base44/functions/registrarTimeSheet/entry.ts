import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, os_id } = await req.json();

  if (!os_id || !['play', 'pause'].includes(action)) {
    return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  // Buscar OS e pessoa atual
  const [osArr, pessoaArr] = await Promise.all([
    base44.asServiceRole.entities.OrdemServico.filter({ id: os_id }),
    base44.asServiceRole.entities.Pessoa.filter({ user_id: user.id })
  ]);

  const os = osArr[0];
  const pessoa = pessoaArr[0];

  if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });
  if (!pessoa) return Response.json({ error: 'Pessoa não encontrada' }, { status: 404 });

  // Verificar permissão
  const isGestorRegional = pessoa.funcoes?.includes('gestor') && os.regional_id === pessoa.regional_id;
  const isLider = os.lider_id === pessoa.id;
  const isExecutor = (os.executores_ids || []).includes(pessoa.id);

  if (!isLider && !isExecutor && !isGestorRegional) {
    // Gestor pode se autoatribuir como executor
    if (pessoa.funcoes?.includes('gestor') && os.regional_id === pessoa.regional_id) {
      // Adicionar como executor
      const novosExecutores = [...(os.executores_ids || []), pessoa.id];
      await base44.asServiceRole.entities.OrdemServico.update(os_id, { executores_ids: novosExecutores });
      os.executores_ids = novosExecutores;
    } else {
      return Response.json({ error: 'Sem permissão' }, { status: 403 });
    }
  }

  const sessoesAtivas = os.timesheet_sessoes_ativas || [];
  const totalMinutosAtual = os.timesheet_total_minutos || 0;
  const agora = new Date().toISOString();

  if (action === 'play') {
    // Verificar se já tem sessão ativa desta pessoa
    const jaPlaying = sessoesAtivas.find(s => s.pessoa_id === pessoa.id);
    if (jaPlaying) {
      return Response.json({ success: true, already_playing: true, entry_id: jaPlaying.entrada_id });
    }

    // Criar entrada no TimeSheetEntry
    const entry = await base44.asServiceRole.entities.TimeSheetEntry.create({
      os_id,
      os_codigo: os.codigo,
      pessoa_id: pessoa.id,
      pessoa_nome: pessoa.nome,
      inicio: agora,
      status: 'playing'
    });

    // Atualizar sessões ativas na OS
    const novaSessao = {
      entrada_id: entry.id,
      pessoa_id: pessoa.id,
      pessoa_nome: pessoa.nome,
      inicio: agora
    };
    const novasSessoes = [...sessoesAtivas, novaSessao];

    await base44.asServiceRole.entities.OrdemServico.update(os_id, {
      timesheet_status: 'playing',
      timesheet_sessoes_ativas: novasSessoes
    });

    return Response.json({ success: true, entry_id: entry.id, action: 'play' });

  } else {
    // PAUSE — encontrar sessão ativa desta pessoa
    const sessao = sessoesAtivas.find(s => s.pessoa_id === pessoa.id);
    if (!sessao) {
      return Response.json({ success: true, already_paused: true });
    }

    // Calcular duração
    const inicioMs = new Date(sessao.inicio).getTime();
    const duracaoMinutos = Math.round((Date.now() - inicioMs) / 60000);

    // Fechar entrada no TimeSheetEntry
    await base44.asServiceRole.entities.TimeSheetEntry.update(sessao.entrada_id, {
      fim: agora,
      duracao_minutos: duracaoMinutos,
      pessoa_pause_id: pessoa.id,
      pessoa_pause_nome: pessoa.nome,
      tipo_encerramento: 'pause',
      status: 'closed'
    });

    // Remover sessão ativa e atualizar total
    const novasSessoes = sessoesAtivas.filter(s => s.pessoa_id !== pessoa.id);
    const novoTotal = totalMinutosAtual + duracaoMinutos;
    const novoStatus = novasSessoes.length > 0 ? 'playing' : 'paused';

    await base44.asServiceRole.entities.OrdemServico.update(os_id, {
      timesheet_status: novoStatus,
      timesheet_sessoes_ativas: novasSessoes,
      timesheet_total_minutos: novoTotal
    });

    return Response.json({ success: true, action: 'pause', duracao_minutos: duracaoMinutos, total_minutos: novoTotal });
  }
});