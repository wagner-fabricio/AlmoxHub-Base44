import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';

export default function OSRecebimentoDocumento({ emissor, destinatario, onChange }) {
  const handleEmissorChange = (field, value) => {
    const updated = { ...emissor, [field]: value };
    onChange({ emissor: updated, destinatario });
  };

  const handleDestinatarioChange = (field, value) => {
    const updated = { ...destinatario, [field]: value };
    onChange({ emissor, destinatario: updated });
  };

  return (
    <div className="space-y-6">
      {/* Emissor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Dados do Emissor (Fornecedor)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input
                value={emissor?.razao_social || ''}
                onChange={(e) => handleEmissorChange('razao_social', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={emissor?.cnpj || ''}
                onChange={(e) => handleEmissorChange('cnpj', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input
                value={emissor?.inscricao_estadual || ''}
                onChange={(e) => handleEmissorChange('inscricao_estadual', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={emissor?.endereco || ''}
                onChange={(e) => handleEmissorChange('endereco', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={emissor?.numero || ''}
                onChange={(e) => handleEmissorChange('numero', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Complemento</Label>
              <Input
                value={emissor?.complemento || ''}
                onChange={(e) => handleEmissorChange('complemento', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={emissor?.bairro || ''}
                onChange={(e) => handleEmissorChange('bairro', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={emissor?.cidade || ''}
                onChange={(e) => handleEmissorChange('cidade', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                value={emissor?.estado || ''}
                onChange={(e) => handleEmissorChange('estado', e.target.value)}
                maxLength="2"
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={emissor?.cep || ''}
                onChange={(e) => handleEmissorChange('cep', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destinatário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Dados do Destinatário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input
                value={destinatario?.razao_social || ''}
                onChange={(e) => handleDestinatarioChange('razao_social', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={destinatario?.cnpj || ''}
                onChange={(e) => handleDestinatarioChange('cnpj', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input
                value={destinatario?.inscricao_estadual || ''}
                onChange={(e) => handleDestinatarioChange('inscricao_estadual', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={destinatario?.endereco || ''}
                onChange={(e) => handleDestinatarioChange('endereco', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={destinatario?.numero || ''}
                onChange={(e) => handleDestinatarioChange('numero', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Complemento</Label>
              <Input
                value={destinatario?.complemento || ''}
                onChange={(e) => handleDestinatarioChange('complemento', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={destinatario?.bairro || ''}
                onChange={(e) => handleDestinatarioChange('bairro', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={destinatario?.cidade || ''}
                onChange={(e) => handleDestinatarioChange('cidade', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                value={destinatario?.estado || ''}
                onChange={(e) => handleDestinatarioChange('estado', e.target.value)}
                maxLength="2"
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={destinatario?.cep || ''}
                onChange={(e) => handleDestinatarioChange('cep', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}