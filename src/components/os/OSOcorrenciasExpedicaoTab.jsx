import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Aba "Ocorrências" para OS de categoria Expedição.
 * Estrutura similar à aba "Dados Recebimento" de OS de recebimento.
 */
export default function OSOcorrenciasExpedicaoTab({
  formData,
  setFormData,
  problemasExpedicao = [],
  onFileUpload,
  onRemoveFile,
}) {
  const problemasNaoPreenchidos =
    formData.houve_ocorrencia_expedicao &&
    (!formData.problemas_expedicao_ids || formData.problemas_expedicao_ids.length === 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Responsável pelo Relato</Label>
          <Input
            type="text"
            value={formData.responsavel_relato_expedicao || ''}
            onChange={(e) => setFormData({ ...formData, responsavel_relato_expedicao: e.target.value })}
            placeholder="Digite o nome do responsável..."
          />
        </div>
        <div className="space-y-2">
          <Label>Data Relato</Label>
          <Input
            type="date"
            value={formData.data_relato_expedicao || ''}
            onChange={(e) => setFormData({ ...formData, data_relato_expedicao: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Houve um problema? <span className="text-red-500">*</span></Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="houve_ocorrencia_expedicao"
                checked={formData.houve_ocorrencia_expedicao !== true}
                onChange={() => setFormData({ ...formData, houve_ocorrencia_expedicao: false, problemas_expedicao_ids: [] })}
                className="w-4 h-4"
              />
              <span className="text-sm">Não</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="houve_ocorrencia_expedicao"
                checked={formData.houve_ocorrencia_expedicao === true}
                onChange={() => setFormData({ ...formData, houve_ocorrencia_expedicao: true })}
                className="w-4 h-4"
              />
              <span className="text-sm">Sim</span>
            </label>
          </div>
        </div>
      </div>

      {formData.houve_ocorrencia_expedicao && (
        <div className="border-t pt-6 mt-6">
          <div className="space-y-3">
            <Label className="text-sm text-slate-600 dark:text-slate-400">
              Selecione o(s) problema(s) identificado(s): <span className="text-red-600 font-semibold">*</span>
            </Label>
            <div className={`space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4 ${problemasNaoPreenchidos ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700' : 'bg-slate-50 dark:bg-slate-800'}`}>
              {problemasExpedicao.map((problema) => (
                <div key={problema.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`problema-exp-${problema.id}`}
                    checked={formData.problemas_expedicao_ids?.includes(problema.id)}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        problemas_expedicao_ids: checked
                          ? [...(formData.problemas_expedicao_ids || []), problema.id]
                          : (formData.problemas_expedicao_ids || []).filter(id => id !== problema.id)
                      });
                    }}
                  />
                  <Label htmlFor={`problema-exp-${problema.id}`} className="cursor-pointer text-sm flex-1">
                    <span className="font-medium">{problema.descricao_resumida}</span>
                    {problema.explicacao && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{problema.explicacao}</p>
                    )}
                  </Label>
                </div>
              ))}
              {problemasExpedicao.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Nenhum problema cadastrado</p>
              )}
            </div>
            {problemasNaoPreenchidos && (
              <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                É obrigatório selecionar pelo menos um problema quando "Houve um problema?" é marcado como Sim
              </p>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Resumo da Ocorrência</Label>
              <Textarea
                value={formData.resumo_ocorrencia_expedicao || ''}
                onChange={(e) => setFormData({ ...formData, resumo_ocorrencia_expedicao: e.target.value })}
                placeholder="Descreva resumidamente a ocorrência..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Ações de Acompanhamento</Label>
              <Textarea
                value={formData.acoes_acompanhamento_expedicao || ''}
                onChange={(e) => setFormData({ ...formData, acoes_acompanhamento_expedicao: e.target.value })}
                placeholder="Descreva as ações de acompanhamento necessárias..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Como foi solucionado</Label>
              <Textarea
                value={formData.como_foi_solucionado_expedicao || ''}
                onChange={(e) => setFormData({ ...formData, como_foi_solucionado_expedicao: e.target.value })}
                placeholder="Descreva como o problema foi solucionado..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Solução</Label>
                <Input
                  type="date"
                  value={formData.data_solucao_expedicao || ''}
                  onChange={(e) => setFormData({ ...formData, data_solucao_expedicao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Anexos da Ocorrência</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    multiple
                    className="cursor-pointer"
                    id="ocorrencias-expedicao-anexos-upload"
                    onChange={(e) => onFileUpload?.(e, 'ocorrencias_expedicao_anexos')}
                  />
                </div>
                {formData.ocorrencias_expedicao_anexos?.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {(formData.ocorrencias_expedicao_anexos || []).map((url, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                          Anexo {i + 1}
                        </a>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveFile?.('ocorrencias_expedicao_anexos', i)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}