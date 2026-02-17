import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação e se é admin
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar todas as categorias de Expedição
    const categorias = await base44.asServiceRole.entities.Categoria.list();
    const categoriasArray = Array.isArray(categorias) ? categorias : [];
    const categoriasExpedicao = categoriasArray.filter(cat => 
      cat.nome && (cat.nome.toLowerCase().includes('expedição') || cat.nome.toLowerCase().includes('expedicao'))
    );
    const idsCategoriasExpedicao = categoriasExpedicao.map(c => c.id);

    console.log(`Categorias encontradas: ${categoriasArray.length}`);
    console.log(`Categorias de expedição: ${categoriasExpedicao.length}`, categoriasExpedicao.map(c => c.nome));

    if (idsCategoriasExpedicao.length === 0) {
      return Response.json({ 
        message: 'Nenhuma categoria de expedição encontrada',
        updated: 0 
      });
    }

    // Buscar todas as OSs de categoria Expedição
    const todasOS = await base44.asServiceRole.entities.OrdemServico.list();
    const todasOSArray = Array.isArray(todasOS) ? todasOS : [];
    
    console.log(`Total de OSs no sistema: ${todasOSArray.length}`);
    console.log(`IDs de categorias de expedição: ${idsCategoriasExpedicao.join(', ')}`);
    
    const osExpedicao = todasOSArray.filter(os => 
      os.categoria_id && idsCategoriasExpedicao.includes(os.categoria_id)
    );

    console.log(`Encontradas ${osExpedicao.length} OSs de expedição para atualizar`);

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