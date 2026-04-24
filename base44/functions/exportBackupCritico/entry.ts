import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Exporta backup de entidades críticas
 * Executado semanalmente via automation
 * 
 * Entidades críticas:
 * - OrdemServico
 * - Pessoa
 * - Regional
 * - Almoxarifado
 * - Instalacao
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const backupData = {
      backup_date: new Date().toISOString(),
      version: '1.0',
      entities: {}
    };

    // Entidades críticas para backup
    const entidadesCriticas = [
      'OrdemServico',
      'Pessoa', 
      'Regional',
      'Almoxarifado',
      'Instalacao',
      'Categoria',
      'Subcategoria',
      'Projeto'
    ];

    let totalRecords = 0;

    for (const entityName of entidadesCriticas) {
      try {
        const records = await base44.asServiceRole.entities[entityName].list();
        backupData.entities[entityName] = records;
        totalRecords += records.length;
        console.log(`✓ ${entityName}: ${records.length} registros`);
      } catch (err) {
        console.error(`Erro ao exportar ${entityName}:`, err);
        backupData.entities[entityName] = { error: err.message };
      }
    }

    // Converter para JSON
    const jsonContent = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    // Upload para storage privado
    const fileName = `backup-critico-${timestamp}.json`;
    
    // Criar file a partir do blob
    const file = new File([blob], fileName, { type: 'application/json' });
    
    const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({
      file: file
    });

    // Log no AuditLog
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        acao: 'backup_export',
        entidade: 'Sistema',
        entidade_id: 'backup-' + timestamp,
        usuario_email: user.email,
        usuario_nome: user.full_name,
        detalhes: {
          file_uri,
          total_records: totalRecords,
          entities: Object.keys(backupData.entities)
        },
        timestamp: new Date().toISOString()
      });
    } catch (auditError) {
      console.error('Erro ao registrar auditoria:', auditError);
    }

    return Response.json({
      success: true,
      file_uri,
      fileName,
      totalRecords,
      entities: Object.keys(backupData.entities),
      message: `Backup de ${totalRecords} registros concluído`
    });

  } catch (error) {
    console.error('Erro em exportBackupCritico:', error);
    return Response.json({ error: 'Erro ao exportar backup' }, { status: 500 });
  }
});