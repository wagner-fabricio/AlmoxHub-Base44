import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation diária para limpar LoginAttempts com mais de 24h
 * Executado via scheduled automation
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se é admin (automations executam com service role, mas validar)
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Buscar tentativas com mais de 24h
    const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const tentativasAntigas = await base44.asServiceRole.entities.LoginAttempt.filter({
      created_date: { $lt: vinteQuatroHorasAtras }
    });

    let deletadas = 0;
    for (const tentativa of tentativasAntigas) {
      await base44.asServiceRole.entities.LoginAttempt.delete(tentativa.id);
      deletadas++;
    }

    // Log de estatísticas
    const tentativasRecentes = await base44.asServiceRole.entities.LoginAttempt.list();
    const falhadas = tentativasRecentes.filter(t => !t.sucesso).length;
    const bemSucedidas = tentativasRecentes.filter(t => t.sucesso).length;

    console.log(`Cleanup concluído: ${deletadas} registros deletados`);
    console.log(`Estatísticas (últimas 24h): ${falhadas} falhas, ${bemSucedidas} sucessos`);

    return Response.json({
      success: true,
      deletadas,
      estatisticas: {
        tentativas_falhadas_24h: falhadas,
        tentativas_sucesso_24h: bemSucedidas
      }
    });

  } catch (error) {
    console.error('Erro em cleanupLoginAttempts:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});