import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

export default function OSVolumes({ volumes = [], onChange }) {
  const addVolume = () => {
    const newId = `VOL-${String(volumes.length + 1).padStart(3, '0')}`;
    onChange([...volumes, {
      id_volume: newId,
      quantidade: 1,
      largura: 0,
      altura: 0,
      comprimento: 0,
      peso_bruto: 0,
      m3: 0,
    }]);
  };

  const updateVolume = (index, field, value) => {
    const newVolumes = [...volumes];
    newVolumes[index] = { ...newVolumes[index], [field]: value };
    
    // Calculate M³
    if (field === 'largura' || field === 'altura' || field === 'comprimento') {
      const l = newVolumes[index].largura || 0;
      const a = newVolumes[index].altura || 0;
      const c = newVolumes[index].comprimento || 0;
      newVolumes[index].m3 = (l * a * c) / 1000000; // cm³ to m³
    }
    
    onChange(newVolumes);
  };

  // Garantir que volumes sem quantidade tenham quantidade = 1
  const volumesWithQuantity = volumes.map(v => ({
    ...v,
    quantidade: v.quantidade || 1
  }));

  const removeVolume = (index) => {
    onChange(volumes.filter((_, i) => i !== index));
  };

  const totalVolumes = volumesWithQuantity.reduce((sum, v) => sum + (v.quantidade || 1), 0);
  const totalM3 = volumesWithQuantity.reduce((sum, v) => sum + ((v.m3 || 0) * (v.quantidade || 1)), 0);
  const totalPeso = volumesWithQuantity.reduce((sum, v) => sum + ((v.peso_bruto || 0) * (v.quantidade || 1)), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-900 dark:text-white">Dados dos Volumes</h4>
        <Button onClick={addVolume} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Inserir Volume
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="w-24">Qtd</TableHead>
              <TableHead>Largura (cm)</TableHead>
              <TableHead>Altura (cm)</TableHead>
              <TableHead>Comp. (cm)</TableHead>
              <TableHead>Peso (kg)</TableHead>
              <TableHead>M³</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volumesWithQuantity.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Nenhum volume adicionado. Clique em "Inserir Volume" para começar.
                </TableCell>
              </TableRow>
            ) : (
              volumesWithQuantity.map((vol, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={vol.quantidade || 1}
                      onChange={(e) => updateVolume(index, 'quantidade', parseInt(e.target.value) || 1)}
                      className="h-8 w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={vol.largura}
                      onChange={(e) => updateVolume(index, 'largura', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={vol.altura}
                      onChange={(e) => updateVolume(index, 'altura', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={vol.comprimento}
                      onChange={(e) => updateVolume(index, 'comprimento', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={vol.peso_bruto}
                      onChange={(e) => updateVolume(index, 'peso_bruto', parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {(vol.m3 || 0).toFixed(4)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeVolume(index)}>
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
          <p className="text-sm text-slate-500">Total de Volumes</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{totalVolumes}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">M³ Total</p>
          <p className="text-lg font-bold text-blue-600">{totalM3.toFixed(4)} m³</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Peso Total</p>
          <p className="text-lg font-bold text-amber-600">{totalPeso.toFixed(2)} kg</p>
        </div>
      </div>
    </div>
  );
}