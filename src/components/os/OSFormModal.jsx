import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Save, Plus, Trash2, Upload, X, Loader2 } from 'lucide-react';
import OSItensDocumento from './OSItensDocumento';
import OSVolumes from './OSVolumes';
import OSDetalhamentoExpedicao from './OSDetalhamentoExpedicao';

export default function OSFormModal({
  open,
  onClose,
  os,
  regionais,
  almoxarifados,
  pessoas,
  categorias,
  subcategorias,
  projetos,
  instalacoes,
  currentUser,
  onSave
}) {
  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    categoria_id: '',
    subcategorias_ids: [],
    regional_id: '',
    almoxarifado_id: '',
    lider_id: '',
    atendente_nome: '',
    executores_ids: [],
    outros_envolvidos_ids: [],
    prazo: '',
    data_inicial: format(new Date(), 'yyyy-MM-dd'),
    prioridade: 'media',
    status: 'elaboracao',
    anotacoes: '',
    projetos_ids: [],
    descricao_resumida: '',
    num_reserva: '',
    data_reserva: '',
    usuario_reserva: '',
    orgao: '',
    data_migo: '',
    num_migo: '',
    vinculacao: '',
    instalacao_origem_id: '',
    instalacao_destino_id: '',
    itens_documento: [],
    volumes: [],
    modal_transporte: '',
    modalidade_transporte: '',
    aproveitando_carona: false,
    usar_seguro: false,
    detalhamento_expedicao: [],
    status_separacao: 'elaboracao',
    responsavel_separacao: '',
    data_separacao: '',
    anexos: [],
    imagens: [],
  });

  useEffect(() => {
    if (os) {
      setFormData({
        ...formData,
        ...os,
        prazo: os.prazo ? format(new Date(os.prazo), 'yyyy-MM-dd') : '',
        data_inicial: os.data_inicial ? format(new Date(os.data_inicial), 'yyyy-MM-dd') : '',
        data_reserva: os.data_reserva ? format(new Date(os.data_reserva), 'yyyy-MM-dd') : '',
        data_migo: os.data_migo ? format(new Date(os.data_migo), 'yyyy-MM-dd') : '',
        data_separacao: os.data_separacao ? format(new Date(os.data_separacao), 'yyyy-MM-dd') : '',
      });
    } else {
      // Defaults for new OS
      const userPessoa = pessoas.find(p => p.email === currentUser?.email);
      if (userPessoa) {
        const defaultRegional = userPessoa.regional_id;
        const userAlmoxarifados = almoxarifados.filter(a => 
          userPessoa.almoxarifados_ids?.includes(a.id)
        );
        
        setFormData(prev => ({
          ...prev,
          regional_id: defaultRegional || '',
          almoxarifado_id: userAlmoxarifados.length === 1 ? userAlmoxarifados[0].id : '',
          lider_id: userPessoa.id,
        }));
      }
    }
  }, [os, currentUser, pessoas, almoxarifados]);

  const filteredSubcategorias = subcategorias.filter(s => s.categoria_id === formData.categoria_id);
  const filteredAlmoxarifados = almoxarifados.filter(a => a.regional_id === formData.regional_id);
  
  const selectedCategoria = categorias.find(c => c.id === formData.categoria_id);
  const selectedSubcategorias = subcategorias.filter(s => formData.subcategorias_ids?.includes(s.id));
  
  // Check if we should show expedition fields
  const isExpedicaoComReserva = 
    selectedCategoria?.nome?.toLowerCase().includes('expedição') &&
    selectedSubcategorias.some(s => s.nome?.toLowerCase().includes('reserva'));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let codigo = formData.codigo;
      const isNew = !os;
      
      if (isNew) {
        // Generate unique ID with regional prefix
        const regional = regionais.find(r => r.id === formData.regional_id);
        const regionalSigla = regional?.sigla || 'XX';
        const today = format(new Date(), 'yyyyMMdd');
        const currentYear = format(new Date(), 'yyyy');
        
        // Get count for current year only
        const allOrdens = await base44.entities.OrdemServico.list();
        const ordensThisYear = allOrdens.filter(o => o.codigo?.includes(currentYear));
        const seq = String(ordensThisYear.length + 1).padStart(4, '0');
        
        codigo = `${regionalSigla}-${today}-${seq}`;
      }

      const dataToSave = {
        ...formData,
        codigo,
      };

      let savedOS;
      if (os) {
        savedOS = await base44.entities.OrdemServico.update(os.id, dataToSave);
      } else {
        savedOS = await base44.entities.OrdemServico.create(dataToSave);
      }

      onSave?.(isNew, { ...dataToSave, id: savedOS.id || os?.id });
      onClose();
    } catch (error) {
      console.error('Error saving OS:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, field) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), result.file_url]
      }));
    }
  };

  const removeFile = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const isValid = formData.categoria_id && formData.subcategorias_ids?.length > 0 && 
    formData.regional_id && formData.almoxarifado_id && formData.lider_id && formData.prazo;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-800">
          <DialogTitle className="text-xl font-semibold">
            {os ? `Editar OS: ${os.codigo}` : 'Nova Ordem de Serviço'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-6">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800 p-1">
                <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
                {isExpedicaoComReserva && (
                  <>
                    <TabsTrigger value="documento">Documento</TabsTrigger>
                    <TabsTrigger value="materiais">Materiais</TabsTrigger>
                    <TabsTrigger value="volumes">Volumes</TabsTrigger>
                    <TabsTrigger value="transporte">Transporte</TabsTrigger>
                    <TabsTrigger value="expedicao">Expedição</TabsTrigger>
                  </>
                )}
                <TabsTrigger value="anexos">Anexos</TabsTrigger>
              </TabsList>

              {/* TAB: Dados Gerais */}
              <TabsContent value="geral" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Categoria */}
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select
                      value={formData.categoria_id}
                      onValueChange={(v) => setFormData({ ...formData, categoria_id: v, subcategorias_ids: [] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subcategorias */}
                  <div className="space-y-2">
                    <Label>Subcategorias *</Label>
                    <Select
                      value={formData.subcategorias_ids?.[0] || ''}
                      onValueChange={(v) => setFormData({ ...formData, subcategorias_ids: [v] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubcategorias.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Regional */}
                  <div className="space-y-2">
                    <Label>Regional *</Label>
                    <Select
                      value={formData.regional_id}
                      onValueChange={(v) => setFormData({ ...formData, regional_id: v, almoxarifado_id: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {regionais.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.sigla} - {r.descricao}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Almoxarifado */}
                  <div className="space-y-2">
                    <Label>Almoxarifado *</Label>
                    <Select
                      value={formData.almoxarifado_id}
                      onValueChange={(v) => setFormData({ ...formData, almoxarifado_id: v, executores_ids: [] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAlmoxarifados.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Líder */}
                  <div className="space-y-2">
                    <Label>Líder *</Label>
                    <Select
                      value={formData.lider_id}
                      onValueChange={(v) => setFormData({ ...formData, lider_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pessoas.filter(p => p.funcoes?.includes('lider')).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Atendente */}
                  <div className="space-y-2">
                    <Label>Atendente</Label>
                    <Input
                      list="pessoas-list"
                      value={formData.atendente_nome}
                      onChange={(e) => setFormData({ ...formData, atendente_nome: e.target.value })}
                      placeholder="Digite ou selecione..."
                    />
                    <datalist id="pessoas-list">
                      {pessoas.map(p => (
                        <option key={p.id} value={p.nome} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Executores */}
                <div className="space-y-2">
                  <Label>Executores</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Selecione os usuários que irão executar esta tarefa
                  </p>
                  <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800">
                    {formData.almoxarifado_id ? (
                      pessoas.filter(p => p.almoxarifados_ids?.includes(formData.almoxarifado_id)).length > 0 ? (
                        pessoas
                          .filter(p => p.almoxarifados_ids?.includes(formData.almoxarifado_id))
                          .map((pessoa) => (
                            <div key={pessoa.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`executor-${pessoa.id}`}
                                checked={formData.executores_ids?.includes(pessoa.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      executores_ids: [...(formData.executores_ids || []), pessoa.id]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      executores_ids: formData.executores_ids?.filter(id => id !== pessoa.id) || []
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`executor-${pessoa.id}`} className="cursor-pointer text-sm flex-1">
                                <span className="font-medium">{pessoa.nome}</span>
                                {pessoa.funcao && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                    ({pessoa.funcao})
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-slate-500">Nenhuma pessoa lotada neste almoxarifado</p>
                      )
                    ) : (
                      <p className="text-sm text-slate-500">Selecione um almoxarifado primeiro</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Prazo */}
                  <div className="space-y-2">
                    <Label>Prazo *</Label>
                    <Input
                      type="date"
                      value={formData.prazo}
                      onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                    />
                  </div>

                  {/* Data Inicial */}
                  <div className="space-y-2">
                    <Label>Data Inicial</Label>
                    <Input
                      type="date"
                      value={formData.data_inicial}
                      onChange={(e) => setFormData({ ...formData, data_inicial: e.target.value })}
                    />
                  </div>

                  {/* Prioridade */}
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={formData.prioridade}
                      onValueChange={(v) => setFormData({ ...formData, prioridade: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elaboracao">Em Elaboração</SelectItem>
                        <SelectItem value="execucao">Em Execução</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Progresso */}
                  <div className="space-y-2">
                    <Label>Progresso (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progresso || 0}
                      onChange={(e) => setFormData({ ...formData, progresso: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {/* Projetos */}
                  <div className="space-y-2">
                    <Label>Projetos/Tags</Label>
                    <Select
                      value={formData.projetos_ids?.[0] || ''}
                      onValueChange={(v) => setFormData({ ...formData, projetos_ids: v ? [v] : [] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projetos.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Descrição Resumida */}
                <div className="space-y-2">
                  <Label>Descrição Resumida</Label>
                  <Textarea
                    value={formData.descricao_resumida}
                    onChange={(e) => setFormData({ ...formData, descricao_resumida: e.target.value })}
                    placeholder="Descreva brevemente a OS..."
                    rows={3}
                  />
                </div>

                {/* Anotações */}
                <div className="space-y-2">
                  <Label>Anotações</Label>
                  <Textarea
                    value={formData.anotacoes}
                    onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })}
                    placeholder="Notas adicionais..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* TAB: Documento (Expedição) */}
              {isExpedicaoComReserva && (
                <TabsContent value="documento" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Número da Reserva *</Label>
                      <Input
                        value={formData.num_reserva}
                        onChange={(e) => setFormData({ ...formData, num_reserva: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data da Reserva *</Label>
                      <Input
                        type="date"
                        value={formData.data_reserva}
                        onChange={(e) => setFormData({ ...formData, data_reserva: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Usuário *</Label>
                      <Input
                        value={formData.usuario_reserva}
                        onChange={(e) => setFormData({ ...formData, usuario_reserva: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Órgão *</Label>
                      <Input
                        value={formData.orgao}
                        onChange={(e) => setFormData({ ...formData, orgao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data MIGO</Label>
                      <Input
                        type="date"
                        value={formData.data_migo}
                        onChange={(e) => setFormData({ ...formData, data_migo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Número MIGO</Label>
                      <Input
                        value={formData.num_migo}
                        onChange={(e) => setFormData({ ...formData, num_migo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vinculação</Label>
                      <Select
                        value={formData.vinculacao}
                        onValueChange={(v) => setFormData({ ...formData, vinculacao: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custeio">Custeio</SelectItem>
                          <SelectItem value="investimento">Investimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Instalação Origem</Label>
                      <Select
                        value={formData.instalacao_origem_id}
                        onValueChange={(v) => setFormData({ ...formData, instalacao_origem_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {almoxarifados.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Instalação Destino</Label>
                      <Select
                        value={formData.instalacao_destino_id}
                        onValueChange={(v) => setFormData({ ...formData, instalacao_destino_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {instalacoes.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* TAB: Materiais */}
              {isExpedicaoComReserva && (
                <TabsContent value="materiais">
                  <OSItensDocumento
                    itens={formData.itens_documento}
                    onChange={(itens) => setFormData({ ...formData, itens_documento: itens })}
                  />
                </TabsContent>
              )}

              {/* TAB: Volumes */}
              {isExpedicaoComReserva && (
                <TabsContent value="volumes">
                  <OSVolumes
                    volumes={formData.volumes}
                    onChange={(volumes) => setFormData({ ...formData, volumes: volumes })}
                  />
                </TabsContent>
              )}

              {/* TAB: Transporte */}
              {isExpedicaoComReserva && (
                <TabsContent value="transporte" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Modal</Label>
                      <Select
                        value={formData.modal_transporte}
                        onValueChange={(v) => setFormData({ ...formData, modal_transporte: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rodoviario">Rodoviário</SelectItem>
                          <SelectItem value="aereo">Aéreo</SelectItem>
                          <SelectItem value="maritimo">Marítimo</SelectItem>
                          <SelectItem value="ferroviario">Ferroviário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Modalidade</Label>
                      <Input
                        value={formData.modalidade_transporte}
                        onChange={(e) => setFormData({ ...formData, modalidade_transporte: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="carona"
                        checked={formData.aproveitando_carona}
                        onCheckedChange={(v) => setFormData({ ...formData, aproveitando_carona: v })}
                      />
                      <Label htmlFor="carona">Aproveitando Carona?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="seguro"
                        checked={formData.usar_seguro}
                        onCheckedChange={(v) => setFormData({ ...formData, usar_seguro: v })}
                      />
                      <Label htmlFor="seguro">Usar Seguro?</Label>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* TAB: Expedição */}
              {isExpedicaoComReserva && (
                <TabsContent value="expedicao" className="space-y-6">
                  <OSDetalhamentoExpedicao
                    detalhamento={formData.detalhamento_expedicao}
                    onChange={(d) => setFormData({ ...formData, detalhamento_expedicao: d })}
                  />

                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4">Separação / Expedição</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Status Separação</Label>
                        <Select
                          value={formData.status_separacao}
                          onValueChange={(v) => setFormData({ ...formData, status_separacao: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="elaboracao">Em Elaboração</SelectItem>
                            <SelectItem value="execucao">Em Execução</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Responsável</Label>
                        <Input
                          value={formData.responsavel_separacao}
                          onChange={(e) => setFormData({ ...formData, responsavel_separacao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Separação</Label>
                        <Input
                          type="date"
                          value={formData.data_separacao}
                          onChange={(e) => setFormData({ ...formData, data_separacao: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* TAB: Anexos */}
              <TabsContent value="anexos" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Anexos */}
                  <div className="space-y-4">
                    <Label>Anexos</Label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 mb-2">Arraste arquivos ou clique para enviar</p>
                      <Input
                        type="file"
                        multiple
                        className="hidden"
                        id="anexos-upload"
                        onChange={(e) => handleFileUpload(e, 'anexos')}
                      />
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor="anexos-upload" className="cursor-pointer">
                          Selecionar Arquivos
                        </label>
                      </Button>
                    </div>
                    {formData.anexos?.length > 0 && (
                      <div className="space-y-2">
                        {formData.anexos.map((url, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                              Anexo {i + 1}
                            </a>
                            <Button variant="ghost" size="icon" onClick={() => removeFile('anexos', i)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Imagens */}
                  <div className="space-y-4">
                    <Label>Imagens</Label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 mb-2">Arraste imagens ou clique para enviar</p>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        id="imagens-upload"
                        onChange={(e) => handleFileUpload(e, 'imagens')}
                      />
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor="imagens-upload" className="cursor-pointer">
                          Selecionar Imagens
                        </label>
                      </Button>
                    </div>
                    {formData.imagens?.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {formData.imagens.map((url, i) => (
                          <div key={i} className="relative group">
                            <img src={url} alt={`Imagem ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile('imagens', i)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            * Campos obrigatórios
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!isValid || loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Salvar OS</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}