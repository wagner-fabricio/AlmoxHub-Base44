import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

export default function OSItensDocumento({ itens = [], onChange }) {
  const addItem = () => {
    onChange([...itens, {
      codigo: '',
      descricao: '',
      quantidade: 0,
      unidade: 'UN',
      r_unit: 0,
      r_total: 0,
      endereco: '',
      saldo: 0,
      seguravel: false,
    }]);
  };

  const updateItem = (index, field, value) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    
    // Calculate r_total
    if (field === 'quantidade' || field === 'r_unit') {
      newItens[index].r_total = (newItens[index].quantidade || 0) * (newItens[index].r_unit || 0);
    }
    
    onChange(newItens);
  };

  const removeItem = (index) => {
    onChange(itens.filter((_, i) => i !== index));
  };

  const totalQuantidade = itens.reduce((sum, item) => sum + (item.quantidade || 0), 0);
  const totalValor = itens.reduce((sum, item) => sum + (item.r_total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-900 dark:text-white">Detalhamento dos Materiais</h4>
        <Button onClick={addItem} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Inserir Item
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-20">Qtd</TableHead>
              <TableHead className="w-16">UN</TableHead>
              <TableHead className="w-24">R$ Unit</TableHead>
              <TableHead className="w-24">R$ Total</TableHead>
              <TableHead className="w-24">Endereço</TableHead>
              <TableHead className="w-20">Saldo</TableHead>
              <TableHead className="w-20">Segurável</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                  Nenhum item adicionado. Clique em "Inserir Item" para começar.
                </TableCell>
              </TableRow>
            ) : (
              itens.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={item.codigo}
                      onChange={(e) => updateItem(index, 'codigo', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.descricao}
                      onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.unidade}
                      onChange={(e) => updateItem(index, 'unidade', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.r_unit}
                      onChange={(e) => updateItem(index, 'r_unit', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-900 dark:text-white">
                      R$ {(item.r_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.endereco}
                      onChange={(e) => updateItem(index, 'endereco', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.saldo}
                      onChange={(e) => updateItem(index, 'saldo', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={item.seguravel}
                      onCheckedChange={(v) => updateItem(index, 'seguravel', v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Totais */}
      <div className="flex justify-end gap-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <div className="text-right">
          <p className="text-sm text-slate-500">Total de Itens</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{totalQuantidade}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Valor Total</p>
          <p className="text-lg font-bold text-blue-600">
            R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}