import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, PackageCheck } from 'lucide-react';

function getStatusSeparacao(item) {
  const qtdSol = item.quantidade || 0;
  const qtdSep = item.quantidade_separada || 0;
  if (item.separado || qtdSep >= qtdSol && qtdSol > 0) return 'separado';
  if (qtdSep > 0) return 'parcial';
  return 'pendente';
}

function StatusBadge({ item }) {
  const status = getStatusSeparacao(item);
  const map = {
    separado: 'bg-green-100 text-green-700 border-green-200',
    parcial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    pendente: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  const labels = { separado: 'Separado', parcial: 'Parcial', pendente: 'Pendente' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function OSItensDocumento({ itens = [], onChange }) {
  const addItem = () => {
    onChange([...itens, {
      codigo: '', descricao: '', quantidade: 0, unidade: 'UN',
      r_unit: 0, r_total: 0, deposito: '', endereco: '',
      saldo: 0, seguravel: false, separado: false, quantidade_separada: 0,
    }]);
  };

  const updateItem = (index, field, value) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    if (field === 'quantidade' || field === 'r_unit') {
      newItens[index].r_total = (newItens[index].quantidade || 0) * (newItens[index].r_unit || 0);
    }
    // Auto-marcar separado se qtd_separada >= quantidade
    if (field === 'quantidade_separada') {
      const qtdSep = parseFloat(value) || 0;
      const qtdSol = newItens[index].quantidade || 0;
      if (qtdSol > 0 && qtdSep >= qtdSol) {
        newItens[index].separado = true;
      } else {
        newItens[index].separado = false;
      }
    }
    onChange(newItens);
  };

  const removeItem = (index) => onChange(itens.filter((_, i) => i !== index));

  const totalValor = itens.reduce((sum, item) => sum + (item.r_total || 0), 0);
  const totalSeparados = itens.filter(i => getStatusSeparacao(i) === 'separado').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-slate-900 dark:text-white">Detalhamento dos Materiais</h4>
          {itens.length > 0 && (
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {totalSeparados}/{itens.length} separados
            </span>
          )}
          {itens.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <Checkbox
                checked={itens.every(i => i.separado)}
                onCheckedChange={(checked) => onChange(itens.map(i => ({ ...i, separado: checked, quantidade_separada: checked ? i.quantidade : 0 })))}
              />
              Marcar todos como conferidos
            </label>
          )}
        </div>
        <Button onClick={addItem} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Inserir Item
        </Button>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {itens.length === 0 ? (
          <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <PackageCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum item adicionado. Clique em "Inserir Item" para começar.</p>
          </div>
        ) : (
          itens.map((item, index) => {
            const status = getStatusSeparacao(item);
            return (
              <div
                key={index}
                className={`rounded-xl border transition-colors ${
                  status === 'separado'
                    ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800'
                    : status === 'parcial'
                    ? 'border-yellow-200 bg-yellow-50/30 dark:bg-yellow-900/10 dark:border-yellow-800'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Linha 1: cb(24) | código(112) | descrição(flex) | Qtd Sol(96) | UN(52) | Qtd Sep(96) | Status(80) */}
                {/* Fixos linha 1: 24+112+96+52+96+80 = 460 + 6gaps(48) = 508 → flex-1 ≈ resto */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="shrink-0 w-6 flex justify-center">
                    <Checkbox
                      checked={item.separado || false}
                      onCheckedChange={(v) => {
                        const newItens = [...itens];
                        newItens[index] = { ...newItens[index], separado: v, quantidade_separada: v ? newItens[index].quantidade : 0 };
                        onChange(newItens);
                      }}
                    />
                  </div>
                  <div className="w-28 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Código</p>
                    <Input value={item.codigo} onChange={(e) => updateItem(index, 'codigo', e.target.value)} className="h-7 text-xs font-mono" placeholder="Código" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Descrição</p>
                    <Input value={item.descricao} onChange={(e) => updateItem(index, 'descricao', e.target.value)} className="h-7 text-xs" placeholder="Descrição" />
                  </div>
                  <div className="w-24 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Qtd Sol.</p>
                    <Input type="number" value={item.quantidade} onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                  </div>
                  <div className="shrink-0" style={{width: '52px'}}>
                    <p className="text-[10px] text-slate-400 mb-0.5">UN</p>
                    <Input value={item.unidade} onChange={(e) => updateItem(index, 'unidade', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="w-24 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Qtd Sep.</p>
                    <Input type="number" value={item.quantidade_separada || 0} onChange={(e) => updateItem(index, 'quantidade_separada', parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                  </div>
                  {/* Status = Segurável(52) + gap(8) + Delete(32) = 92px */}
                  <div className="shrink-0" style={{width: '92px'}}>
                    <p className="text-[10px] text-slate-400 mb-0.5">Status</p>
                    <StatusBadge item={item} />
                  </div>
                </div>

                {/* Linha 2: espaço(24) | Depósito(112) | Localização(flex) | Saldo(80) | R$Unit(96) | R$Total(96) | Segurável(52) | Delete(32) */}
                {/* Fixos linha 2: 24+112+80+96+96+52+32 = 492 + 7gaps(56) = 548 → flex-1 = mesmo espaço restante de linha 1 */}
                <div className="flex items-center gap-2 px-3 pb-2 border-t border-dashed border-slate-200 dark:border-slate-700 pt-2">
                  <div className="shrink-0 w-6" />
                  <div className="w-28 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Depósito</p>
                    <Input value={item.deposito || ''} onChange={(e) => updateItem(index, 'deposito', e.target.value)} className="h-7 text-xs" placeholder="Depósito" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Localização</p>
                    <Input value={item.endereco} onChange={(e) => updateItem(index, 'endereco', e.target.value)} className="h-7 text-xs" placeholder="Endereço" />
                  </div>
                  <div className="w-24 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">Saldo</p>
                    <Input type="number" value={item.saldo} onChange={(e) => updateItem(index, 'saldo', parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                  </div>
                  <div className="w-24 shrink-0">
                    <p className="text-[10px] text-slate-400 mb-0.5">R$ Unit</p>
                    <Input type="number" step="0.01" value={item.r_unit} onChange={(e) => updateItem(index, 'r_unit', parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                  </div>
                  {/* R$ Total = UN(52) + gap(8) + Qtd Sep(96) = 156px */}
                  <div className="shrink-0" style={{width: '156px'}}>
                    <p className="text-[10px] text-slate-400 mb-0.5">R$ Total</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white h-7 flex items-center pl-1">
                      R$ {(item.r_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-center gap-1" style={{width: '52px'}}>
                    <p className="text-[10px] text-slate-400">Segurável</p>
                    <Checkbox checked={item.seguravel} onCheckedChange={(v) => updateItem(index, 'seguravel', v)} />
                  </div>
                  <div className="w-8 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 mt-3" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Totais */}
      {itens.length > 0 && (
        <div className="flex justify-end gap-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="text-right">
            <p className="text-sm text-slate-500">Total de Itens</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{itens.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Separados</p>
            <p className="text-lg font-bold text-green-600">{totalSeparados}/{itens.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Valor Total</p>
            <p className="text-lg font-bold text-blue-600">
              R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}