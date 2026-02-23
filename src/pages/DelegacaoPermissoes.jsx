import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MapPin,
  Warehouse
} from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';

export default function DelegacaoPermissoesPage() {
  const [delegacoes, setDelegacoes] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDelegacao, setEditingDelegacao] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserPessoa, setCurrentUserPessoa] = useState(null);

  const [formData, setFormData] = useState({
    delegado_id: '',
    funcoes_delegadas: [],
    data_inicio: '',
    data_fim: '',
    motivo: '',
    regional_id: '',
    almoxarifados_ids: [],
    observacoes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Verificar e atualizar status de delegações expiradas
    const checkExpiredDelegations = async () => {
      const now = new Date();
      const expiredDelegations = delegacoes.filter(d => 
        d.status === 'ativa' && isAfter(now, new Date(d.data_fim))
      );

      for (const delegacao of expiredDelegations) {
        await base44.entities.DelegacaoPermissao.update(delegacao.id, {
          status: 'expirada'
        });
      }

      if (expiredDelegations.length > 0) {
        await loadData();
      }
    };

    if (delegacoes.length > 0) {
      checkExpiredDelegations();
    }
  }, [delegacoes]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [delegacoesData, pessoasData, regionaisData, almoxarifadosData, userData] = await Promise.all([
        base44.entities.DelegacaoPermissao.list('-created_date'),
        base44.entities.Pessoa.list(),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list(),
        base44.auth.me()
      ]);

      setDelegacoes(delegacoesData);
      setPessoas(pessoasData);
      setRegionais(regionaisData);
      setAlmoxarifados(almoxarifadosData);
      setCurrentUser(userData);

      const pessoaData = pessoasData.find(p => p.user_id === userData.id);
      setCurrentUserPessoa(pessoaData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (delegacao = null) => {
    if (delegacao) {
      setEditingDelegacao(delegacao);
      setFormData({
        delegado_id: delegacao.delegado_id || '',
        funcoes_delegadas: delegacao.funcoes_delegadas || [],
        data_inicio: delegacao.data_inicio || '',
        data_fim: delegacao.data_fim || '',
        motivo: delegacao.motivo || '',
        regional_id: delegacao.regional_id || '',
        almoxarifados_ids: delegacao.almoxarifados_ids || [],
        observacoes: delegacao.observacoes || ''
      });
    } else {
      setEditingDelegacao(null);
      setFormData({
        delegado_id: '',
        funcoes_delegadas: [],
        data_inicio: '',
        data_fim: '',
        motivo: '',
        regional_id: currentUserPessoa?.regional_id || '',
        almoxarifados_ids: currentUserPessoa?.almoxarifados_ids || [],
        observacoes: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.delegado_id || !formData.data_inicio || !formData.data_fim || formData.funcoes_delegadas.length === 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (isAfter(new Date(formData.data_inicio), new Date(formData.data_fim))) {
      alert('Data de início não pode ser posterior à data de término');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        delegante_id: currentUserPessoa.id,
        status: 'ativa'
      };

      if (editingDelegacao) {
        await base44.entities.DelegacaoPermissao.update(editingDelegacao.id, dataToSave);
      } else {
        await base44.entities.DelegacaoPermissao.create(dataToSave);
      }
      await loadData();
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving delegacao:', error);
      alert('Erro ao salvar delegação');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Tem certeza que deseja cancelar esta delegação?')) return;

    try {
      await base44.entities.DelegacaoPermissao.update(id, {
        status: 'cancelada'
      });
      await loadData();
    } catch (error) {
      console.error('Error canceling delegacao:', error);
      alert('Erro ao cancelar delegação');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta delegação?')) return;

    try {
      await base44.entities.DelegacaoPermissao.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting delegacao:', error);
      alert('Erro ao excluir delegação');
    }
  };

  const handleToggleFuncao = (funcao) => {
    setFormData(prev => ({
      ...prev,
      funcoes_delegadas: prev.funcoes_delegadas.includes(funcao)
        ? prev.funcoes_delegadas.filter(f => f !== funcao)
        : [...prev.funcoes_delegadas, funcao]
    }));
  };

  const handleToggleAlmoxarifado = (almoxId) => {
    setFormData(prev => ({
      ...prev,
      almoxarifados_ids: prev.almoxarifados_ids.includes(almoxId)
        ? prev.almoxarifados_ids.filter(id => id !== almoxId)
        : [...prev.almoxarifados_ids, almoxId]
    }));
  };

  const filteredDelegacoes = delegacoes.filter(delegacao => {
    const delegante = pessoas.find(p => p.id === delegacao.delegante_id);
    const delegado = pessoas.find(p => p.id === delegacao.delegado_id);
    
    return (
      delegante?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delegado?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delegacao.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const canManage = currentUser?.role === 'admin' || 
                    currentUserPessoa?.funcoes?.includes('gestor') || 
                    currentUserPessoa?.funcoes?.includes('lider');

  const getStatusBadge = (delegacao) => {
    const now = new Date();
    const inicio = new Date(delegacao.data_inicio);
    const fim = new Date(delegacao.data_fim);

    if (delegacao.status === 'cancelada') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelada</Badge>;
    }

    if (isAfter(now, fim)) {
      return <Badge variant="outline" className="bg-slate-100 text-slate-700">Expirada</Badge>;
    }

    if (isBefore(now, inicio)) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Programada</Badge>;
    }

    return <Badge className="bg-green-500">Ativa</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Delegação de Permissões</h1>
        <p className="text-slate-600 dark:text-slate-400">Delegue temporariamente suas permissões para outros usuários</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Buscar delegações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {canManage && (
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-5 h-5" />
            Nova Delegação
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {filteredDelegacoes.map((delegacao) => {
          const delegante = pessoas.find(p => p.id === delegacao.delegante_id);
          const delegado = pessoas.find(p => p.id === delegacao.delegado_id);
          const regional = regionais.find(r => r.id === delegacao.regional_id);
          const isOwner = delegacao.delegante_id === currentUserPessoa?.id;

          return (
            <Card key={delegacao.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {delegante?.nome} → {delegado?.nome}
                        </h3>
                        {getStatusBadge(delegacao)}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {delegacao.funcoes_delegadas?.map((funcao) => (
                          <Badge key={funcao} variant="outline">
                            {funcao === 'gestor' ? 'Gestor' : funcao === 'lider' ? 'Líder' : 'Almoxarife'}
                          </Badge>
                        ))}
                      </div>

                      {delegacao.motivo && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          <strong>Motivo:</strong> {delegacao.motivo}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Início:</span>
                            <span className="ml-1 font-medium">
                              {format(new Date(delegacao.data_inicio), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-red-600" />
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Término:</span>
                            <span className="ml-1 font-medium">
                              {format(new Date(delegacao.data_fim), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                        {regional && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{regional.sigla}</span>
                          </div>
                        )}
                      </div>

                      {delegacao.almoxarifados_ids?.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Warehouse className="w-4 h-4 text-amber-600" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {delegacao.almoxarifados_ids.length} almoxarifado(s)
                          </span>
                        </div>
                      )}

                      {delegacao.observacoes && (
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                          <strong>Observações:</strong> {delegacao.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  {(canManage || isOwner) && delegacao.status === 'ativa' && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(delegacao)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancel(delegacao.id)}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(delegacao.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDelegacoes.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 dark:text-slate-400">Nenhuma delegação encontrada</p>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 py-5 border-b -m-6 mb-0" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
            <DialogTitle className="text-white">
              {editingDelegacao ? 'Editar Delegação' : 'Nova Delegação'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6 px-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                Pessoa e Funções
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Delegar para *</label>
                  <Select
                    value={formData.delegado_id}
                    onValueChange={(value) => setFormData({ ...formData, delegado_id: value })}
                  >
                    <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg">
                      <SelectValue placeholder="Selecione a pessoa" />
                    </SelectTrigger>
                    <SelectContent>
                      {pessoas.filter(p => p.id !== currentUserPessoa?.id).map((pessoa) => (
                        <SelectItem key={pessoa.id} value={pessoa.id}>
                          {pessoa.nome} - {pessoa.funcao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Funções Delegadas *</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 space-y-2">
                    {['gestor', 'lider', 'almoxarife'].map((funcao) => (
                      <label key={funcao} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.funcoes_delegadas.includes(funcao)}
                          onChange={() => handleToggleFuncao(funcao)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {funcao === 'gestor' ? 'Gestor' : funcao === 'lider' ? 'Líder' : 'Almoxarife'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                Período e Localização
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Início *</label>
                    <Input
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                      className="border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Término *</label>
                    <Input
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                      className="border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Motivo</label>
                  <Select
                    value={formData.motivo}
                    onValueChange={(value) => setFormData({ ...formData, motivo: value })}
                  >
                    <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg">
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Férias">Férias</SelectItem>
                      <SelectItem value="Afastamento">Afastamento</SelectItem>
                      <SelectItem value="Viagem">Viagem</SelectItem>
                      <SelectItem value="Licença">Licença</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Regional</label>
                  <Select
                    value={formData.regional_id}
                    onValueChange={(value) => setFormData({ ...formData, regional_id: value })}
                  >
                    <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg">
                      <SelectValue placeholder="Selecione a regional" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionais.map((regional) => (
                        <SelectItem key={regional.id} value={regional.id}>
                          {regional.sigla} - {regional.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Almoxarifados</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {almoxarifados.map((almox) => (
                      <label key={almox.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.almoxarifados_ids.includes(almox.id)}
                          onChange={() => handleToggleAlmoxarifado(almox.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{almox.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Observações</label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Informações adicionais..."
                    rows={3}
                    className="border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
          </div>

              </div>
            </div>
          </div>

          <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white' }}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingDelegacao ? 'Salvar Alterações' : 'Criar Delegação'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}