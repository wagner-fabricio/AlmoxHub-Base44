import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Save, Loader2 } from 'lucide-react';

export default function OrdemSaidaModal({ 
  open, 
  onClose, 
  os, 
  detalhamentoIndex,
  detalhamento,
  existingOrdem = null,
  onSaved 
}) {
  const [loading, setLoading] = useState(false);
  const [materiaisSelecionados, setMateriaisSelecionados] = useState([]);
  const [volumesSelecionados, setVolumesSelecionados] = useState([]);
  const [formData, setFormData] = useState({
    portador_nome: '',
    portador_cpf: '',
    destino: '',
    tipo_doc: '',
    num_doc: '',
    valor_total: 0,
    responsavel_emissao_nome: '',
    responsavel_emissao_matricula: '',
    responsavel_autorizacao_nome: '',
    responsavel_autorizacao_matricula: '',
    documentos_referencia: []
  });

  // Carregar ordens existentes para verificar itens já utilizados
  const [ordensExistentes, setOrdensExistentes] = useState([]);

  useEffect(() => {
    if (open && os) {
      loadOrdensExistentes();
      
      // Preencher dados do detalhamento
      if (detalhamento) {
        setFormData(prev => ({
          ...prev,
          portador_nome: detalhamento.motorista?.nome || '',
          portador_cpf: detalhamento.motorista?.cpf || '',
          destino: '', // Será preenchido pelo usuário
          tipo_doc: detalhamento.tipo_doc || '',
          num_doc: detalhamento.num_doc || '',
          valor_total: detalhamento.valor_total || 0,
        }));
      }

      // Se estiver editando uma ordem existente
      if (existingOrdem) {
        setMateriaisSelecionados(existingOrdem.materiais_selecionados?.map(m => m.item_index) || []);
        setVolumesSelecionados(existingOrdem.volumes_selecionados?.map(v => v.volume_index) || []);
        setFormData({
          portador_nome: existingOrdem.portador_nome || '',
          portador_cpf: existingOrdem.portador_cpf || '',
          destino: existingOrdem.destino || '',
          tipo_doc: existingOrdem.tipo_doc || '',
          num_doc: existingOrdem.num_doc || '',
          valor_total: existingOrdem.valor_total || 0,
          responsavel_emissao_nome: existingOrdem.responsavel_emissao_nome || '',
          responsavel_emissao_matricula: existingOrdem.responsavel_emissao_matricula || '',
          responsavel_autorizacao_nome: existingOrdem.responsavel_autorizacao_nome || '',
          responsavel_autorizacao_matricula: existingOrdem.responsavel_autorizacao_matricula || '',
          documentos_referencia: existingOrdem.documentos_referencia || []
        });
      }
    }
  }, [open, os, detalhamento, existingOrdem]);

  // Calcular valor_total automaticamente quando materiais são selecionados
  useEffect(() => {
    if (os?.itens_documento && materiaisSelecionados.length > 0) {
      const valorCalculado = materiaisSelecionados.reduce((total, itemIndex) => {
        const material = os.itens_documento[itemIndex];
        return total + (material?.r_total || 0);
      }, 0);
      
      setFormData(prev => ({
        ...prev,
        valor_total: valorCalculado
      }));
    } else if (materiaisSelecionados.length === 0) {
      setFormData(prev => ({
        ...prev,
        valor_total: 0
      }));
    }
  }, [materiaisSelecionados, os]);

  const loadOrdensExistentes = async () => {
    try {
      const ordens = await base44.entities.OrdemSaida.filter({ os_id: os.id });
      // Filtrar ordens diferentes da atual (se estiver editando)
      const ordensOutras = existingOrdem 
        ? ordens.filter(o => o.id !== existingOrdem.id)
        : ordens;
      setOrdensExistentes(ordensOutras);
    } catch (error) {
      console.error('Erro ao carregar ordens existentes:', error);
    }
  };

  // Verificar se um material já está em outra ordem
  const isMaterialUsado = (itemIndex) => {
    return ordensExistentes.some(ordem => 
      ordem.materiais_selecionados?.some(m => m.item_index === itemIndex)
    );
  };

  // Verificar se um volume já está em outra ordem
  const isVolumeUsado = (volumeIndex) => {
    return ordensExistentes.some(ordem => 
      ordem.volumes_selecionados?.some(v => v.volume_index === volumeIndex)
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Gerar número sequencial
      let numero;
      if (existingOrdem) {
        numero = existingOrdem.numero;
      } else {
        const currentYear = new Date().getFullYear();
        const ordensDoAno = await base44.entities.OrdemSaida.list();
        const ordensAnoAtual = ordensDoAno.filter(o => o.numero?.endsWith(`/${currentYear}`));
        const proximoNumero = String(ordensAnoAtual.length + 1).padStart(4, '0');
        numero = `${proximoNumero} / ${currentYear}`;
      }

      // Preparar dados dos materiais selecionados
      const materiais = materiaisSelecionados.map(index => {
        const item = os.itens_documento[index];
        return {
          item_index: index,
          codigo: item.codigo,
          descricao: item.descricao,
          quantidade: item.quantidade
        };
      });

      // Preparar dados dos volumes selecionados
      const volumes = volumesSelecionados.map(index => {
        const vol = os.volumes[index];
        return {
          volume_index: index,
          id_volume: vol.id_volume,
          quantidade: vol.quantidade,
          largura: vol.largura,
          altura: vol.altura,
          comprimento: vol.comprimento,
          peso_bruto: vol.peso_bruto
        };
      });

      const ordemData = {
        numero,
        os_id: os.id,
        detalhamento_expedicao_index: detalhamentoIndex,
        data_emissao: format(new Date(), 'yyyy-MM-dd'),
        portador_nome: formData.portador_nome,
        portador_cpf: formData.portador_cpf,
        veiculo_placa: detalhamento?.veiculo?.placa || '',
        destino: formData.destino,
        materiais_selecionados: materiais,
        volumes_selecionados: volumes,
        tipo_doc: formData.tipo_doc,
        num_doc: formData.num_doc,
        valor_total: formData.valor_total,
        documentos_referencia: formData.documentos_referencia,
        responsavel_emissao_nome: formData.responsavel_emissao_nome,
        responsavel_emissao_matricula: formData.responsavel_emissao_matricula,
        responsavel_autorizacao_nome: formData.responsavel_autorizacao_nome,
        responsavel_autorizacao_matricula: formData.responsavel_autorizacao_matricula
      };

      let savedOrdem;
      if (existingOrdem) {
        savedOrdem = await base44.entities.OrdemSaida.update(existingOrdem.id, ordemData);
      } else {
        savedOrdem = await base44.entities.OrdemSaida.create(ordemData);
      }

      onSaved?.(savedOrdem);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaterial = (index) => {
    if (materiaisSelecionados.includes(index)) {
      setMateriaisSelecionados(materiaisSelecionados.filter(i => i !== index));
    } else {
      setMateriaisSelecionados([...materiaisSelecionados, index]);
    }
  };

  const toggleVolume = (index) => {
    if (volumesSelecionados.includes(index)) {
      setVolumesSelecionados(volumesSelecionados.filter(i => i !== index));
    } else {
      setVolumesSelecionados([...volumesSelecionados, index]);
    }
  };

  const isValid = formData.portador_nome && formData.destino && 
    (materiaisSelecionados.length > 0 || volumesSelecionados.length > 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-800">
          <DialogTitle className="text-xl font-semibold">
            {existingOrdem ? 'Editar Ordem de Saída' : 'Gerar Ordem de Saída'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Dados Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Portador/Motorista *</Label>
                <Input
                  value={formData.portador_nome}
                  onChange={(e) => setFormData({ ...formData, portador_nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF Portador</Label>
                <Input
                  value={formData.portador_cpf}
                  onChange={(e) => setFormData({ ...formData, portador_cpf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Input
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  placeholder="Ex: CAMAÇARI"
                />
              </div>
              <div className="space-y-2">
                <Label>Placa Veículo</Label>
                <Input
                  value={detalhamento?.veiculo?.placa || ''}
                  disabled
                  className="bg-slate-50"
                />
              </div>
            </div>

            {/* Seleção de Materiais */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 dark:text-white">Materiais</h4>
              <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800">
                {os?.itens_documento?.length > 0 ? (
                  os.itens_documento.map((item, index) => {
                    const usado = isMaterialUsado(index);
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center gap-2 ${usado ? 'opacity-50' : ''}`}
                      >
                        <Checkbox
                          id={`material-${index}`}
                          checked={materiaisSelecionados.includes(index)}
                          onCheckedChange={() => toggleMaterial(index)}
                          disabled={usado && !existingOrdem}
                        />
                        <Label 
                          htmlFor={`material-${index}`} 
                          className="cursor-pointer text-sm flex-1"
                        >
                          <span className="font-medium">{item.codigo}</span>
                          {' - '}
                          <span>{item.descricao}</span>
                          {' - '}
                          <span className="text-slate-500">Qtd: {item.quantidade}</span>
                          {usado && <span className="ml-2 text-red-500">(Já utilizado)</span>}
                        </Label>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">Nenhum material disponível</p>
                )}
              </div>
            </div>

            {/* Seleção de Volumes */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 dark:text-white">Volumes</h4>
              <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800">
                {os?.volumes?.length > 0 ? (
                  os.volumes.map((vol, index) => {
                    const usado = isVolumeUsado(index);
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center gap-2 ${usado ? 'opacity-50' : ''}`}
                      >
                        <Checkbox
                          id={`volume-${index}`}
                          checked={volumesSelecionados.includes(index)}
                          onCheckedChange={() => toggleVolume(index)}
                          disabled={usado && !existingOrdem}
                        />
                        <Label 
                          htmlFor={`volume-${index}`} 
                          className="cursor-pointer text-sm flex-1"
                        >
                          <span className="font-medium">{vol.id_volume}</span>
                          {' - '}
                          <span className="text-slate-500">
                            Qtd: {vol.quantidade} | 
                            Peso: {vol.peso_bruto}kg
                          </span>
                          {usado && <span className="ml-2 text-red-500">(Já utilizado)</span>}
                        </Label>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">Nenhum volume disponível</p>
                )}
              </div>
            </div>

            {/* Documento de Referência */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Documento de Referência</h4>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Doc</Label>
                    <Input
                      value={formData.tipo_doc}
                      disabled
                      className="bg-slate-100 dark:bg-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Doc</Label>
                    <Input
                      value={formData.num_doc}
                      disabled
                      className="bg-slate-100 dark:bg-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      value={formData.valor_total ? formData.valor_total.toFixed(2) : '0.00'}
                      disabled
                      className="bg-slate-100 dark:bg-slate-700"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Dados provenientes do detalhamento da expedição
                </p>
              </div>
            </div>

            {/* Responsáveis */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Responsáveis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsável Emissão (Nome)</Label>
                  <Input
                    value={formData.responsavel_emissao_nome}
                    onChange={(e) => setFormData({ ...formData, responsavel_emissao_nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Matrícula</Label>
                  <Input
                    value={formData.responsavel_emissao_matricula}
                    onChange={(e) => setFormData({ ...formData, responsavel_emissao_matricula: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Responsável Autorização (Nome)</Label>
                  <Input
                    value={formData.responsavel_autorizacao_nome}
                    onChange={(e) => setFormData({ ...formData, responsavel_autorizacao_nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Matrícula</Label>
                  <Input
                    value={formData.responsavel_autorizacao_matricula}
                    onChange={(e) => setFormData({ ...formData, responsavel_autorizacao_matricula: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            * Campos obrigatórios
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!isValid || loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Salvar</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}