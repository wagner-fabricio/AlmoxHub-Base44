import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck } from 'lucide-react';

export default function OSRecebimentoTransportador({ transportador, onChange }) {
  const handleChange = (field, value) => {
    const updated = { ...transportador, [field]: value };
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="w-5 h-5" />
          Dados do Transportador
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Razão Social</Label>
            <Input
              value={transportador?.razao_social || ''}
              onChange={(e) => handleChange('razao_social', e.target.value)}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input
              value={transportador?.cnpj || ''}
              onChange={(e) => handleChange('cnpj', e.target.value)}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label>Inscrição Estadual</Label>
            <Input
              value={transportador?.inscricao_estadual || ''}
              onChange={(e) => handleChange('inscricao_estadual', e.target.value)}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Endereço</Label>
            <Input
              value={transportador?.endereco || ''}
              onChange={(e) => handleChange('endereco', e.target.value)}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Frete</Label>
            <Input
              value={transportador?.tipo_frete || ''}
              onChange={(e) => handleChange('tipo_frete', e.target.value)}
              placeholder="CIF, FOB, etc."
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label>Valor do Frete</Label>
            <Input
              type="number"
              value={transportador?.valor_frete || 0}
              onChange={(e) => handleChange('valor_frete', parseFloat(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label>Quantidade de Volumes</Label>
            <Input
              type="number"
              value={transportador?.quantidade_volumes || 0}
              onChange={(e) => handleChange('quantidade_volumes', parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label>Espécie de Volume</Label>
            <Input
              value={transportador?.especie_volume || ''}
              onChange={(e) => handleChange('especie_volume', e.target.value)}
              placeholder="Caixa, Pallet, etc."
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label>Peso Bruto (kg)</Label>
            <Input
              type="number"
              value={transportador?.peso_bruto || 0}
              onChange={(e) => handleChange('peso_bruto', parseFloat(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label>Peso Líquido (kg)</Label>
            <Input
              type="number"
              value={transportador?.peso_liquido || 0}
              onChange={(e) => handleChange('peso_liquido', parseFloat(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}