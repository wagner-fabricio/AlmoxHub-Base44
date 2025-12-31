import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const estadosBrasil = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function OSDetalhamentoExpedicao({ detalhamento, onChange }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [transportadoras, setTransportadoras] = useState([]);
  const [veiculosAxia, setVeiculosAxia] = useState([]);

  // Carregar transportadoras e veículos
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transp, veic] = await Promise.all([
        base44.entities.Transportadora.list(),
        base44.entities.VeiculoAxia.list()
      ]);
      setTransportadoras(Array.isArray(transp) ? transp : []);
      setVeiculosAxia(Array.isArray(veic) ? veic : []);
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  const addExpedicao = () => {
    const newExpedicao = {
      num_expedicao: (detalhamento?.length || 0) + 1,
      tipo_doc: '',
      num_doc: '',
      num_vol: 0,
      peso: 0,
      valor_total: 0,
      detalhes_remessa: '',
      data_expedicao: '',
      modal_transporte: '',
      responsavel_transporte: '',
      aproveitando_carona: false,
      usar_seguro: false,
      transportadora: {
        cnpj: '',
        razao_social: '',
        telefones: '',
        codigo_sap: '',
        conhecimento: '',
        valor_frete: 0,
        observacao: ''
      },
      veiculo: {
        frota_axia: false,
        proprietario: '',
        renavam: '',
        placa: '',
        estado: '',
        tara: 0,
        carroceria: '',
        tipo: ''
      }
    };
    onChange([...(detalhamento || []), newExpedicao]);
  };

  const removeExpedicao = (index) => {
    const updated = detalhamento.filter((_, i) => i !== index);
    // Renumerar expedições
    const renumbered = updated.map((exp, i) => ({ ...exp, num_expedicao: i + 1 }));
    onChange(renumbered);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const updateExpedicao = (index, field, value) => {
    const updated = [...detalhamento];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index] = {
        ...updated[index],
        [parent]: {
          ...updated[index][parent],
          [child]: value
        }
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const handleCNPJChange = async (index, cnpj) => {
    updateExpedicao(index, 'transportadora.cnpj', cnpj);
    
    // Buscar transportadora se CNPJ tiver 14 dígitos
    if (cnpj.length === 14) {
      const transp = transportadoras.find(t => t.cnpj === cnpj);
      if (transp) {
        updateExpedicao(index, 'transportadora.razao_social', transp.razao_social);
        updateExpedicao(index, 'transportadora.telefones', transp.telefones || '');
        updateExpedicao(index, 'transportadora.codigo_sap', transp.codigo_sap || '');
      }
    }
  };

  const salvarNovaTransportadora = async (index) => {
    const exp = detalhamento[index];
    if (!exp.transportadora.cnpj || !exp.transportadora.razao_social) {
      alert('CNPJ e Razão Social são obrigatórios');
      return;
    }

    try {
      await base44.entities.Transportadora.create({
        cnpj: exp.transportadora.cnpj,
        razao_social: exp.transportadora.razao_social,
        telefones: exp.transportadora.telefones,
        codigo_sap: exp.transportadora.codigo_sap,
        ativa: true
      });
      loadData();
      alert('Transportadora cadastrada com sucesso!');
    } catch (e) {
      console.error('Error saving transportadora:', e);
      alert('Erro ao cadastrar transportadora');
    }
  };

  const handleVeiculoAxiaChange = (index, veiculoId) => {
    const veiculo = veiculosAxia.find(v => v.id === veiculoId);
    if (veiculo) {
      const updated = [...detalhamento];
      updated[index] = {
        ...updated[index],
        veiculo: {
          ...updated[index].veiculo,
          proprietario: veiculo.proprietario || '',
          renavam: veiculo.renavam || '',
          placa: veiculo.placa || '',
          estado: veiculo.estado || '',
          tara: veiculo.tara || 0,
          carroceria: veiculo.carroceria || '',
          tipo: veiculo.tipo || ''
        }
      };
      onChange(updated);
    }
  };

  const toggleExpanded = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Detalhamento da Expedição</h4>
        <Button type="button" onClick={addExpedicao} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Expedição
        </Button>
      </div>

      <div className="space-y-3">
        {Array.isArray(detalhamento) && detalhamento.map((exp, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            {/* Linha principal */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleExpanded(index)}
                  className="shrink-0"
                >
                  {expandedIndex === index ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>

                <div className="flex items-center gap-4 flex-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 w-24">
                    Nº {exp.num_expedicao}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                    <Input
                      placeholder="Tipo Doc"
                      value={exp.tipo_doc || ''}
                      onChange={(e) => updateExpedicao(index, 'tipo_doc', e.target.value)}
                    />
                    <Input
                      placeholder="Nº Doc"
                      value={exp.num_doc || ''}
                      onChange={(e) => updateExpedicao(index, 'num_doc', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Volumes"
                      value={exp.num_vol || ''}
                      onChange={(e) => updateExpedicao(index, 'num_vol', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      placeholder="Peso (kg)"
                      value={exp.peso || ''}
                      onChange={(e) => updateExpedicao(index, 'peso', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      type="date"
                      value={exp.data_expedicao || ''}
                      onChange={(e) => updateExpedicao(index, 'data_expedicao', e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExpedicao(index)}
                  className="text-red-500 hover:text-red-700 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Seção expansível - Dados de Transporte */}
            {expandedIndex === index && (
              <div className="p-6 space-y-6 bg-white dark:bg-slate-900">
                {/* Dados Gerais de Transporte */}
                <div>
                  <h5 className="font-semibold mb-4 text-lg">Dados de Transporte</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Modal de Transporte *</Label>
                      <Select
                        value={exp.modal_transporte || ''}
                        onValueChange={(v) => updateExpedicao(index, 'modal_transporte', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Terrestre">Terrestre</SelectItem>
                          <SelectItem value="Aéreo">Aéreo</SelectItem>
                          <SelectItem value="Marítimo">Marítimo</SelectItem>
                          <SelectItem value="Misto">Misto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Responsável pelo Transporte *</Label>
                      <Select
                        value={exp.responsavel_transporte || ''}
                        onValueChange={(v) => updateExpedicao(index, 'responsavel_transporte', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Transportadora">Transportadora</SelectItem>
                          <SelectItem value="Arrematante">Arrematante</SelectItem>
                          <SelectItem value="Empreiteira">Empreiteira</SelectItem>
                          <SelectItem value="Locadora">Locadora</SelectItem>
                          <SelectItem value="Portador">Portador</SelectItem>
                          <SelectItem value="Axia">Axia</SelectItem>
                          <SelectItem value="Correios">Correios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`carona-${index}`}
                        checked={exp.aproveitando_carona || false}
                        onCheckedChange={(v) => updateExpedicao(index, 'aproveitando_carona', v)}
                      />
                      <Label htmlFor={`carona-${index}`}>Aproveitar carona?</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`seguro-${index}`}
                        checked={exp.usar_seguro || false}
                        onCheckedChange={(v) => updateExpedicao(index, 'usar_seguro', v)}
                      />
                      <Label htmlFor={`seguro-${index}`}>Usar seguro Axia?</Label>
                    </div>
                  </div>
                </div>

                {/* Subsessão Transportadora */}
                {exp.responsavel_transporte === 'Transportadora' && (
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-lg">Dados da Transportadora</h5>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => salvarNovaTransportadora(index)}
                      >
                        Cadastrar Transportadora
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CNPJ *</Label>
                        <Input
                          placeholder="00.000.000/0000-00"
                          value={exp.transportadora?.cnpj || ''}
                          onChange={(e) => handleCNPJChange(index, e.target.value.replace(/\D/g, ''))}
                          maxLength={14}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Razão Social *</Label>
                        <Input
                          value={exp.transportadora?.razao_social || ''}
                          onChange={(e) => updateExpedicao(index, 'transportadora.razao_social', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Telefone(s)</Label>
                        <Input
                          value={exp.transportadora?.telefones || ''}
                          onChange={(e) => updateExpedicao(index, 'transportadora.telefones', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Código SAP</Label>
                        <Input
                          value={exp.transportadora?.codigo_sap || ''}
                          onChange={(e) => updateExpedicao(index, 'transportadora.codigo_sap', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Conhecimento</Label>
                        <Input
                          value={exp.transportadora?.conhecimento || ''}
                          onChange={(e) => updateExpedicao(index, 'transportadora.conhecimento', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Valor do Frete</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={exp.transportadora?.valor_frete || ''}
                          onChange={(e) => updateExpedicao(index, 'transportadora.valor_frete', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Observação</Label>
                        <Textarea
                          value={exp.transportadora?.observacao || ''}
                          onChange={(e) => updateExpedicao(index, 'transportadora.observacao', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Subsessão Veículo */}
                <div className="border-t pt-6">
                  <h5 className="font-semibold mb-4 text-lg">Dados do Veículo</h5>

                  <div className="mb-4 flex items-center space-x-2">
                    <Checkbox
                      id={`frota-axia-${index}`}
                      checked={exp.veiculo?.frota_axia || false}
                      onCheckedChange={(v) => {
                        const updated = [...detalhamento];
                        if (!v) {
                          // Limpar campos quando desmarcar
                          updated[index] = {
                            ...updated[index],
                            veiculo: {
                              frota_axia: false,
                              proprietario: '',
                              renavam: '',
                              placa: '',
                              estado: '',
                              tara: 0,
                              carroceria: '',
                              tipo: ''
                            }
                          };
                        } else {
                          // Apenas marcar como frota axia
                          updated[index] = {
                            ...updated[index],
                            veiculo: {
                              ...updated[index].veiculo,
                              frota_axia: true
                            }
                          };
                        }
                        onChange(updated);
                      }}
                    />
                    <Label htmlFor={`frota-axia-${index}`}>Frota Axia?</Label>
                  </div>

                  {exp.veiculo?.frota_axia && (
                    <div className="mb-4 space-y-2">
                      <Label>Selecionar Veículo Cadastrado</Label>
                      <Select
                        value=""
                        onValueChange={(v) => handleVeiculoAxiaChange(index, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um veículo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {veiculosAxia.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.placa} - {v.tipo} ({v.estado})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Proprietário</Label>
                      <Input
                        value={exp.veiculo?.proprietario || ''}
                        onChange={(e) => updateExpedicao(index, 'veiculo.proprietario', e.target.value)}
                        disabled={exp.veiculo?.frota_axia}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>RENAVAM</Label>
                      <Input
                        value={exp.veiculo?.renavam || ''}
                        onChange={(e) => updateExpedicao(index, 'veiculo.renavam', e.target.value)}
                        disabled={exp.veiculo?.frota_axia}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Placa</Label>
                      <Input
                        value={exp.veiculo?.placa || ''}
                        onChange={(e) => updateExpedicao(index, 'veiculo.placa', e.target.value)}
                        disabled={exp.veiculo?.frota_axia}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estado (UF)</Label>
                      <Select
                        value={exp.veiculo?.estado || ''}
                        onValueChange={(v) => updateExpedicao(index, 'veiculo.estado', v)}
                        disabled={exp.veiculo?.frota_axia}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosBrasil.map(uf => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tara (kg)</Label>
                      <Input
                        type="number"
                        value={exp.veiculo?.tara || ''}
                        onChange={(e) => updateExpedicao(index, 'veiculo.tara', parseFloat(e.target.value) || 0)}
                        disabled={exp.veiculo?.frota_axia}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Carroceria</Label>
                      <Select
                        value={exp.veiculo?.carroceria || ''}
                        onValueChange={(v) => updateExpedicao(index, 'veiculo.carroceria', v)}
                        disabled={exp.veiculo?.frota_axia}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aberta">Aberta</SelectItem>
                          <SelectItem value="Baú">Baú</SelectItem>
                          <SelectItem value="Furgão">Furgão</SelectItem>
                          <SelectItem value="Munck">Munck</SelectItem>
                          <SelectItem value="Sem Carroceria">Sem Carroceria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={exp.veiculo?.tipo || ''}
                        onValueChange={(v) => updateExpedicao(index, 'veiculo.tipo', v)}
                        disabled={exp.veiculo?.frota_axia}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Automóvel">Automóvel</SelectItem>
                          <SelectItem value="Toco">Toco</SelectItem>
                          <SelectItem value="Truck">Truck</SelectItem>
                          <SelectItem value="Utilitário">Utilitário</SelectItem>
                          <SelectItem value="Ônibus">Ônibus</SelectItem>
                          <SelectItem value="Motocicleta">Motocicleta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Detalhes da Remessa */}
                <div className="border-t pt-6">
                  <div className="space-y-2">
                    <Label>Detalhes da Remessa</Label>
                    <Textarea
                      value={exp.detalhes_remessa || ''}
                      onChange={(e) => updateExpedicao(index, 'detalhes_remessa', e.target.value)}
                      rows={3}
                      placeholder="Observações adicionais sobre esta expedição..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {(!detalhamento || detalhamento.length === 0) && (
          <div className="text-center py-8 text-slate-500">
            Nenhuma expedição cadastrada. Clique em "Adicionar Expedição" para começar.
          </div>
        )}
      </div>
    </div>
  );
}