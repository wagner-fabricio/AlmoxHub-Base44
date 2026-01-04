import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import { Download, Upload, Loader2, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BulkUpdateModal({ open, onClose, entityName, displayName, onRefresh }) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  // Função para gerar e baixar log de erros
  const downloadErrorLog = (errorLog, results, entityDisplayName) => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const fileName = `${entityName}_erros_${new Date().toISOString().split('T')[0]}_${Date.now()}.txt`;
    
    let logContent = `========================================\n`;
    logContent += `LOG DE IMPORTAÇÃO - ${entityDisplayName}\n`;
    logContent += `========================================\n\n`;
    logContent += `Data/Hora: ${timestamp}\n`;
    logContent += `Arquivo processado: ${entityName}\n\n`;
    
    logContent += `RESUMO:\n`;
    logContent += `-------\n`;
    logContent += `Total de linhas: ${results.total}\n`;
    logContent += `✓ Atualizados: ${results.success - (results.created || 0)}\n`;
    logContent += `✓ Criados: ${results.created || 0}\n`;
    logContent += `⊘ Ignorados: ${results.skipped}\n`;
    logContent += `✗ Erros: ${results.errors}\n\n`;
    
    if (errorLog.length > 0) {
      logContent += `DETALHAMENTO DOS ERROS:\n`;
      logContent += `------------------------\n\n`;
      errorLog.forEach((error, index) => {
        logContent += `${index + 1}. ${error}\n`;
      });
    }
    
    logContent += `\n========================================\n`;
    logContent += `Fim do relatório\n`;
    logContent += `========================================\n`;
    
    // Criar blob e fazer download
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`📥 Log de erros baixado: ${fileName}`);
  };

  // Gerar template Excel
  const handleExportTemplate = async () => {
    try {
      // Buscar dados existentes
      const data = await base44.entities[entityName].list();
      
      if (!data || data.length === 0) {
        alert('Nenhum registro encontrado para exportar');
        return;
      }

      // Coletar todos os campos únicos de todos os registros (exceto campos de auditoria)
      const allKeys = new Set();
      data.forEach(item => {
        Object.keys(item).forEach(key => {
          if (!['created_date', 'updated_date', 'created_by'].includes(key)) {
            allKeys.add(key);
          }
        });
      });
      
      // Garantir que 'id' seja o primeiro campo
      const fields = ['id', ...Array.from(allKeys).filter(k => k !== 'id')];

      // Preparar dados para Excel com todos os campos
      const excelData = data.map(item => {
        const row = {};
        
        // Adicionar todos os campos na ordem
        fields.forEach(key => {
          row[key] = item[key] !== undefined && item[key] !== null ? item[key] : '';
        });
        
        return row;
      });

      // Criar workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, displayName);

      // Download
      XLSX.writeFile(wb, `${entityName}_template_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting template:', error);
      alert('Erro ao exportar template');
    }
  };

  // Validar tipo de dado
  const validateFieldValue = (value, fieldType, fieldName) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true, value: null };
    }

    try {
      // Auto-detectar tipo se não especificado
      if (fieldType === 'auto') {
        // Campos que DEVEM ser sempre strings (endereços, códigos, etc)
        const stringFields = ['numero', 'cep', 'complemento', 'logradouro', 'bairro', 'cnpj', 'cpf', 'rg', 'placa', 'renavam', 'telefones', 'codigo', 'inscricao_estadual', 'codigo_sap'];
        if (stringFields.includes(fieldName)) {
          return { valid: true, value: String(value) };
        }
        
        // Se for boolean
        if (typeof value === 'boolean') {
          return { valid: true, value };
        }
        // Se for string que parece boolean
        const strVal = String(value).toLowerCase();
        if (['true', 'false', 'sim', 'não', 'yes', 'no', 'nao'].includes(strVal)) {
          return { valid: true, value: ['true', '1', 'sim', 'yes'].includes(strVal) };
        }
        // Se for array
        if (Array.isArray(value)) {
          return { valid: true, value };
        }
        
        // Campos numéricos explícitos
        const numericFields = ['latitude', 'longitude', 'local_negocios', 'tara', 'quantidade', 'r_unit', 'r_total', 'saldo', 'peso', 'valor_total', 'progresso'];
        if (numericFields.includes(fieldName)) {
          if (typeof value === 'number') {
            return { valid: true, value };
          }
          if (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(value)) {
            return { valid: true, value: parseFloat(value) };
          }
        }
        
        // Se for número puro e não está em nenhuma lista específica
        if (typeof value === 'number') {
          return { valid: true, value };
        }
        
        // Default: manter como string
        return { valid: true, value: String(value) };
      }

      // Validação por tipo específico
      switch (fieldType) {
        case 'number':
          const num = parseFloat(value);
          if (isNaN(num)) {
            return { valid: false, error: `${fieldName}: valor numérico inválido` };
          }
          return { valid: true, value: num };
        
        case 'boolean':
          if (typeof value === 'boolean') return { valid: true, value };
          const boolVal = String(value).toLowerCase();
          if (['true', '1', 'sim', 'yes'].includes(boolVal)) {
            return { valid: true, value: true };
          }
          if (['false', '0', 'não', 'no', 'nao'].includes(boolVal)) {
            return { valid: true, value: false };
          }
          return { valid: false, error: `${fieldName}: valor booleano inválido` };
        
        case 'array':
          if (Array.isArray(value)) return { valid: true, value };
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                return { valid: true, value: parsed };
              }
            } catch {
              return { valid: true, value: value.split(',').map(v => v.trim()).filter(Boolean) };
            }
          }
          return { valid: true, value: [] };
        
        default:
          return { valid: true, value: String(value) };
      }
    } catch (error) {
      return { valid: false, error: `${fieldName}: erro de validação` };
    }
  };

  // Processar arquivo
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('🔄 Iniciando processamento do arquivo:', file.name);
    
    setProcessing(true);
    setProgress(0);
    setErrors([]);
    setResults(null);

    try {
      console.log('📖 Lendo arquivo...');
      // Ler arquivo
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('📊 Dados lidos:', jsonData.length, 'linhas');
      console.log('📋 Colunas encontradas:', Object.keys(jsonData[0] || {}));
      console.log('🔍 Primeiros 3 registros:', jsonData.slice(0, 3));

      if (jsonData.length === 0) {
        throw new Error('Arquivo vazio');
      }

      console.log('✅ Validação inicial OK, processando linhas...');

      // Processar cada linha
      const errorLog = [];
      let successCount = 0;
      let createdCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2; // +2 porque Excel começa em 1 e tem header

        setProgress(Math.round(((i + 1) / jsonData.length) * 100));

        try {
          // Aceitar variações de "id" (id, ID, Id)
          const id = row.id || row.ID || row.Id;
          const nome = row.nome;

          // Se não tem ID mas tem nome, criar novo registro
          if (!id && nome) {
            console.log(`➕ Linha ${rowNumber} sem ID mas com nome - criando novo registro`);

            // Preparar dados para criação
            const createData = {};
            let hasData = false;

            for (const [key, value] of Object.entries(row)) {
              if (key === 'id' || key === 'ID' || key === 'Id' || 
                  key === 'created_date' || key === 'updated_date' || key === 'created_by') {
                continue;
              }

              // Pular valores vazios
              if (value === null || value === undefined || value === '') {
                continue;
              }

              // Validar tipo
              const validation = validateFieldValue(value, 'auto', key);

              if (!validation.valid) {
                throw new Error(validation.error);
              }

              createData[key] = validation.value;
              hasData = true;
            }

            if (hasData) {
              console.log(`✨ Criando novo registro...`);
              await base44.entities[entityName].create(createData);
              createdCount++;
              successCount++;
            } else {
              skippedCount++;
            }

            continue;
          }

          // Se não tem ID e não tem nome, ignorar
          if (!id) {
            console.log(`⚠️ Linha ${rowNumber} sem ID e sem nome - ignorando`);
            skippedCount++;
            continue;
          }

          console.log(`🔄 Processando linha ${rowNumber}, ID: ${id}`);

          // Preparar dados para update
          const updateData = {};
          let hasChanges = false;

          for (const [key, value] of Object.entries(row)) {
            if (key === 'id' || key === 'ID' || key === 'Id' || 
                key === 'created_date' || key === 'updated_date' || key === 'created_by') {
              continue;
            }

            // Pular valores vazios
            if (value === null || value === undefined || value === '') {
              continue;
            }

            // Validar tipo (inferido do valor)
            const validation = validateFieldValue(value, 'auto', key);

            if (!validation.valid) {
              throw new Error(validation.error);
            }

            updateData[key] = validation.value;
            hasChanges = true;
          }

          // Só atualizar se houver mudanças
          if (hasChanges) {
            console.log(`⚡ Atualizando registro ${id}...`);
            await base44.entities[entityName].update(id, updateData);
            successCount++;
          } else {
            skippedCount++;
          }

        } catch (error) {
          console.error(`❌ Erro na linha ${rowNumber}:`, error);
          errorLog.push(`Linha ${rowNumber}: ${error.message}`);
          // Não incrementar skippedCount aqui, pois é um erro
        }
      }

      console.log('✅ Processamento concluído:', { successCount, createdCount, skippedCount, errors: errorLog.length });
      console.log('📝 Erros encontrados:', errorLog);

      const finalResults = {
        total: jsonData.length,
        success: successCount,
        created: createdCount,
        skipped: skippedCount - errorLog.length,
        errors: errorLog.length
      };

      console.log('📊 Definindo resultados:', finalResults);
      setResults(finalResults);
      setErrors(errorLog);

      // Download automático do log se houver erros
      if (errorLog.length > 0) {
        downloadErrorLog(errorLog, finalResults, displayName);
      }

      if (successCount > 0) {
        console.log('🔄 Atualizando lista...');
        await onRefresh?.();
      }

      console.log('✅ State atualizado, modal deve exibir resultados agora');

    } catch (error) {
      console.error('❌ Erro geral ao processar arquivo:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      setErrors([`Erro geral: ${errorMessage}`]);
      setResults({
        total: 0,
        success: 0,
        skipped: 0,
        errors: 1
      });
    } finally {
      console.log('🏁 Finalizando processamento');
      setProcessing(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleClose = () => {
    if (processing) {
      console.log('⚠️ Tentativa de fechar durante processamento - bloqueado');
      return; // Não permitir fechar durante processamento
    }
    console.log('🚪 Fechando modal');
    setResults(null);
    setErrors([]);
    setProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atualização em Massa - {displayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Passo 1: Exportar Template */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-semibold text-slate-900">Exportar Planilha Atual</h3>
            </div>
            <p className="text-sm text-slate-600 ml-10">
              Baixe a planilha com todos os registros existentes. Para atualizar, mantenha o ID. Para criar novos, deixe o ID em branco.
            </p>
            <Button
              onClick={handleExportTemplate}
              variant="outline"
              className="ml-10"
              disabled={processing}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Planilha Excel
            </Button>
          </div>

          {/* Passo 2: Editar */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-semibold text-slate-900">Editar a Planilha</h3>
            </div>
            <p className="text-sm text-slate-600 ml-10">
              Edite os campos desejados. Linhas com ID serão <strong>atualizadas</strong>. Linhas sem ID mas com nome preenchido serão <strong>criadas</strong>.
            </p>
            <Alert className="ml-10">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <strong>Dica:</strong> Para criar novos registros, deixe a coluna "id" em branco e preencha os demais campos (especialmente o nome).
              </AlertDescription>
            </Alert>
          </div>

          {/* Passo 3: Upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-semibold text-slate-900">Fazer Upload</h3>
            </div>
            <p className="text-sm text-slate-600 ml-10">
              Envie a planilha editada. O sistema validará e atualizará os registros.
            </p>
            <div className="ml-10">
              <Label
                htmlFor="bulk-upload"
                className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-400" />
                )}
                <span className="text-sm font-medium text-slate-600">
                  {processing ? 'Processando...' : 'Clique para selecionar arquivo'}
                </span>
                <input
                  id="bulk-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={processing}
                  className="hidden"
                />
              </Label>
            </div>
          </div>

          {/* Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Processando...</span>
                <span className="font-medium text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Resultados */}
          {results && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-900">Processamento Concluído</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{results.success - (results.created || 0)}</p>
                  <p className="text-xs text-green-700">Atualizados</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{results.created || 0}</p>
                  <p className="text-xs text-blue-700">Criados</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-600">{results.skipped}</p>
                  <p className="text-xs text-slate-700">Ignorados</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{results.errors}</p>
                  <p className="text-xs text-red-700">Erros</p>
                </div>
              </div>

              {/* Log de Erros */}
              {errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Log de Erros
                  </h4>
                  <div className="bg-slate-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {errors.map((error, i) => (
                      <p key={i} className="text-xs text-slate-600 font-mono mb-1">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}