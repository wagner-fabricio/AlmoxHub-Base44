import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PackageCheck, AlertCircle, Plus, Trash2 } from 'lucide-react';

function getStatusConferencia(item) {
  const qtdEsp = item.quantidade_esperada || 0;
  const qtdRec = item.quantidade_recebida || 0;
  if (qtdRec === 0) return 'pendente';
  if (qtdRec < qtdEsp) return 'parcial';
  if (qtdRec === qtdEsp) return 'completo';
  return 'excedente';
}

function StatusBadge({ status }) {
  const map = {
    pendente: 'bg-slate-100 text-slate-600 border-slate-200',
    parcial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    completo: 'bg-green-100 text-green-700 border-green-200',
    excedente: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  const labels = { pendente: 'Pendente', parcial: 'Parcial', completo: 'Completo', excedente: 'Excedente' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function OSRecebimentoMateriais({ itens, fluxo, onChange, nfeData }) {
  const addItem = () => {
    const novoItem = {
      codigo: '', descricao: '', quantidade_esperada: 0, quantidade_recebida: 0,
      unidade: 'UN', status_conferencia: 'pendente', endereco_armazenagem: '', valor_unitario: 0
    };
    onChange({ itens: [...itens, novoItem], fluxo });
  };

  const removeItem = (index) => {
    onChange({ itens: itens.filter((_, i) => i !== index), fluxo });
  };

  const recalcFluxo = (newItens, fluxoBase) => {
    const novoFluxo = { ...fluxoBase };
    const todosCompletos = newItens.length > 0 && newItens.every(i => i.status_conferencia === 'completo' || i.status_conferencia === 'excedente');
    const semDivergencia = newItens.length > 0 && newItens.every(i => i.status_conferencia === 'completo');
    const todosComEndereco = newItens.length > 0 && newItens.every(i => i.endereco_armazenagem && i.endereco_armazenagem.trim() !== '');

    novoFluxo.conferencia_manual_completa = !!todosCompletos;
    novoFluxo.validacao_divergencias_completa = !!(todosCompletos && semDivergencia);
    novoFluxo.armazenagem_completa = !!(todosCompletos && todosComEndereco);

    let etapa = 1;
    if (novoFluxo.xml_importado) etapa = 2;
    if (novoFluxo.conferencia_manual_completa) etapa = 3;
    if (novoFluxo.validacao_divergencias_completa) etapa = 4;
    if (novoFluxo.armazenagem_completa) etapa = 4;
    novoFluxo.etapa_atual = etapa;
    return novoFluxo;
  };

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };

    const qtdEsp = newItens[index].quantidade_esperada;
    const qtdRec = newItens[index].quantidade_recebida;

    if (qtdRec === 0) newItens[index].status_conferencia = 'pendente';
    else if (qtdRec < qtdEsp) newItens[index].status_conferencia = 'parcial';
    else if (qtdRec === qtdEsp) newItens[index].status_conferencia = 'completo';
    else newItens[index].status_conferencia = 'excedente';

    onChange({ itens: newItens, fluxo: recalcFluxo(newItens, fluxo) });
  };

  const handleCheckItem = (index) => {
    const item = itens[index];
    const isChecked = item.quantidade_recebida === item.quantidade_esperada && item.quantidade_esperada > 0;
    handleItemChange(index, 'quantidade_recebida', isChecked ? 0 : item.quantidade_esperada);
  };

  const handleCheckAll = (checked) => {
    const newItens = itens.map(item => ({
      ...item,
      quantidade_recebida: checked ? item.quantidade_esperada : 0,
      status_conferencia: checked ? 'completo' : 'pendente',
    }));
    onChange({ itens: newItens, fluxo: recalcFluxo(newItens, fluxo) });
  };

  const itemsComStatus = itens.map(item => ({ ...item, status_conferencia: item.status_conferencia || 'pendente' }));
  const totalEsperado = itemsComStatus.reduce((s, i) => s + (parseFloat(i.quantidade_esperada) || 0), 0);
  const totalRecebido = itemsComStatus.reduce((s, i) => s + (parseFloat(i.quantidade_recebida) || 0), 0);
  const totalValor = itemsComStatus.reduce((s, i) => s + ((i.quantidade_esperada || 0) * (i.valor_unitario || 0)), 0);
  const totalCompletos = itemsComStatus.filter(i => i.status_conferencia === 'completo' || i.status_conferencia === 'excedente').length;
  const allChecked = itemsComStatus.length > 0 && itemsComStatus.every(i => i.quantidade_recebida === i.quantidade_esperada && i.quantidade_esperada > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Conferência de Materiais</h4>
          </div>
          {itemsComStatus.length > 0 && (
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {totalCompletos}/{itemsComStatus.length} conferidos
            </span>
          )}
          {itemsComStatus.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <Checkbox checked={allChecked} onCheckedChange={handleCheckAll} />
              Marcar todos como conferidos
            </label>
          )}
          {itemsComStatus.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <Checkbox
                checked={itemsComStatus.every(i => i.endereco_armazenagem === 'N/A')}
                onCheckedChange={(checked) => {
                  const newItens = itens.map(i => ({ ...i, endereco_armazenagem: checked ? 'N/A' : '' }));
                  onChange({ itens: newItens, fluxo: recalcFluxo(newItens, fluxo) });
                }}
              />
              Endereço N/A para todos
            </label>
          )}
        </div>
        <Button onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Material
        </Button>
      </div>

      {itemsComStatus.length === 0 ? (
        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum item adicionado. Faça upload do XML na aba "Anexos" ou clique em "Adicionar Material".</p>
        </div>
      ) : (
        <div className="space-y-2">
          {itemsComStatus.map((item, index) => {
            const status = item.status_conferencia;
            const isChecked = item.quantidade_recebida === item.quantidade_esperada && item.quantidade_esperada > 0;
            const valorTotal = (item.quantidade_esperada || 0) * (item.valor_unitario || 0);
            return (
              <div
                key={index}
                className={`rounded-xl border transition-colors ${
                  status === 'completo'
                    ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800'
                    : status === 'parcial'
                    ? 'border-yellow-200 bg-yellow-50/30 dark:bg-yellow-900/10 dark:border-yellow-800'
                    : status === 'excedente'
                    ? 'border-blue-200 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-800'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Linha 1: cb(24) | código(112) | descrição(flex) | Qtd Esp.(96) | UN(52) | Qtd Rec.(96) | Status(92) */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="shrink-0 w-6 flex justify-center">
                    <Checkbox checked={isChecked} onCheckedChange={() => handleCheckItem(index)} />
                  </div>
                  <div className="w-28 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Código</p>
                    <Input value={item.codigo || ''} onChange={(e) => handleItemChange(index, 'codigo', e.target.value)} className="h-7 text-xs font-mono" placeholder="Código" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Descrição</p>
                    <Input value={item.descricao || ''} onChange={(e) => handleItemChange(index, 'descricao', e.target.value)} className="h-7 text-xs" placeholder="Descrição" />
                  </div>
                  <div className="w-24 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Qtd Esperada</p>
                    <Input type="number" value={item.quantidade_esperada || 0} onChange={(e) => handleItemChange(index, 'quantidade_esperada', parseFloat(e.target.value) || 0)} className="h-7 text-xs" min="0" />
                  </div>
                  <div className="shrink-0" style={{width: '52px'}}>
                    <p className="text-[10px] text-slate-400 mb-0.5">UN</p>
                    <Input value={item.unidade || 'UN'} onChange={(e) => handleItemChange(index, 'unidade', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="w-24 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Qtd Recebida</p>
                    <Input type="number" value={item.quantidade_recebida || 0} onChange={(e) => handleItemChange(index, 'quantidade_recebida', parseFloat(e.target.value) || 0)} className="h-7 text-xs" min="0" />
                  </div>
                  {/* Status = 92px (alinhado com Segurável+Delete da OS expedição) */}
                  <div className="shrink-0" style={{width: '92px'}}>
                    <p className="text-[10px] text-slate-400 mb-0.5">Status</p>
                    <StatusBadge status={status} />
                  </div>
                </div>

                {/* Linha 2: espaço(24) | espaço(112) | Endereço(flex) | R$ Unit.(96) | R$ Total(156) | Delete(92) */}
                <div className="flex items-center gap-2 px-3 pb-2 border-t border-dashed border-slate-200 dark:border-slate-700 pt-2">
                  <div className="shrink-0 w-6" />
                  <div className="w-28 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Nº Série/Referência</p>
                    <Input value={item.num_serie || ''} onChange={(e) => handleItemChange(index, 'num_serie', e.target.value)} className="h-7 text-xs" placeholder="Nº Série" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Endereço Armazenagem</p>
                    <Input value={item.endereco_armazenagem || ''} onChange={(e) => handleItemChange(index, 'endereco_armazenagem', e.target.value)} className="h-7 text-xs" placeholder="Ex: A-01-01" />
                  </div>
                  <div className="w-24 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">R$ Unit.</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white h-7 flex items-center justify-start pl-1">
                      {(item.valor_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  {/* R$ Total = UN(52) + gap(8) + Qtd Rec(96) = 156px */}
                  <div className="shrink-0" style={{width: '156px'}}>
                    <p className="text-[10px] text-slate-400 mb-0.5">R$ Total</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white h-7 flex items-center justify-start pl-1">
                      {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center justify-end" style={{width: '92px'}}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Totais */}
      {itemsComStatus.length > 0 && (
        <div className="flex justify-end gap-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="text-right">
            <p className="text-sm text-slate-500">Total de Itens</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{itemsComStatus.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Qtd Esperada</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{totalEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Qtd Recebida</p>
            <p className="text-lg font-bold text-green-600">{totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Valor Total</p>
            <p className="text-lg font-bold text-blue-600">{totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>
      )}

      {/* Dados da NF */}
      {nfeData && itemsComStatus.length > 0 && (
        <div className="flex gap-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400">
          <span><span className="font-medium">Volumes:</span> {nfeData.volumes || '-'}</span>
          <span><span className="font-medium">Peso Líquido:</span> {nfeData.peso_liquido ? `${parseFloat(nfeData.peso_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : '-'}</span>
          <span><span className="font-medium">Peso Bruto:</span> {nfeData.peso_bruto ? `${parseFloat(nfeData.peso_bruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : '-'}</span>
        </div>
      )}
    </div>
  );
}