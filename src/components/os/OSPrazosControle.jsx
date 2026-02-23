import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export default function OSPrazosControle({ 
  formData, 
  setFormData, 
  prazoError, 
  setPrazoError, 
  projetos,
  isExpedicaoCategory,
  isRecebimentoCategory
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
        Prazos e Controle
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Data Inicial */}
        <div className="space-y-2">
          <Label className="text-slate-700 dark:text-slate-300 font-medium">Data Inicial</Label>
          <Input
            type="date"
            value={formData.data_inicial}
            onChange={(e) => {
              const novaDataInicial = e.target.value;
              if (formData.prazo && novaDataInicial && new Date(formData.prazo) < new Date(novaDataInicial)) {
                setPrazoError('O prazo não pode ser anterior à data inicial');
              } else {
                setPrazoError('');
              }
              setFormData({ ...formData, data_inicial: novaDataInicial });
            }}
            className="border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Prazo */}
        <div className="space-y-2">
          <Label className="text-slate-700 dark:text-slate-300 font-medium">Prazo *</Label>
          <Input
            type="date"
            value={formData.prazo}
            min={formData.data_inicial}
            onChange={(e) => {
              const novoPrazo = e.target.value;
              if (novoPrazo && formData.data_inicial && new Date(novoPrazo) < new Date(formData.data_inicial)) {
                setPrazoError('O prazo não pode ser anterior à data inicial');
              } else {
                setPrazoError('');
              }
              setFormData({ ...formData, prazo: novoPrazo });
            }}
            className={prazoError ? 'border-red-500 rounded-lg' : 'border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600'}
          />
          {prazoError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{prazoError}</p>
          )}
        </div>

        {/* Data de Conclusão */}
        <div className="space-y-2">
          <Label className="text-slate-700 dark:text-slate-300 font-medium">Data de Conclusão</Label>
          <Input
            type="date"
            value={formData.data_conclusao}
            onChange={(e) => setFormData({ ...formData, data_conclusao: e.target.value })}
            className="border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Prioridade */}
        <div className="space-y-2">
          <Label className="text-slate-700 dark:text-slate-300 font-medium">Prioridade</Label>
          <Select
            value={formData.prioridade}
            onValueChange={(v) => setFormData({ ...formData, prioridade: v })}
          >
            <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-slate-700 dark:text-slate-300 font-medium">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData({ ...formData, status: v })}
          >
            <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elaboracao">Em Elaboração</SelectItem>
              <SelectItem value="execucao">Em Execução</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Progresso */}
        <div className="space-y-2">
          <Label className="text-slate-700 dark:text-slate-300 font-medium">Progresso (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.progresso || 0}
            onChange={(e) => setFormData({ ...formData, progresso: parseInt(e.target.value) || 0 })}
            disabled={isExpedicaoCategory || isRecebimentoCategory}
            className={(isExpedicaoCategory || isRecebimentoCategory) ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed rounded-lg' : 'border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600'}
          />
          {!isExpedicaoCategory && !isRecebimentoCategory && (
            <Slider
              value={[formData.progresso || 0]}
              onValueChange={(value) => setFormData({ ...formData, progresso: value[0] })}
              min={0}
              max={100}
              step={1}
              className="mt-3 [&_.slider-track]:bg-slate-200 dark:[&_.slider-track]:bg-slate-700 [&_.slider-range]:bg-gradient-to-r [&_.slider-range]:from-[#22c55e] [&_.slider-range]:to-[#84cc16] [&_.slider-thumb]:border-[#22c55e] [&_.slider-thumb]:bg-white"
            />
          )}
          {isExpedicaoCategory && (
            <p className="text-xs text-slate-500 mt-1">Progresso automático baseado no fluxo de expedição</p>
          )}
          {isRecebimentoCategory && (
            <p className="text-xs text-slate-500 mt-1">Progresso automático baseado no fluxo de recebimento</p>
          )}
        </div>
      </div>
    </div>
  );
}