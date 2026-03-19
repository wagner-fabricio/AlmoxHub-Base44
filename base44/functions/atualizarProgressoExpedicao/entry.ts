import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar TODAS as categorias (sem filtro inicial)
    const categorias = await base44.asServiceRole.entities.Categoria.list();
    const categoriasArray = Array.isArray(categorias) ? categorias : [];
    
    console.log('Todas as categorias:', categoriasArray.map(c => ({ id: c.id, nome: c.nome })));
    
    const categoriasExpedicao = categoriasArray.filter(cat => 
      cat.nome && (cat.nome.toLowerCase().includes('expedição') || cat.nome.toLowerCase().includes('expedicao'))
    );
    const idsCategoriasExpedicao = categoriasExpedicao.map(c => c.id);

    console.log(`Categorias de expedição:`, categoriasExpedicao.map(c => ({ id: c.id, nome: c.nome })));

    // Buscar TODAS as OSs
    const todasOS = await base44.asServiceRole.entities.OrdemServico.list();
    const todasOSArray = Array.isArray(todasOS) ? todasOS : [];
    
    console.log(`Total de OSs no sistema: ${todasOSArray.length}`);
    
    // Se não encontrou categorias, tentar atualizar todas as OSs que tenham status_separacao
    let osExpedicao;
    if (idsCategoriasExpedicao.length === 0) {
      console.log('Nenhuma categoria de expedição encontrada, buscando OSs com status_separacao...');
      osExpedicao = todasOSArray.filter(os => os.status_separacao);
    } else {
      console.log(`IDs de categorias de expedição: ${idsCategoriasExpedicao.join(', ')}`);
      osExpedicao = todasOSArray.filter(os => 
        os.categoria_id && idsCategoriasExpedicao.includes(os.categoria_id)
      );
    }

    console.log(`Encontradas ${osExpedicao.length} OSs de expedição para atualizar`);
    
    // Debug: mostrar algumas OSs encontradas
    if (osExpedicao.length > 0) {
      console.log('Primeiras 5 OSs:', osExpedicao.slice(0, 5).map(os => ({
        codigo: os.codigo,
        status_separacao: os.status_separacao,
        progresso_atual: os.progresso
      })));
    }

    // Mapa de status para progresso
    const statusProgressoMap = {
      'pendente': 10,
      'em_separacao': 20,
      'separado': 40,
      'embalando': 60,
      'aguardando_transporte': 80,
      'em_rota': 90,
      'entregue': 100
    };

    let updated = 0;
    const errors = [];

    // Atualizar cada OS
    for (const os of osExpedicao) {
      try {
        const statusSeparacao = os.status_separacao || 'pendente';
        const novoProgresso = statusProgressoMap[statusSeparacao] || 10;

        // Só atualizar se o progresso mudou
        if (os.progresso !== novoProgresso) {
          await base44.asServiceRole.entities.OrdemServico.update(os.id, {
            progresso: novoProgresso
          });
          updated++;
          console.log(`OS ${os.codigo}: ${statusSeparacao} -> ${novoProgresso}%`);
        }
      } catch (error) {
        console.error(`Erro ao atualizar OS ${os.codigo}:`, error);
        errors.push({
          os_codigo: os.codigo,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `Progresso atualizado com sucesso`,
      total_os: osExpedicao.length,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ 
      error: 'Erro ao atualizar progresso',
      details: error.message 
    }, { status: 500 });
  }
});