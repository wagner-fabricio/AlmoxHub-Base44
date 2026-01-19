import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PackageCheck, AlertCircle, CheckCircle, TrendingDown, Plus, Trash2 } from 'lucide-react';

export default function OSRecebimentoMateriais({ itens, fluxo, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null);

  const addItem = () => {
    const novoItem = {
      codigo: '',
      descricao: '',
      quantidade_esperada: 0,
      quantidade_recebida: 0,
      unidade: 'UN',
      status_conferencia: 'pendente',
      endereco_armazenagem: ''
    };
    onChange({ itens: [...itens, novoItem], fluxo });
  };

  const removeItem = (index) => {
    const newItens = itens.filter((_, i) => i !== index);
    onChange({ itens: newItens, fluxo });
  };

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    
    // Atualizar status baseado na comparação
    const qtdEsperada = newItens[index].quantidade_esperada;
    const qtdRecebida = newItens[index].quantidade_recebida;
    
    if (qtdRecebida === 0) {
      newItens[index].status_conferencia = 'pendente';
    } else if (qtdRecebida < qtdEsperada) {
      newItens[index].status_conferencia = 'parcial';
    } else if (qtdRecebida === qtdEsperada) {
      newItens[index].status_conferencia = 'completo';
    } else if (qtdRecebida > qtdEsperada) {
      newItens[index].status_conferencia = 'excedente';
    }

    // Atualizar fluxo se todos os itens estão conferidos
    const todosCompletos = newItens.every(item => item.status_conferencia === 'completo' || item.status_conferencia === 'excedente');
    const novoFluxo = { ...fluxo };
    if (todosCompletos && !novoFluxo.conferencia_manual_completa) {
      novoFluxo.conferencia_manual_completa = true;
      novoFluxo.etapa_atual = 3;
    }

    onChange({ itens: newItens, fluxo: novoFluxo });
  };

  const getStatusBadge = (status) => {
    const configs = {
      pendente: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-100', label: 'Pendente' },
      parcial: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-100', label: 'Parcial' },
      completo: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-100', label: 'Completo' },
      excedente: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-100', label: 'Excedente' }
    };
    const config = configs[status] || configs.pendente;
    return <Badge className={`${config.bg} ${config.text} border-0`}>{config.label}</Badge>;
  };

  const itemsComStatus = itens.map(item => ({
    ...item,
    status_conferencia: item.status_conferencia || 'pendente'
  }));

  const conferenciaProgress = itemsComStatus.length > 0
    ? Math.round((itemsComStatus.filter(i => i.status_conferencia !== 'pendente').length / itemsComStatus.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Materiais Recebidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackageCheck className="w-5 h-5" />
              Conferência de Materiais
            </CardTitle>
            <Button onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Material
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {itemsComStatus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>Nenhum item importado. Faça upload do XML na aba "Anexos"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="font-semibold">Código</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold text-center">Esperado</TableHead>
                    <TableHead className="font-semibold text-center">Recebido</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold">Endereço</TableHead>
                    <TableHead className="font-semibold w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsComStatus.map((item, index) => (
                    <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-mono text-sm">
                        <Input
                          value={item.codigo || ''}
                          onChange={(e) => handleItemChange(index, 'codigo', e.target.value)}
                          placeholder="Código"
                          className="h-8 text-sm font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.descricao || ''}
                          onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                          placeholder="Descrição"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={item.quantidade_esperada || 0}
                            onChange={(e) => handleItemChange(index, 'quantidade_esperada', parseFloat(e.target.value) || 0)}
                            className="w-16 text-center h-8 text-sm"
                            min="0"
                          />
                          <Input
                            value={item.unidade || 'UN'}
                            onChange={(e) => handleItemChange(index, 'unidade', e.target.value)}
                            className="w-16 text-center h-8 text-sm"
                            placeholder="UN"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          value={item.quantidade_recebida || 0}
                          onChange={(e) => handleItemChange(index, 'quantidade_recebida', parseFloat(e.target.value) || 0)}
                          className="w-20 text-center h-8 text-sm"
                          min="0"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(item.status_conferencia)}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.endereco_armazenagem || ''}
                          onChange={(e) => handleItemChange(index, 'endereco_armazenagem', e.target.value)}
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