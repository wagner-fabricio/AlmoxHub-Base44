import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, User, Loader2, Search, Upload, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SortableTableHead, useTableSort, useColumnFilters } from '@/components/ui/table-sortable';

const funcaoLabels = {
  gestor: { label: 'Gestor', color: 'bg-purple-100 text-purple-700' },
  lider: { label: 'Líder', color: 'bg-blue-100 text-blue-700' },
  almoxarife: { label: 'Almoxarife', color: 'bg-amber-100 text-amber-700' }
};

export default function Pessoas() {
  const [loading, setLoading] = useState(true);
  const [pessoas, setPessoas] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRegional, setFilterRegional] = useState('all');
  const [filterAlmoxarifado, setFilterAlmoxarifado] = useState('all');
  const [filterFuncao, setFilterFuncao] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFuncoesModal, setShowFuncoesModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingFuncoes, setEditingFuncoes] = useState({ pessoa: null, funcoes: [] });
  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    email: '',
    funcao: '',
    funcoes: [],
    regional_id: '',
    almoxarifados_ids: [],
    ativo: true,
    foto_perfil: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { sortConfig, handleSort } = useTableSort();
  const { columnFilters, toggleFilter, clearFilter } = useColumnFilters({
    nome: [],
    matricula: [],
    funcao: [],
    regional: [],
    funcoes: [],
    status: [],
    acesso: []
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'me' && currentUser && pessoas.length > 0) {
      const minhaPessoa = pessoas.find(p => p.user_id === currentUser.id);
      if (minhaPessoa) {
        handleEdit(minhaPessoa);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [currentUser, pessoas]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, pessoasData, regionaisData, almoxData] = await Promise.all([
        base44.auth.me(),
        base44.entities.Pessoa.list(),
        base44.entities.Regional.list(),
        base44.entities.Almoxarifado.list()
      ]);
      setCurrentUser(user);
      const pessoa = pessoasData.find(p => p.user_id === user.id);
      setCurrentPessoa(pessoa);
      setPessoas(pessoasData);
      setRegionais(regionaisData);
      setAlmoxarifados(almoxData);
    } catch (error) {
      console.error('Erro ao carregar dados');
      // Não expor detalhes do erro ao usuário
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedItem(null);
    setFormData({
      matricula: '',
      nome: '',
      email: '',
      funcao: '',
      funcoes: [],
      regional_id: '',
      almoxarifados_ids: [],
      ativo: true,
      foto_perfil: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    const isGestor = currentPessoa?.funcoes?.includes('gestor');
    const isOwnProfile = item.id === currentPessoa?.id;
    
    if (!isGestor && !isOwnProfile) return;
    
    setSelectedItem(item);
    setFormData({
      matricula: item.matricula || '',
      nome: item.nome || '',
      email: item.email || '',
      funcao: item.funcao || '',
      funcoes: item.funcoes || [],
      regional_id: item.regional_id || '',
      almoxarifados_ids: item.almoxarifados_ids || [],
      ativo: item.ativo !== false,
      foto_perfil: item.foto_perfil || ''
    });
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await base44.entities.Pessoa.delete(selectedItem.id);
      loadData();
    } catch (error) {
      console.error('Erro ao deletar');
      alert('Erro ao deletar pessoa. Tente novamente.');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sanitizar e padronizar dados
      const emailPadronizado = formData.email.toLowerCase().trim();
      const nomeSanitizado = formData.nome.trim().substring(0, 200);
      const matriculaSanitizada = formData.matricula.trim().substring(0, 50);

      // Se está criando novo ou editando o email, verificar duplicidade
      if (!selectedItem || selectedItem.email !== emailPadronizado) {
        const pessoasExistentes = await base44.entities.Pessoa.filter({ 
          email: emailPadronizado 
        });

        // Verificar se existe cadastro com este email (excluindo o próprio registro se for edição)
        const duplicados = pessoasExistentes.filter(p => 
          !selectedItem || p.id !== selectedItem.id
        );

        if (duplicados && duplicados.length > 0) {
          alert('Já existe um cadastro com este e-mail. Por favor, use um e-mail diferente.');
          setSaving(false);
          return;
        }
      }

      const dadosAtualizados = { 
        ...formData, 
        email: emailPadronizado,
        nome: nomeSanitizado,
        matricula: matriculaSanitizada,
        funcao: formData.funcao?.trim().substring(0, 100) || ''
      };

      if (selectedItem) {
        await base44.entities.Pessoa.update(selectedItem.id, dadosAtualizados);
      } else {
        await base44.entities.Pessoa.create(dadosAtualizados);
      }
      loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const toggleFuncao = (funcao) => {
    if (formData.funcoes.includes(funcao)) {
      setFormData({ ...formData, funcoes: formData.funcoes.filter(f => f !== funcao) });
    } else {
      setFormData({ ...formData, funcoes: [...formData.funcoes, funcao] });
    }
  };

  const toggleAlmoxarifado = (id) => {
    if (formData.almoxarifados_ids.includes(id)) {
      setFormData({ ...formData, almoxarifados_ids: formData.almoxarifados_ids.filter(a => a !== id) });
    } else {
      setFormData({ ...formData, almoxarifados_ids: [...formData.almoxarifados_ids, id] });
    }
  };

  const handleFuncoesClick = (pessoa) => {
    if (currentUser?.role !== 'admin') return;
    setEditingFuncoes({ pessoa, funcoes: [...(pessoa.funcoes || [])] });
    setShowFuncoesModal(true);
  };

  const toggleEditingFuncao = (funcao) => {
    setEditingFuncoes(prev => ({
      ...prev,
      funcoes: prev.funcoes.includes(funcao)
        ? prev.funcoes.filter(f => f !== funcao)
        : [...prev.funcoes, funcao]
    }));
  };

  const saveFuncoes = async () => {
    setSaving(true);
    try {
      await base44.entities.Pessoa.update(editingFuncoes.pessoa.id, {
        funcoes: editingFuncoes.funcoes
      });
      
      // Atualizar estado local sem recarregar tudo
      setPessoas(pessoas.map(p => 
        p.id === editingFuncoes.pessoa.id 
          ? { ...p, funcoes: editingFuncoes.funcoes }
          : p
      ));
      
      setShowFuncoesModal(false);
    } catch (error) {
      console.error('Erro ao atualizar funções');
      alert('Erro ao atualizar funções. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (pessoa) => {
    if (currentUser?.role !== 'admin') return;
    try {
      const novoStatus = !pessoa.ativo;
      const updateData = { ativo: novoStatus };

      // Se mudar para inativo, também muda aprovação para pendente
      if (!novoStatus) {
        updateData.status_aprovacao = 'pendente';
      }

      await base44.entities.Pessoa.update(pessoa.id, updateData);
      
      // Atualizar estado local sem recarregar tudo
      setPessoas(pessoas.map(p => 
        p.id === pessoa.id 
          ? { ...p, ...updateData }
          : p
      ));
    } catch (error) {
      console.error('Erro ao atualizar status');
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  const toggleStatusAprovacao = async (pessoa) => {
    if (currentUser?.role !== 'admin') return;
    const statusOrder = ['pendente', 'aprovado', 'rejeitado'];
    const currentIndex = statusOrder.indexOf(pessoa.status_aprovacao || 'pendente');
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    try {
      await base44.entities.Pessoa.update(pessoa.id, {
        status_aprovacao: nextStatus
      });

      // Atualizar estado local imediatamente
      setPessoas(pessoas.map(p => 
        p.id === pessoa.id 
          ? { ...p, status_aprovacao: nextStatus }
          : p
      ));

      // Enviar e-mail se for aprovado ou rejeitado (em background)
      if (nextStatus === 'aprovado' || nextStatus === 'rejeitado') {
        const regional = regionais.find(r => r.id === pessoa.regional_id);
        const almoxs = almoxarifados.filter(a => pessoa.almoxarifados_ids?.includes(a.id));
        const funcoesTexto = (pessoa.funcoes || []).map(f => {
          const labels = { gestor: 'Gestor', lider: 'Líder', almoxarife: 'Almoxarife' };
          return labels[f];
        }).join(', ');

        // Função de sanitização para prevenir XSS em emails
        const sanitizeHTML = (str) => {
          if (!str) return '';
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        };

        let assunto = '';
        let corpo = '';

        if (nextStatus === 'aprovado') {
          assunto = 'Bem-vindo ao AlmoxHub - Acesso Aprovado! 🎉';
          corpo = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #0000FF 0%, #0A003C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
                .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
                .dados { background: #f9f9f9; padding: 15px; border-left: 4px solid #FF6B00; margin: 20px 0; }
                .dados-item { margin: 8px 0; }
                .label { font-weight: bold; color: #0000FF; }
                .button { display: inline-block; background: #FF6B00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Parabéns!</h1>
                  <p style="font-size: 18px; margin: 10px 0 0 0;">Seu acesso foi aprovado</p>
                </div>
                <div class="content">
                  <p>Prezado(a) <strong>${pessoa.nome}</strong>,</p>
                  
                  <p>É com grande satisfação que informamos que sua solicitação de acesso ao sistema <strong>AlmoxHub</strong> foi aprovada com sucesso!</p>
                  
                  <p>A partir de agora, você faz parte da nossa equipe e pode acessar todas as funcionalidades do sistema de acordo com seu perfil.</p>
                  
                  <div class="dados">
                    <h3 style="margin-top: 0; color: #0000FF;">Dados do seu Cadastro</h3>
                    <div class="dados-item"><span class="label">Nome:</span> ${sanitizeHTML(pessoa.nome)}</div>
                    <div class="dados-item"><span class="label">Matrícula:</span> ${sanitizeHTML(pessoa.matricula)}</div>
                    <div class="dados-item"><span class="label">E-mail:</span> ${sanitizeHTML(pessoa.email)}</div>
                    <div class="dados-item"><span class="label">Função/Cargo:</span> ${sanitizeHTML(pessoa.funcao) || '-'}</div>
                    <div class="dados-item"><span class="label">Perfis:</span> ${sanitizeHTML(funcoesTexto)}</div>
                    <div class="dados-item"><span class="label">Regional:</span> ${sanitizeHTML(regional?.sigla) || '-'}</div>
                    ${almoxs.length > 0 ? `<div class="dados-item"><span class="label">Almoxarifados:</span> ${almoxs.map(a => sanitizeHTML(a.nome)).join(', ')}</div>` : ''}
                  </div>
                  
                  <p>Estamos à disposição para auxiliá-lo em qualquer dúvida ou necessidade.</p>
                  
                  <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe AlmoxHub - Axia Energia</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um e-mail automático. Por favor, não responda.</p>
                  <p style="color: #0000FF; font-weight: bold;">Axia Energia</p>
                </div>
              </div>
            </body>
            </html>
          `;
        } else {
          assunto = 'AlmoxHub - Atualização sobre sua Solicitação de Acesso';
          corpo = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #0000FF 0%, #0A003C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
                .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
                .dados { background: #f9f9f9; padding: 15px; border-left: 4px solid #FF6B00; margin: 20px 0; }
                .dados-item { margin: 8px 0; }
                .label { font-weight: bold; color: #0000FF; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>AlmoxHub</h1>
                  <p style="font-size: 18px; margin: 10px 0 0 0;">Atualização sobre sua Solicitação</p>
                </div>
                <div class="content">
                  <p>Prezado(a) <strong>${sanitizeHTML(pessoa.nome)}</strong>,</p>
                  
                  <p>Lamentamos informar que, após análise, sua solicitação de acesso ao sistema <strong>AlmoxHub</strong> não pôde ser aprovada no momento.</p>
                  
                  <p>Caso acredite que houve algum equívoco ou deseje mais informações, por favor, entre em contato com o administrador do sistema.</p>
                  
                  <div class="dados">
                    <h3 style="margin-top: 0; color: #0000FF;">Dados da sua Solicitação</h3>
                    <div class="dados-item"><span class="label">Nome:</span> ${sanitizeHTML(pessoa.nome)}</div>
                    <div class="dados-item"><span class="label">Matrícula:</span> ${sanitizeHTML(pessoa.matricula)}</div>
                    <div class="dados-item"><span class="label">E-mail:</span> ${sanitizeHTML(pessoa.email)}</div>
                    <div class="dados-item"><span class="label">Função/Cargo:</span> ${sanitizeHTML(pessoa.funcao) || '-'}</div>
                    <div class="dados-item"><span class="label">Perfis Solicitados:</span> ${sanitizeHTML(funcoesTexto)}</div>
                    <div class="dados-item"><span class="label">Regional:</span> ${sanitizeHTML(regional?.sigla) || '-'}</div>
                  </div>
                  
                  <p>Agradecemos seu interesse no AlmoxHub.</p>
                  
                  <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe AlmoxHub - Axia Energia</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um e-mail automático. Por favor, não responda.</p>
                  <p style="color: #0000FF; font-weight: bold;">Axia Energia</p>
                </div>
              </div>
            </body>
            </html>
          `;
        }

        // Enviar e-mail em background sem bloquear a UI
        base44.integrations.Core.SendEmail({
          from_name: 'AlmoxHub - Axia Energia',
          to: pessoa.email,
          subject: assunto,
          body: corpo
        }).catch(emailError => {
          console.error('Erro ao enviar e-mail:', emailError);
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status de aprovação');
      alert('Erro ao atualizar status de aprovação. Tente novamente.');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, foto_perfil: file_url });
    } catch (error) {
      console.error('Erro ao fazer upload');
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, foto_perfil: '' });
  };

  const getRegional = (id) => regionais.find(r => r.id === id);
  const filteredAlmoxarifados = almoxarifados.filter(a => a.regional_id === formData.regional_id);

  const getUniqueValues = (column) => {
    const values = new Set();
    pessoas.forEach(p => {
      if (column === 'nome') values.add(p.nome);
      if (column === 'matricula') values.add(p.matricula);
      if (column === 'funcao') values.add(p.funcao);
      if (column === 'regional') {
        const reg = getRegional(p.regional_id);
        if (reg) values.add(reg.sigla);
      }
      if (column === 'funcoes') {
        (p.funcoes || []).forEach(f => values.add(f));
      }
      if (column === 'status') values.add(p.ativo !== false ? 'Ativo' : 'Inativo');
      if (column === 'acesso') {
        const status = p.status_aprovacao === 'aprovado' ? 'Aprovado' :
                       p.status_aprovacao === 'rejeitado' ? 'Rejeitado' : 'Pendente';
        values.add(status);
      }
    });
    return Array.from(values).filter(Boolean).sort();
  };

  // Sanitizar busca para prevenir injection
  const sanitizedSearch = search.trim().replace(/[^\w\s\-@.]/g, '').substring(0, 100);
  
  let filteredItems = pessoas.filter(p => {
    if (filterRegional !== 'all' && p.regional_id !== filterRegional) return false;
    if (filterAlmoxarifado !== 'all' && !p.almoxarifados_ids?.includes(filterAlmoxarifado)) return false;
    if (filterFuncao !== 'all' && !p.funcoes?.includes(filterFuncao)) return false;
    if (sanitizedSearch && !p.nome?.toLowerCase().includes(sanitizedSearch.toLowerCase()) && 
        !p.matricula?.toLowerCase().includes(sanitizedSearch.toLowerCase())) return false;
    
    // Filtros de coluna
    if (columnFilters.nome.length > 0 && !columnFilters.nome.includes(p.nome)) return false;
    if (columnFilters.matricula.length > 0 && !columnFilters.matricula.includes(p.matricula)) return false;
    if (columnFilters.funcao.length > 0 && !columnFilters.funcao.includes(p.funcao)) return false;
    const regional = getRegional(p.regional_id);
    if (columnFilters.regional.length > 0 && !columnFilters.regional.includes(regional?.sigla)) return false;
    if (columnFilters.funcoes.length > 0) {
      const hasFuncao = columnFilters.funcoes.some(f => p.funcoes?.includes(f));
      if (!hasFuncao) return false;
    }
    const status = p.ativo !== false ? 'Ativo' : 'Inativo';
    if (columnFilters.status.length > 0 && !columnFilters.status.includes(status)) return false;
    const acesso = p.status_aprovacao === 'aprovado' ? 'Aprovado' :
                    p.status_aprovacao === 'rejeitado' ? 'Rejeitado' : 'Pendente';
    if (columnFilters.acesso.length > 0 && !columnFilters.acesso.includes(acesso)) return false;
    
    return true;
  });

  // Aplicar ordenação
  if (sortConfig.column && sortConfig.direction) {
    filteredItems = [...filteredItems].sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.column === 'nome') {
        aValue = a.nome || '';
        bValue = b.nome || '';
      } else if (sortConfig.column === 'matricula') {
        aValue = a.matricula || '';
        bValue = b.matricula || '';
      } else if (sortConfig.column === 'funcao') {
        aValue = a.funcao || '';
        bValue = b.funcao || '';
      } else if (sortConfig.column === 'regional') {
        const regA = getRegional(a.regional_id);
        const regB = getRegional(b.regional_id);
        aValue = regA?.sigla || '';
        bValue = regB?.sigla || '';
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Pessoas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os colaboradores</p>
        </div>
        {currentPessoa?.funcoes?.includes('gestor') && (
          <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Pessoa
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRegional} onValueChange={setFilterRegional}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Regional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Regionais</SelectItem>
              {regionais.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAlmoxarifado} onValueChange={setFilterAlmoxarifado}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Almoxarifado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {almoxarifados
                .filter(a => filterRegional === 'all' || a.regional_id === filterRegional)
                .map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={filterFuncao} onValueChange={setFilterFuncao}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Funções</SelectItem>
              <SelectItem value="gestor">Gestor</SelectItem>
              <SelectItem value="lider">Líder</SelectItem>
              <SelectItem value="almoxarife">Almoxarife</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead className="font-semibold">
                <SortableTableHead
                  label="Pessoa"
                  column="nome"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableTableHead
                  label="Matrícula"
                  column="matricula"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableTableHead
                  label="Função"
                  column="funcao"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableTableHead
                  label="Regional"
                  column="regional"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead className="font-semibold">Almoxarifados</TableHead>
              <TableHead className="font-semibold">
                <SortableTableHead
                  label="Perfil"
                  column="funcoes"
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                  renderFilterItem={(column, value) => (
                    <span className="text-sm">{funcaoLabels[value]?.label || value}</span>
                  )}
                />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableTableHead
                  label="Status"
                  column="status"
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead className="font-semibold">
                <SortableTableHead
                  label="Acesso"
                  column="acesso"
                  filterConfig={columnFilters}
                  onToggleFilter={toggleFilter}
                  onClearFilter={clearFilter}
                  getUniqueValues={getUniqueValues}
                />
              </TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Nenhuma pessoa cadastrada</p>
              </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const regional = getRegional(item.regional_id);
                return (
                  <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {item.foto_perfil && (
                            <AvatarImage src={item.foto_perfil} alt={item.nome} />
                          )}
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {item.nome?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{item.nome}</p>
                          <p className="text-sm text-slate-500">{item.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.matricula}</TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.funcao || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{regional?.sigla || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {item.almoxarifados_ids?.length > 0 ? (
                          almoxarifados
                            .filter(a => item.almoxarifados_ids.includes(a.id))
                            .slice(0, 2)
                            .map(a => (
                              <span key={a.id} className="text-xs text-slate-600 dark:text-slate-400">
                                {a.nome}
                              </span>
                            ))
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                        {item.almoxarifados_ids?.length > 2 && (
                          <span className="text-xs text-slate-500">
                            +{item.almoxarifados_ids.length - 2} mais
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className={`flex gap-1 flex-wrap ${currentUser?.role === 'admin' ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                        onClick={() => handleFuncoesClick(item)}
                        title={currentUser?.role === 'admin' ? 'Clique para editar funções' : ''}
                      >
                        {item.funcoes?.map(f => (
                          <Badge key={f} className={funcaoLabels[f]?.color}>
                            {funcaoLabels[f]?.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${item.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'} ${currentUser?.role === 'admin' ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                        onClick={() => toggleStatus(item)}
                        title={currentUser?.role === 'admin' ? 'Clique para alterar status' : ''}
                      >
                        {item.ativo !== false ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${
                          item.status_aprovacao === 'aprovado' ? 'bg-green-100 text-green-700' :
                          item.status_aprovacao === 'rejeitado' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        } ${currentUser?.role === 'admin' ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                        onClick={() => toggleStatusAprovacao(item)}
                        title={currentUser?.role === 'admin' ? 'Clique para alterar status de aprovação' : ''}
                      >
                        {item.status_aprovacao === 'aprovado' ? 'Aprovado' :
                         item.status_aprovacao === 'rejeitado' ? 'Rejeitado' :
                         'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(currentPessoa?.funcoes?.includes('gestor') || item.id === currentPessoa?.id) && (
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {currentPessoa?.funcoes?.includes('gestor') && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {filteredItems.length > 0 && (
              <TableRow className="bg-slate-50 dark:bg-slate-800 font-semibold border-t-2 border-slate-300 dark:border-slate-600">
                <TableCell colSpan={8} className="text-slate-900 dark:text-white">
                  Total de Pessoas
                </TableCell>
                <TableCell className="text-right text-slate-900 dark:text-white">
                  {filteredItems.length}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.id === currentPessoa?.id ? 'Editar Meu Perfil' : selectedItem ? 'Editar Pessoa' : 'Nova Pessoa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                {formData.foto_perfil ? (
                  <div className="relative">
                    <img
                      src={formData.foto_perfil}
                      alt="Foto de perfil"
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('image-upload').click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploadingImage ? 'Enviando...' : 'Escolher foto'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matrícula *</Label>
                <Input
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  placeholder="000000"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Função/Cargo</Label>
              <Input
                value={formData.funcao}
                onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                placeholder="Ex: Analista, Técnico, Coordenador..."
              />
            </div>
            <div className="space-y-2">
              <Label>Regional *</Label>
              <Select
                value={formData.regional_id}
                onValueChange={(v) => setFormData({ ...formData, regional_id: v, almoxarifados_ids: [] })}
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
            <div className="space-y-2">
              <Label>Funções *</Label>
              <div className="flex gap-4">
                {Object.entries(funcaoLabels).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`funcao-${key}`}
                      checked={formData.funcoes.includes(key)}
                      onCheckedChange={() => toggleFuncao(key)}
                      disabled={selectedItem?.id === currentPessoa?.id && !currentPessoa?.funcoes?.includes('gestor')}
                    />
                    <Label htmlFor={`funcao-${key}`} className="cursor-pointer">{val.label}</Label>
                  </div>
                ))}
              </div>
              {selectedItem?.id === currentPessoa?.id && !currentPessoa?.funcoes?.includes('gestor') && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Apenas gestores podem alterar funções
                </p>
              )}
            </div>
            {formData.regional_id && (
              <div className="space-y-2">
                <Label>Almoxarifados Vinculados</Label>
                <div className="max-h-32 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {filteredAlmoxarifados.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum almoxarifado nesta regional</p>
                  ) : (
                    filteredAlmoxarifados.map(a => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`almox-${a.id}`}
                          checked={formData.almoxarifados_ids.includes(a.id)}
                          onCheckedChange={() => toggleAlmoxarifado(a.id)}
                        />
                        <Label htmlFor={`almox-${a.id}`} className="cursor-pointer text-sm">{a.nome}</Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.matricula || !formData.nome || !formData.email || 
                       !formData.regional_id || formData.funcoes.length === 0 || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Profile Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Perfil Completo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-3">
              {viewingItem?.foto_perfil ? (
                <img
                  src={viewingItem.foto_perfil}
                  alt={viewingItem.nome}
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                  {viewingItem?.nome?.charAt(0) || '?'}
                </div>
              )}
            </div>

            {/* Informações Básicas */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Nome Completo</Label>
                <p className="text-base font-medium text-slate-900 dark:text-white mt-1">{viewingItem?.nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Matrícula</Label>
                  <p className="text-base font-mono text-slate-900 dark:text-white mt-1">{viewingItem?.matricula}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Status</Label>
                  <div className="mt-1">
                    <Badge className={viewingItem?.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                      {viewingItem?.ativo !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">E-mail</Label>
                <p className="text-base text-slate-900 dark:text-white mt-1">{viewingItem?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Regional</Label>
                <p className="text-base text-slate-900 dark:text-white mt-1">
                  {regionais.find(r => r.id === viewingItem?.regional_id)?.sigla || '-'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Funções</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {viewingItem?.funcoes?.map(f => (
                    <Badge key={f} className={funcaoLabels[f]?.color}>
                      {funcaoLabels[f]?.label}
                    </Badge>
                  ))}
                </div>
              </div>
              {viewingItem?.almoxarifados_ids?.length > 0 && (
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Almoxarifados Vinculados</Label>
                  <div className="mt-2 space-y-1">
                    {almoxarifados
                      .filter(a => viewingItem.almoxarifados_ids.includes(a.id))
                      .map(a => (
                        <p key={a.id} className="text-sm text-slate-900 dark:text-white">• {a.nome}</p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>Fechar</Button>
            <Button onClick={() => {
              setShowViewModal(false);
              handleEdit(viewingItem);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Edit Funcoes Modal */}
      <Dialog open={showFuncoesModal} onOpenChange={setShowFuncoesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Funções</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {editingFuncoes.pessoa?.nome}
            </p>
            <div className="space-y-3">
              {Object.entries(funcaoLabels).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={`edit-funcao-${key}`}
                    checked={editingFuncoes.funcoes.includes(key)}
                    onCheckedChange={() => toggleEditingFuncao(key)}
                  />
                  <Label htmlFor={`edit-funcao-${key}`} className="cursor-pointer flex-1">
                    {val.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFuncoesModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={saveFuncoes} 
              disabled={saving || editingFuncoes.funcoes.length === 0}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pessoa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedItem?.nome}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}