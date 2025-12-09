import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export default function OSDetalhamentoExpedicao({ detalhamento = [], onChange }) {
  const addItem = () => {
    onChange([...detalhamento, {
      tipo_doc: '',
      num_doc: '',
      num_vol: 0,
      peso: 0,
      valor_total: 0,
      detalhes_remessa: '',
      data_expedicao: '',
    }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...detalhamento];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const removeItem = (index) => {
    onChange(detalhamento.filter((_, i) => i !== index));
  };

  const totalVolumes = detalhamento.reduce((sum, item) => sum + (item.num_vol || 0), 0);
  const totalPeso = detalhamento.reduce((sum, item) => sum + (item.peso || 0), 0);
  const totalValor = detalhamento.reduce((sum, item) => sum + (item.valor_total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-900 dark:text-white">Detalhamento da Expedição</h4>
        <Button onClick={addItem} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Inserir Item
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead>Tipo Doc</TableHead>
              <TableHead>Nº Doc</TableHead>
              <TableHead className="w-20">Nº Vol</TableHead>
              <TableHead className="w-24">Peso (kg)</TableHead>
              <TableHead className="w-28">Valor Total</TableHead>
              <TableHead>Detalhes Remessa</TableHead>
              <TableHead className="w-32">Data Expedição</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detalhamento.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  Nenhum item de expedição adicionado.
                </TableCell>
              </TableRow>
            ) : (
              detalhamento.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={item.tipo_doc}
                      onValueChange={(v) => updateItem(index, 'tipo_doc', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nf">NF</SelectItem>
                        <SelectItem value="danfe">DANFE</SelectItem>
                        <SelectItem value="cte">CT-e</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.num_doc}
                      onChange={(e) => updateItem(index, 'num_doc', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.num_vol}
                      onChange={(e) => updateItem(index, 'num_vol', parseInt(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.peso}
                      onChange={(e) => updateItem(index, 'peso', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.valor_total}
                      onChange={(e) => updateItem(index, 'valor_total', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.detalhes_remessa}
                      onChange={(e) => updateItem(index, 'detalhes_remessa', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={item.data_expedicao}
                      onChange={(e) => updateItem(index, 'data_expedicao', e.target.value)}
                      className="h-8"
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
          <p className="text-sm text-slate-500">Total Volumes</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{totalVolumes}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Peso Total</p>
          <p className="text-lg font-bold text-amber-600">{totalPeso.toFixed(2)} kg</p>
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