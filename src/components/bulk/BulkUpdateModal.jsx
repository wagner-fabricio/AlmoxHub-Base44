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

  // Gerar template Excel
  const handleExportTemplate = async () => {
    try {
      // Buscar dados existentes
      const data = await base44.entities[entityName].list();
      
      if (!data || data.length === 0) {
        alert('Nenhum registro encontrado para exportar');
        return;
      }

      // Tentar buscar schema, mas continuar se falhar
      let schemaFields = [];
      try {
        const schema = await base44.entities[entityName].schema();
        schemaFields = Object.keys(schema?.properties || {}).filter(
          key => !['created_date', 'updated_date', 'created_by'].includes(key)
        );
      } catch (schemaError) {
        console.log('Schema not available, using data keys');
        // Se schema não estiver disponível, coletar todos os campos dos dados
        const allKeys = new Set();
        data.forEach(item => {
          Object.keys(item).forEach(key => {
            if (!['id', 'created_date', 'updated_date', 'created_by'].includes(key)) {
              allKeys.add(key);
            }
          });
        });
        schemaFields = Array.from(allKeys);
      }

      // Preparar dados para Excel com todos os campos
      const excelData = data.map(item => {
        const row = { id: item.id };
        
        // Adicionar todos os campos na ordem
        schemaFields.forEach(key => {
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
          // Tentar parsear string como array
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                return { valid: true, value: parsed };
              }
            } catch {
              // Tentar split por vírgula
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

  // Obter tipo de campo do schema
  const getFieldType = (schema, fieldName) => {
    if (!schema?.properties?.[fieldName]) return 'string';
    const prop = schema.properties[fieldName];
    
    if (prop.type === 'array') return 'array';
    if (prop.type === 'number' || prop.type === 'integer') return 'number';
    if (prop.type === 'boolean') return 'boolean';
    return 'string';
  };

  // Processar arquivo
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setProgress(0);
    setErrors([]);
    setResults(null);

    try {
      // Ler arquivo
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('Arquivo vazio');
      }

      // Validar se tem coluna ID
      if (!jsonData[0].hasOwnProperty('id')) {
        throw new Error('Arquivo deve conter a coluna "id"');
      }

      // Buscar schema da entidade
      const schema = await base44.entities[entityName].schema();

      // Processar cada linha
      const errorLog = [];
      let successCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2; // +2 porque Excel começa em 1 e tem header
        
        setProgress(Math.round(((i + 1) / jsonData.length) * 100));

        try {
          const id = row.id;
          
          if (!id) {
            errorLog.push(`Linha ${rowNumber}: ID vazio, registro ignorado`);
            skippedCount++;
            continue;
          }

          // Preparar dados para update
          const updateData = {};
          let hasChanges = false;

          for (const [key, value] of Object.entries(row)) {
            if (key === 'id' || key === 'created_date' || key === 'updated_date' || key === 'created_by') {
              continue;
            }

            // Validar tipo
            const fieldType = getFieldType(schema, key);
            const validation = validateFieldValue(value, fieldType, key);

            if (!validation.valid) {
              throw new Error(validation.error);
            }

            if (validation.value !== null && validation.value !== undefined && validation.value !== '') {
              updateData[key] = validation.value;
              hasChanges = true;
            }
          }

          // Só atualizar se houver mudanças
          if (hasChanges) {
            await base44.entities[entityName].update(id, updateData);
            successCount++;
          } else {
            skippedCount++;
          }

        } catch (error) {
          errorLog.push(`Linha ${rowNumber}: ${error.message}`);
          skippedCount++;
        }
      }

      setResults({
        total: jsonData.length,
        success: successCount,
        skipped: skippedCount,
        errors: errorLog.length
      });
      setErrors(errorLog);

      if (successCount > 0) {
        onRefresh?.();
      }

    } catch (error) {
      alert(`Erro ao processar arquivo: ${error.message}`);
    } finally {
      setProcessing(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleClose = () => {
    setResults(null);
    setErrors([]);
    setProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
              Baixe a planilha com todos os registros existentes. Cada linha contém o ID único para atualização.
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
              Edite os campos desejados. <strong>Não remova a coluna "id"</strong> - ela identifica qual registro será atualizado.
            </p>
            <Alert className="ml-10">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <strong>Importante:</strong> Deixe a coluna "id" intacta. Apenas edite os valores dos campos que deseja atualizar.
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

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{results.success}</p>
                  <p className="text-xs text-green-700">Atualizados</p>
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