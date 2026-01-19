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
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={emissor?.cnpj || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input
                value={emissor?.inscricao_estadual || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={emissor?.endereco || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={emissor?.numero || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Complemento</Label>
              <Input
                value={emissor?.complemento || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={emissor?.bairro || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={emissor?.cidade || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                value={emissor?.estado || ''}
                disabled
                maxLength="2"
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={emissor?.cep || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
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
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={destinatario?.cnpj || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input
                value={destinatario?.inscricao_estadual || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={destinatario?.endereco || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={destinatario?.numero || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Complemento</Label>
              <Input
                value={destinatario?.complemento || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={destinatario?.bairro || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={destinatario?.cidade || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                value={destinatario?.estado || ''}
                disabled
                maxLength="2"
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={destinatario?.cep || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}