import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PackageCheck, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function OSAtendimentoMateriais({ itens = [], onChange }) {
  const addItem = () => {
    onChange([...itens, { codigo: '', descricao: '', quantidade: '', endereco_armazenagem: '' }]);
  };

  const removeItem = (index) => {
    onChange(itens.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...itens];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackageCheck className="w-5 h-5" />
              Materiais do Atendimento
            </CardTitle>
            <Button onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Material
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>Nenhum material adicionado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="font-semibold">Código</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold w-28">Quantidade</TableHead>
                    <TableHead className="font-semibold">Endereço</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item, index) => (
                    <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <Input
                          value={item.codigo || ''}
                          onChange={(e) => handleChange(index, 'codigo', e.target.value)}
                          placeholder="Código"
                          className="h-8 text-sm font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.descricao || ''}
                          onChange={(e) => handleChange(index, 'descricao', e.target.value)}
                          placeholder="Descrição"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantidade || ''}
                          onChange={(e) => handleChange(index, 'quantidade', e.target.value)}
                          placeholder="Qtd"
                          className="h-8 text-sm w-24"
                          min="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.endereco_armazenagem || ''}
                          onChange={(e) => handleChange(index, 'endereco_armazenagem', e.target.value)}
                          placeholder="Ex: A-01-01"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}