import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

const TIPO_LABELS = { nacional: 'Nacional', estadual: 'Estadual', municipal: 'Municipal', local: 'Local (almoxarifado específico)' };
const OCORRENCIA_LABELS = {
  feriado: 'Feriado',
  ponto_facultativo: 'Ponto Facultativo',
  dia_ponte: 'Dia Ponte',
  fechamento_contabil: 'Fechamento Contábil SAP',
  outros: 'Outros',
};

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export default function FeriadoFormModal({ open, onClose, feriado, almoxarifados, onSaved }) {
  const [form, setForm] = useState({
    nome: '', data: '', tipo: 'nacional', tipo_ocorrencia: 'feriado',
    estado: '', cidade: '', almoxarifado_id: '', observacoes: '', ativo: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (feriado) {
      setForm({
        nome: feriado.nome || '',
        data: feriado.data || '',
        tipo: feriado.tipo || 'nacional',
        tipo_ocorrencia: feriado.tipo_ocorrencia || 'feriado',
        estado: feriado.estado || '',
        cidade: feriado.cidade || '',
        almoxarifado_id: feriado.almoxarifado_id || '',
        observacoes: feriado.observacoes || '',
        ativo: feriado.ativo !== false,
      });
    } else {
      setForm({ nome: '', data: '', tipo: 'nacional', tipo_ocorrencia: 'feriado', estado: '', cidade: '', almoxarifado_id: '', observacoes: '', ativo: true });
    }
  }, [feriado, open]);

  const handleSave = async () => {
    if (!form.nome || !form.data || !form.tipo) {
      toast({ title: 'Campos obrigatórios', description: 'Nome, data e tipo são obrigatórios.', variant: 'destructive' });
      return;
    }
    if ((form.tipo === 'estadual' || form.tipo === 'municipal') && !form.estado) {
      toast({ title: 'UF obrigatória', description: 'Selecione a UF para feriado estadual/municipal.', variant: 'destructive' });
      return;
    }
    if (form.tipo === 'municipal' && !form.cidade) {
      toast({ title: 'Cidade obrigatória', description: 'Informe a cidade para feriado municipal.', variant: 'destructive' });
      return;
    }
    if (form.tipo === 'local' && !form.almoxarifado_id) {
      toast({ title: 'Almoxarifado obrigatório', description: 'Selecione o almoxarifado para ocorrência local.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        ano: parseInt(form.data.substring(0, 4), 10),
      };
      // Limpar campos não aplicáveis
      if (form.tipo === 'nacional') { payload.estado = ''; payload.cidade = ''; payload.almoxarifado_id = ''; }
      if (form.tipo === 'estadual') { payload.cidade = ''; payload.almoxarifado_id = ''; }
      if (form.tipo === 'municipal') { payload.almoxarifado_id = ''; }
      if (form.tipo === 'local') {
        const alm = almoxarifados.find(a => a.id === form.almoxarifado_id);
        if (alm) {
          payload.cidade = payload.cidade || (alm.endereco || '').split(',').slice(-2, -1)[0]?.trim() || '';
          payload.estado = payload.estado || (alm.endereco || '').split(',').pop()?.trim() || '';
        }
      }
      if (feriado?.id) {
        await base44.entities.Feriado.update(feriado.id, payload);
        toast({ title: 'Feriado atualizado' });
      } else {
        await base44.entities.Feriado.create(payload);
        toast({ title: 'Feriado cadastrado' });
      }
      onSaved?.();
      onClose();
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{feriado?.id ? 'Editar Feriado' : 'Novo Feriado'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Confraternização Universal" />
          </div>
          <div>
            <Label>Data *</Label>
            <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
          </div>
          <div>
            <Label>Tipo de Ocorrência</Label>
            <Select value={form.tipo_ocorrencia} onValueChange={v => setForm({ ...form, tipo_ocorrencia: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(OCORRENCIA_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Abrangência *</Label>
            <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(form.tipo === 'estadual' || form.tipo === 'municipal') && (
            <div>
              <Label>UF *</Label>
              <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.tipo === 'municipal' && (
            <div>
              <Label>Cidade *</Label>
              <Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} placeholder="Ex: Paulo Afonso" />
            </div>
          )}
          {form.tipo === 'local' && (
            <div className="sm:col-span-2">
              <Label>Almoxarifado *</Label>
              <Select value={form.almoxarifado_id} onValueChange={v => setForm({ ...form, almoxarifado_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {almoxarifados.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input id="ativo" type="checkbox" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} className="w-4 h-4" />
            <Label htmlFor="ativo" className="cursor-pointer">Ativo (será descontado no cálculo de dias úteis)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}