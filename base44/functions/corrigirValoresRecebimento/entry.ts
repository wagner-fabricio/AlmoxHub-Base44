import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Buscar categoria Recebimento
    const categorias = await base44.asServiceRole.entities.Categoria.list();
    const categoriaRecebimento = categorias.find(c => c.nome?.toLowerCase().includes('recebimento'));
    
    if (!categoriaRecebimento) {
      return Response.json({ error: 'Categoria Recebimento não encontrada' }, { status: 404 });
    }

    // Buscar subcategoria Compra
    const subcategorias = await base44.asServiceRole.entities.Subcategoria.list();
    const subcategoriaCompra = subcategorias.find(s => 
      s.nome?.toLowerCase().includes('compra') && s.categoria_id === categoriaRecebimento.id
    );

    // Buscar todas as OS de recebimento
    const ordensRecebimento = await base44.asServiceRole.entities.OrdemServico.filter({
      categoria_id: categoriaRecebimento.id
    });

    // Filtrar por subcategoria Compra se existir
    let ordensParaCorrigir = ordensRecebimento;
    if (subcategoriaCompra) {
      ordensParaCorrigir = ordensRecebimento.filter(os => 
        os.subcategorias_ids?.includes(subcategoriaCompra.id)
      );
    }

    let corrigidas = 0;
    let jaCorretas = 0;

    // Processar em lotes para evitar rate limit
    const batchSize = 5;
    for (let i = 0; i < ordensParaCorrigir.length; i += batchSize) {
      const batch = ordensParaCorrigir.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (os) => {
        if (!os.nfe_itens_conferencia || os.nfe_itens_conferencia.length === 0) {
          return;
        }

        let precisaAtualizar = false;
        const itensAtualizados = os.nfe_itens_conferencia.map(item => {
          // Se já tem valor_unitario, não precisa corrigir
          if (item.valor_unitario && item.valor_unitario > 0) {
            return item;
          }

          // Tentar calcular valor_unitario a partir de valor_total
          if (item.valor_total && item.quantidade_esperada && item.quantidade_esperada > 0) {
            precisaAtualizar = true;
            return {
              ...item,
              valor_unitario: item.valor_total / item.quantidade_esperada
            };
          }

          // Se não tem valor_total, definir valor_unitario como 0
          if (!item.valor_unitario) {
            precisaAtualizar = true;
            return {
              ...item,
              valor_unitario: 0
            };
          }

          return item;
        });

        if (precisaAtualizar) {
          await base44.asServiceRole.entities.OrdemServico.update(os.id, {
            nfe_itens_conferencia: itensAtualizados
          });
          corrigidas++;
        } else {
          jaCorretas++;
        }
      }));

      // Aguardar 500ms entre lotes
      if (i + batchSize < ordensParaCorrigir.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return Response.json({
      success: true,
      message: `Correção concluída`,
      totalOSRecebimento: ordensParaCorrigir.length,
      osCorrigidas: corrigidas,
      osJaCorretas: jaCorretas
    });

  } catch (error) {
    console.error('Erro ao corrigir valores:', error);
    return Response.json({ 
      error: 'Erro ao corrigir valores: ' + error.message 
    }, { status: 500 });
  }
});