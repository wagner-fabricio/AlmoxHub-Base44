import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Backend function para anonimização de dados pessoais
 * Aplica técnicas de masking, hashing e generalização
 * 
 * Payload esperado:
 * {
 *   entity_type: string (ex: "Pessoa", "OrdemServico"),
 *   entity_id: string,
 *   campos_anonimizar: string[] (opcional, default: todos PII)
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { entity_type, entity_id, campos_anonimizar } = await req.json();

    if (!entity_type || !entity_id) {
      return Response.json({ error: 'entity_type and entity_id are required' }, { status: 400 });
    }

    // Whitelist de entidades permitidas para anonimização
    const ENTIDADES_PERMITIDAS = ['Pessoa', 'OrdemServico', 'Comentario', 'MensagemChat', 'SolicitacaoTitular'];
    if (!ENTIDADES_PERMITIDAS.includes(entity_type)) {
      return Response.json({ error: `Entity type '${entity_type}' não permitida para anonimização` }, { status: 400 });
    }

    // Buscar entidade
    const entidade = await base44.asServiceRole.entities[entity_type].filter({ id: entity_id }).then(r => r[0]);
    
    if (!entidade) {
      return Response.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Definir campos PII padrão por entity type
    const camposPIIPadrao = {
      Pessoa: ['nome', 'email', 'matricula', 'foto_perfil'],
      OrdemServico: ['atendente_nome'],
      Comentario: ['autor_nome', 'conteudo'],
      MensagemChat: ['autor_nome', 'conteudo'],
      SolicitacaoTitular: ['titular_nome', 'titular_email', 'titular_cpf', 'titular_telefone']
    };

    const camposParaAnonimizar = campos_anonimizar || camposPIIPadrao[entity_type] || [];

    // Gerar ID único para anonimização
    const anonim_id = Math.floor(Math.random() * 100000);

    // Aplicar técnicas de anonimização
    const dadosAnonimizados = {};
    const fieldsAnonymized = [];

    for (const campo of camposParaAnonimizar) {
      if (entidade[campo] !== undefined && entidade[campo] !== null) {
        fieldsAnonymized.push(campo);

        // Técnicas específicas por tipo de campo
        if (campo.includes('nome')) {
          dadosAnonimizados[campo] = `Usuário Anônimo #${anonim_id}`;
        } else if (campo.includes('email')) {
          dadosAnonimizados[campo] = `anonimo_${anonim_id}@anonimo.com`;
        } else if (campo.includes('cpf') || campo.includes('cnpj')) {
          // Hash SHA-256
          const hash = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(entidade[campo])
          );
          dadosAnonimizados[campo] = Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        } else if (campo.includes('telefone')) {
          dadosAnonimizados[campo] = null; // Remover completamente
        } else if (campo.includes('endereco')) {
          // Generalização - manter apenas cidade/estado
          if (typeof entidade[campo] === 'object') {
            dadosAnonimizados[campo] = {
              cidade: entidade[campo].cidade,
              estado: entidade[campo].estado
            };
          }
        } else if (campo.includes('conteudo') || campo.includes('descricao')) {
          dadosAnonimizados[campo] = '[Conteúdo Anonimizado]';
        } else if (campo.includes('foto') || campo.includes('avatar')) {
          dadosAnonimizados[campo] = null;
        } else if (campo.includes('matricula')) {
          dadosAnonimizados[campo] = `ANONIMO-${anonim_id}`;
        } else {
          // Default: marcar como anonimizado
          dadosAnonimizados[campo] = '[Anonimizado]';
        }
      }
    }

    // Atualizar entidade
    await base44.asServiceRole.entities[entity_type].update(entity_id, dadosAnonimizados);

    // Registrar em AuditLog
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        acao: 'anonimizacao',
        entidade: entity_type,
        entidade_id: entity_id,
        usuario_email: user.email,
        usuario_nome: user.full_name,
        detalhes: {
          campos_anonimizados: fieldsAnonymized,
          anonimo_id: anonim_id
        },
        timestamp: new Date().toISOString()
      });
    } catch (auditError) {
      console.error('Erro ao registrar auditoria:', auditError);
    }

    return Response.json({
      success: true,
      entity_type,
      entity_id,
      fields_anonymized: fieldsAnonymized,
      anonimo_id: anonim_id
    });

  } catch (error) {
    console.error('Erro na anonimização:', error);
    return Response.json({ error: 'Erro ao processar anonimização' }, { status: 500 });
  }
});