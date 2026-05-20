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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Slider } from '@/components/ui/slider';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Save, Plus, Trash2, Upload, X, Loader2, Paperclip, Check, ChevronsUpDown, ExternalLink, Tag, Printer, Share2, MessageSquare, History, Image as ImageIcon, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import OSItensDocumento from './OSItensDocumento';
import OSVolumes from './OSVolumes';
import OSDetalhamentoExpedicao from './OSDetalhamentoExpedicao';
import OSRecebimentoDocumento from './OSRecebimentoDocumento.jsx';
import OSRecebimentoTransportador from './OSRecebimentoTransportador.jsx';
import OSRecebimentoMateriais from './OSRecebimentoMateriais.jsx';
import OSAtendimentoMateriais from './OSAtendimentoMateriais.jsx';
import OSFluxoRecebimento from './OSFluxoRecebimento.jsx';
import OSPrazosControle from './OSPrazosControle.jsx';
import RotuloSelector from '@/components/rotulos/RotuloSelector';
import OSAssinaturaTab from './OSAssinaturaTab.jsx';
import EtiquetaVolumesModal from './EtiquetaVolumesModal';
import OSFormHelp from './OSFormHelp';
import { formatarTempo } from '@/components/timesheet/TimeSheetButton';
import RelatorioOS from './RelatorioOS';
import RelatorioSeparacao from './RelatorioSeparacao';
import RelatorioConferencia from './RelatorioConferencia';
import { ListChecks, ClipboardCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { canEditOS } from '@/lib/osPermissions';
import { Edit } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import OSHeaderIconButton from './OSHeaderIconButton';
import OSHeaderTimeSheetButton from './OSHeaderTimeSheetButton';
import OSComentariosTab from './OSComentariosTab';
import OSHistoricoTab from './OSHistoricoTab';
import OSGuiaFluxoPainel from './OSGuiaFluxoPainel';
import OSIndicadoresPainel from './OSIndicadoresPainel';
import { getFluxoState } from '@/lib/osFluxoValidator';
import { toast as sonnerToast } from 'sonner';

const EMPTY_FORM = {
  categoria_id: '', subcategorias_ids: [], regional_id: '', almoxarifado_id: '',
  lider_id: '', atendente_nome: '', executores_ids: [], outros_envolvidos_ids: [],
  prazo: '', data_inicial: format(new Date(), 'yyyy-MM-dd'), data_conclusao: '',
  prioridade: 'media', complexidade: '', status: 'elaboracao', anotacoes: '', projetos_ids: [],
  rotulos_ids: [], descricao_resumida: '', num_reserva: '', data_reserva: '',
  usuario_reserva: '', usuario_reserva_email: '', orgao: '', data_migo: '',
  num_migo: '', vinculacao: '', instalacao_origem_id: '', instalacao_destino_id: '',
  data_ressuprimento: '', data_aprovacao_epi: '',
  destino_externo: false, destino_externo_descricao: '',
  tipo_movimento: '', local_entrega: '', observacoes_adicionais: '',
  itens_documento: [], volumes: [], detalhamento_expedicao: [],
  status_separacao: 'pendente', responsavel_separacao: '', data_separacao: '',
  separacao_concluida_em: '', data_entrega: '', data_necessidade: '', anexos: [], imagens: [],
  nfe_numero: '', nfe_serie: '', nfe_data_emissao: '', nfe_chave_acesso: '',
  nfe_natureza_operacao: '', nfe_dados_emissor: {}, nfe_dados_destinatario: {},
  nfe_dados_transportador: {}, nfe_info_complementares: '', nfe_itens_conferencia: [],
  nfe_numero_receb: '', nfe_data_receb: '', numero_migo_receb: '',
  data_migo_receb: '', numero_v360: '', doc_referencia: '', data_recebimento: '',
  responsavel_recebimento: '', problema_recebimento: null, problemas_recebimento_ids: [],
  resumo_pendencias: '', acoes_acompanhamento: '', como_foi_solucionado: '',
  data_solucao: '', problemas_anexos: [],
  fluxo_recebimento: { etapa_atual: 1, xml_importado: false, conferencia_manual_completa: false, validacao_divergencias_completa: false, armazenagem_completa: false },
  fluxo_expedicao: { etapa_atual: 1, solicitacao_completa: true, solicitacao_data: new Date().toISOString(), separacao_completa: false, preparacao_completa: false, envio_completo: false, entrega_completa: false },
  is_global: false
};

export default function OSFormModal({
  open, onClose, os, regionais, almoxarifados, pessoas, categorias, subcategorias,
  projetos, instalacoes, currentUser, onSave, initialMode = 'edit',
  onDelete, onCreateRelated, canDelete = false
}) {
  const [loading, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [loadedFormTabs, setLoadedFormTabs] = useState(new Set(['geral']));
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const PAGE_SIZE = 20;
  // Modo leitura/edição (apenas para OS existentes; novas sempre em edição)
  const [readOnly, setReadOnly] = useState(initialMode === 'read' && !!os?.id);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleFormTabChange = (tab) => {
    setActiveTab(tab);
    setLoadedFormTabs(prev => new Set([...prev, tab]));
    // Lazy-load histórico
    if (tab === 'historico' && os?.id && auditLogs.length === 0) {
      loadAuditLogsInternal();
    }
  };

  const loadAuditLogsInternal = async () => {
    if (!os?.id) return;
    try {
      const logs = await base44.entities.AuditLog.filter(
        { entity_type: 'OrdemServico', entity_id: os.id },
        '-created_date', 200
      );
      const arr = Array.isArray(logs) ? logs : [];
      setAuditLogs(arr.sort((a, b) => new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date)));
    } catch (e) { /* silently fail — audit log is non-critical */ }
  };

  const handleShareOS = () => {
    if (!os?.id) return;
    const url = `${window.location.origin}${window.location.pathname}?os_id=${os.id}`;
    navigator.clipboard.writeText(url).then(() => {
      sonnerToast.success('Link copiado!');
    }).catch(() => sonnerToast.error('Erro ao copiar link'));
  };
  const [generatingOSPDF, setGeneratingOSPDF] = useState(false);
  const [showRelatorioOS, setShowRelatorioOS] = useState(false);
  const [generatingSeparacaoPDF, setGeneratingSeparacaoPDF] = useState(false);
  const [showRelatorioSeparacao, setShowRelatorioSeparacao] = useState(false);
  const [generatingConferenciaPDF, setGeneratingConferenciaPDF] = useState(false);
  const [showRelatorioConferencia, setShowRelatorioConferencia] = useState(false);
  const [importingPDF, setImportingPDF] = useState(false);
  const [showEtiquetaModal, setShowEtiquetaModal] = useState(false);
  const [zmmtsePDF, setZmmtsePDF] = useState(null);
  const [openOrigemCombo, setOpenOrigemCombo] = useState(false);
  const [openDestinoCombo, setOpenDestinoCombo] = useState(false);
  const [prazoError, setPrazoError] = useState('');
  const [importingXML, setImportingXML] = useState(false);
  const [problemasRecebimento, setProblemasRecebimento] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const isMountedRef = React.useRef(true);
  const initializedForRef = React.useRef(null); // tracks which os.id (or 'new') was last initialized
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Marca isDirty quando o formData muda após o init (apenas em modo edição)
  const skipDirtyRef = React.useRef(true);
  useEffect(() => {
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false;
      return;
    }
    if (!readOnly) setIsDirty(true);
  }, [formData]);

  // Reseta o skip quando reinicializa o form
  useEffect(() => {
    skipDirtyRef.current = true;
  }, [os?.id, open]);

  // Permissão para editar
  const currentPessoaForPerms = pessoas?.find(p => p.user_id === currentUser?.id);
  const userCanEdit = !os?.id || canEditOS(os, currentUser, currentPessoaForPerms);

  // Handler de fechamento com confirmação se houver mudanças
  const handleCloseRequest = () => {
    if (isDirty && !readOnly) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Load auxiliary data only once when modal opens
  useEffect(() => {
    if (!open) return;
    isMountedRef.current = true;
    const loadData = async () => {
      try {
        const [problemas, equipesData] = await Promise.all([
          base44.entities.ProblemaRecebimento.list('-descricao_resumida'),
          base44.entities.Equipe.filter({ ativa: true })
        ]);
        if (isMountedRef.current) {
          setProblemasRecebimento(problemas);
          setEquipes(equipesData);
        }
      } catch (error) { console.error('Erro ao carregar dados:', error); }
    };
    loadData();
    return () => { isMountedRef.current = false; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      // Reset tracker when modal closes so next open reinitializes
      initializedForRef.current = null;
      setLoadedFormTabs(new Set(['geral']));
      setIsDirty(false);
      return;
    }

    const currentKey = os?.id || (os && !os.id ? 'new' : 'empty');
    // Only reinitialize if the modal just opened for a different OS
    if (initializedForRef.current === currentKey) return;
    initializedForRef.current = currentKey;
    // Reset modo leitura/edição para o novo OS
    setReadOnly(initialMode === 'read' && !!os?.id);
    setIsDirty(false);

    const formatDateForInput = (d) => {
      if (!d) return '';
      // Se já está no formato yyyy-MM-dd puro, retorna direto
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      // Para qualquer string ISO, interpreta no fuso local do browser (igual ao modo de exibição)
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (os && os.id) {
      setFormData({
        ...EMPTY_FORM,
        categoria_id: os.categoria_id || '', subcategorias_ids: os.subcategorias_ids || [],
        regional_id: os.regional_id || '', almoxarifado_id: os.almoxarifado_id || '',
        lider_id: os.lider_id || '', atendente_nome: os.atendente_nome || '',
        executores_ids: os.executores_ids || [], outros_envolvidos_ids: os.outros_envolvidos_ids || [],
        prazo: formatDateForInput(os.prazo), data_inicial: formatDateForInput(os.data_inicial),
        data_conclusao: formatDateForInput(os.data_conclusao),
        prioridade: os.prioridade || 'media', complexidade: os.complexidade || '', status: os.status || 'elaboracao',
        anotacoes: os.anotacoes || '', projetos_ids: os.projetos_ids || [],
        rotulos_ids: os.rotulos_ids || [],
        descricao_resumida: os.descricao_resumida || '', num_reserva: os.num_reserva || '',
        data_reserva: formatDateForInput(os.data_reserva), usuario_reserva: os.usuario_reserva || '',
        usuario_reserva_email: os.usuario_reserva_email || '', orgao: os.orgao || '',
        data_migo: formatDateForInput(os.data_migo), num_migo: os.num_migo || '',
        vinculacao: os.vinculacao || '', instalacao_origem_id: os.instalacao_origem_id || '',
        instalacao_destino_id: os.instalacao_destino_id || '',
        data_ressuprimento: formatDateForInput(os.data_ressuprimento),
        data_aprovacao_epi: formatDateForInput(os.data_aprovacao_epi),
        destino_externo: os.destino_externo || false,
        destino_externo_descricao: os.destino_externo_descricao || '',
        tipo_movimento: os.tipo_movimento || '',
        local_entrega: os.local_entrega || '',
        observacoes_adicionais: os.observacoes_adicionais || '',
        itens_documento: os.itens_documento || [], volumes: os.volumes || [],
        detalhamento_expedicao: os.detalhamento_expedicao || [],
        status_separacao: os.status_separacao || 'pendente',
        responsavel_separacao: os.responsavel_separacao || '',
        data_separacao: formatDateForInput(os.data_separacao),
        separacao_concluida_em: formatDateForInput(os.separacao_concluida_em),
        data_entrega: formatDateForInput(os.data_entrega),
        data_necessidade: formatDateForInput(os.data_necessidade),
        anexos: os.anexos || [], imagens: os.imagens || [],
        nfe_numero: os.nfe_numero || '', nfe_serie: os.nfe_serie || '',
        nfe_data_emissao: os.nfe_data_emissao || '', nfe_chave_acesso: os.nfe_chave_acesso || '',
        nfe_natureza_operacao: os.nfe_natureza_operacao || '',
        nfe_dados_emissor: os.nfe_dados_emissor || {},
        nfe_dados_destinatario: os.nfe_dados_destinatario || {},
        nfe_dados_transportador: os.nfe_dados_transportador || {},
        nfe_info_complementares: os.nfe_info_complementares || '',
        nfe_itens_conferencia: os.nfe_itens_conferencia || [],
        nfe_numero_receb: os.nfe_numero_receb || '', nfe_data_receb: os.nfe_data_receb || '',
        numero_migo_receb: os.numero_migo_receb || '',
        data_migo_receb: formatDateForInput(os.data_migo_receb),
        numero_v360: os.numero_v360 || '', doc_referencia: os.doc_referencia || '',
        data_recebimento: formatDateForInput(os.data_recebimento),
        responsavel_recebimento: os.responsavel_recebimento || '',
        problema_recebimento: os.problema_recebimento || false,
        problemas_recebimento_ids: os.problemas_recebimento_ids || [],
        resumo_pendencias: os.resumo_pendencias || '',
        acoes_acompanhamento: os.acoes_acompanhamento || '',
        como_foi_solucionado: os.como_foi_solucionado || '',
        data_solucao: formatDateForInput(os.data_solucao),
        problemas_anexos: os.problemas_anexos || [],
        fluxo_recebimento: os.fluxo_recebimento || EMPTY_FORM.fluxo_recebimento,
        fluxo_expedicao: os.fluxo_expedicao || { ...EMPTY_FORM.fluxo_expedicao, solicitacao_data: os.created_date || new Date().toISOString() },
        codigo: os.codigo || '', progresso: os.progresso || 0,
        is_global: os.is_global || false
      });
    } else if (os && !os.id) {
      const currentPessoaNome = pessoas?.find(p => p.user_id === currentUser?.id)?.nome || currentUser?.full_name || '';
      setFormData({ ...EMPTY_FORM, atendente_nome: currentPessoaNome, anotacoes: `Descrição: ${os.descricao_resumida || ''}` });
    } else {
      const currentPessoaNome = pessoas?.find(p => p.user_id === currentUser?.id)?.nome || currentUser?.full_name || '';
      setFormData({ ...EMPTY_FORM, atendente_nome: currentPessoaNome, fluxo_expedicao: { ...EMPTY_FORM.fluxo_expedicao, solicitacao_data: new Date().toISOString() } });
    }

  }, [open, os?.id, os]);

  const filteredSubcategorias = Array.isArray(subcategorias) ? subcategorias.filter(s => s?.categoria_id === formData.categoria_id) : [];
  const filteredAlmoxarifados = Array.isArray(almoxarifados) ? almoxarifados.filter(a => a?.regional_id === formData.regional_id && a?.ativo !== false) : [];
  const filteredInstalacoes = Array.isArray(instalacoes) ? instalacoes.filter(i => i?.regional_id === formData.regional_id) : [];
  const selectedCategoria = Array.isArray(categorias) ? categorias.find(c => c?.id === formData.categoria_id) : null;
  const selectedSubcategorias = Array.isArray(subcategorias) ? subcategorias.filter(s => formData.subcategorias_ids?.includes(s?.id)) : [];
  const isVendaIntercompany = selectedSubcategorias.some(s => s?.nome?.toLowerCase().includes('venda intercompany'));
  const selectedAlmoxarifado = Array.isArray(almoxarifados) ? almoxarifados.find(a => a?.id === formData.almoxarifado_id) : null;
  const selectedInstalacaoAlmoxarifado = Array.isArray(instalacoes) ? instalacoes.find(i => i?.id === selectedAlmoxarifado?.instalacao_id) : null;
  const regiaoAlmoxarifado = selectedInstalacaoAlmoxarifado?.regiao;
  const filteredInstalacoesDestino = isVendaIntercompany ? (Array.isArray(instalacoes) ? instalacoes : []) : (Array.isArray(instalacoes) ? instalacoes.filter(i => i?.regiao === regiaoAlmoxarifado) : []);
  const isExpedicaoCategory = selectedCategoria?.nome?.toLowerCase().includes('expedição');
  const isRecebimentoCategory = selectedCategoria?.nome?.toLowerCase().includes('recebimento');
  const isAtendimentoCategory = selectedCategoria?.nome?.toLowerCase().includes('atendimento');
  // Abas de fluxo de expedição (Documento/Materiais/Volumes/Expedição) aparecem
  // para QUALQUER subcategoria de Expedição. As regras estritas de campos obrigatórios
  // (reserva, usuário, vinculação, etc.) só se aplicam para "Com Reserva" e "Sem Reserva".
  const usaFluxoExpedicao = isExpedicaoCategory;
  const usaFluxoExpedicaoEstrito = isExpedicaoCategory && selectedSubcategorias.some(s => {
    const nome = s?.nome?.toLowerCase() || '';
    return nome.includes('com reserva') || nome.includes('sem reserva');
  });
  // Abas de fluxo de recebimento só aparecem para subcategorias "Compra - Aplicação Específica"
  // ou "Compra - Estoque". Demais subcategorias usam progresso manual.
  const usaFluxoRecebimento = isRecebimentoCategory && selectedSubcategorias.some(s => {
    const nome = s?.nome?.toLowerCase() || '';
    return nome.includes('aplicação específica') || nome.includes('aplicacao especifica') || nome.includes('estoque');
  });

  const calculateProgress = (data) => {
    const isRecebimento = usaFluxoRecebimento;
    if (isRecebimento) {
      let progress = 0;
      if (data.fluxo_recebimento?.xml_importado) progress = 25;
      if (data.fluxo_recebimento?.conferencia_manual_completa) progress = 50;
      if (progress >= 50 && !data.fluxo_recebimento?.validacao_divergencias_completa) {
        if (!data.problema_recebimento) {
          progress = 75;
          data.fluxo_recebimento = { ...data.fluxo_recebimento, validacao_divergencias_completa: true, etapa_atual: 4 };
        } else {
          const temProblemasSelecionados = data.problemas_recebimento_ids?.length > 0;
          const temDataSolucao = !!data.data_solucao;
          if (temProblemasSelecionados && temDataSolucao) {
            progress = 75;
            data.fluxo_recebimento = { ...data.fluxo_recebimento, validacao_divergencias_completa: true, etapa_atual: 4 };
          }
        }
      }
      if (data.fluxo_recebimento?.validacao_divergencias_completa) progress = 75;
      if (data.fluxo_recebimento?.armazenagem_completa) progress = 100;
      return progress;
    }
    let progress = 0;
    if (data.fluxo_expedicao?.solicitacao_completa) progress = 20;
    if (data.fluxo_expedicao?.separacao_completa) progress = 40;
    if (data.fluxo_expedicao?.preparacao_completa) progress = 60;
    if (data.fluxo_expedicao?.envio_completo) progress = 80;
    if (data.fluxo_expedicao?.entrega_completa) progress = 100;
    return progress;
  };

  const handleSubmit = async (closeAfter = false) => {
    setSaving(true);
    try {
      let codigo = formData.codigo;
      const isNew = !os?.id;
      if (isNew) {
        const regional = Array.isArray(regionais) ? regionais.find(r => r?.id === formData.regional_id) : null;
        const regionalSigla = regional?.sigla || 'XX';
        const today = format(new Date(), 'yyyyMMdd');
        const allOrdens = await base44.entities.OrdemServico.list();
        const existingCodes = new Set((allOrdens || []).map(o => o?.codigo).filter(Boolean));
        let seq = 1, codigo_tentativa = '';
        do {
          codigo_tentativa = `${regionalSigla}-${today}-${String(seq).padStart(4, '0')}`;
          seq++;
        } while (existingCodes.has(codigo_tentativa));
        codigo = codigo_tentativa;
      }

      let fluxoExpedicao = formData.fluxo_expedicao;
      if (usaFluxoExpedicao && isNew && !fluxoExpedicao) {
        fluxoExpedicao = { etapa_atual: 1, solicitacao_completa: true, solicitacao_data: new Date().toISOString(), separacao_completa: false, preparacao_completa: false, envio_completo: false, entrega_completa: false };
      }

      const progressoCalculado = (usaFluxoExpedicao || usaFluxoRecebimento)
        ? calculateProgress({ ...formData, fluxo_expedicao: usaFluxoExpedicao ? fluxoExpedicao : formData.fluxo_expedicao })
        : (formData.progresso || 0);

      // Auto-conclusão: em OS com fluxo, se progresso === 100, status passa para 'concluido'
      // (somente no save manual; não sobrescreve status 'cancelado').
      const temFluxo = usaFluxoExpedicao || usaFluxoRecebimento;
      const statusAutoConcluido = (temFluxo && progressoCalculado === 100 && formData.status !== 'cancelado' && formData.status !== 'concluido')
        ? 'concluido'
        : formData.status;
      const autoConcluiuAgora = statusAutoConcluido === 'concluido' && formData.status !== 'concluido';

      const dataToSave = {
        ...formData, codigo,
        fluxo_expedicao: usaFluxoExpedicao ? fluxoExpedicao : formData.fluxo_expedicao,
        status: statusAutoConcluido,
        progresso: progressoCalculado
      };

      let savedOS;
      if (os?.id) {
        savedOS = await base44.entities.OrdemServico.update(os.id, dataToSave);
        if (usaFluxoExpedicao) {
          try { await base44.functions.invoke('atualizarFluxoExpedicao', { os_id: os.id }); } catch (e) {}
        }
        // Encerrar TimeSheet se status mudou para concluído ou cancelado
        if ((dataToSave.status === 'concluido' || dataToSave.status === 'cancelado') && (os.status !== dataToSave.status)) {
          try { await base44.functions.invoke('encerrarTimeSheetOS', { os_id: os.id }); } catch (e) {}
        }
        try {
          const camposSignificativos = ['status', 'prioridade', 'progresso', 'prazo', 'lider_id', 'almoxarifado_id', 'categoria_id', 'regional_id', 'data_inicial', 'data_conclusao', 'anotacoes', 'descricao_resumida', 'atendente_nome'];
          const camposAlterados = {};
          camposSignificativos.forEach(campo => {
            if (JSON.stringify(os[campo]) !== JSON.stringify(dataToSave[campo])) {
              camposAlterados[campo] = { valor_anterior: os[campo], valor_novo: dataToSave[campo] };
            }
          });
          for (const [campo, valores] of Object.entries(camposAlterados)) {
            await base44.functions.invoke('registrarAuditLog', { action: 'update', entity_type: 'OrdemServico', entity_id: os.id, details: { campo, ...valores } });
          }

          // Registrar mudança de rótulos separadamente com nomes legíveis
          const rotulosAntes = os.rotulos_ids || [];
          const rotulosDepois = dataToSave.rotulos_ids || [];
          if (JSON.stringify([...rotulosAntes].sort()) !== JSON.stringify([...rotulosDepois].sort())) {
            try {
              const todosRotulos = await base44.entities.Rotulo.filter({ ativo: true });
              const nomesAntes = rotulosAntes.map(id => todosRotulos.find(r => r.id === id)?.nome).filter(Boolean);
              const nomesDepois = rotulosDepois.map(id => todosRotulos.find(r => r.id === id)?.nome).filter(Boolean);
              await base44.functions.invoke('registrarAuditLog', {
                action: 'update',
                entity_type: 'OrdemServico',
                entity_id: os.id,
                details: {
                  campo: 'rotulos_ids',
                  valor_anterior: nomesAntes.length > 0 ? nomesAntes.join(', ') : '(nenhum)',
                  valor_novo: nomesDepois.length > 0 ? nomesDepois.join(', ') : '(nenhum)'
                }
              });
            } catch (e) {}
          }
        } catch (e) {}
      } else {
        savedOS = await base44.entities.OrdemServico.create(dataToSave);
        if (usaFluxoExpedicao) {
          try { await base44.functions.invoke('atualizarFluxoExpedicao', { os_id: savedOS.id }); } catch (e) {}
        }
        try { await base44.functions.invoke('registrarAuditLog', { action: 'create', entity_type: 'OrdemServico', entity_id: savedOS.id, details: { descricao: `OS ${codigo} criada` } }); } catch (e) {}
        const pessoasParaNotificar = new Set();
        if (formData.lider_id) pessoasParaNotificar.add(formData.lider_id);
        if (formData.executores_ids?.length > 0) formData.executores_ids.forEach(id => pessoasParaNotificar.add(id));
        if (formData.atendente_nome) {
          const atendente = pessoas.find(p => p.nome === formData.atendente_nome);
          if (atendente) pessoasParaNotificar.add(atendente.id);
        }
        const currentPessoa = pessoas.find(p => p.user_id === currentUser?.id);
        if (currentPessoa) pessoasParaNotificar.delete(currentPessoa.id);
        for (const pessoaId of pessoasParaNotificar) {
          try {
            await base44.entities.Notificacao.create({ destinatario_id: pessoaId, remetente_id: currentPessoa?.id, tipo: 'atribuicao', referencia_id: savedOS.id, referencia_tipo: 'tarefa', mensagem: `Você foi atribuído(a) à nova OS ${codigo}`, lida: false });
          } catch (e) {}
        }
      }

      // Se houve auto-conclusão, encerra TimeSheet e avisa o usuário
      if (autoConcluiuAgora) {
        try { await base44.functions.invoke('encerrarTimeSheetOS', { os_id: savedOS.id || os?.id }); } catch (e) {}
      }

      if (closeAfter && isMountedRef.current) {
        onClose();
      }
      if (isMountedRef.current) {
        onSave?.(isNew, { ...dataToSave, id: savedOS.id || os?.id });
        if (autoConcluiuAgora) {
          toast.success(`OS ${codigo || savedOS.codigo} concluída automaticamente`, {
            description: 'Progresso atingiu 100% — status alterado para Concluído.',
          });
        } else {
          toast.success(`OS ${codigo || savedOS.codigo} salva com sucesso!`);
        }
      }
    } catch (error) {
      console.error('Error saving OS:', error);
      if (isMountedRef.current) toast.error('Erro ao salvar OS', { description: error.message });
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  };

  const handleFileUpload = async (e, field) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), result.file_url] }));
    }
  };

  const handleNFeXMLUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingXML(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const xmlResponse = await fetch(uploadResult.file_url);
      const xmlText = await xmlResponse.text();
      const response = await base44.functions.invoke('parseNFeXML', { xmlContent: xmlText });
      if (response?.data) {
        const nfeData = response.data;
        setFormData(prev => ({
          ...prev,
          nfe_numero: nfeData.nfe_numero || '', nfe_numero_receb: nfeData.nfe_numero || '',
          nfe_serie: nfeData.nfe_serie || '', nfe_data_emissao: nfeData.nfe_data_emissao || '',
          nfe_data_receb: nfeData.nfe_data_emissao || '', nfe_chave_acesso: nfeData.nfe_chave_acesso || '',
          nfe_natureza_operacao: nfeData.nfe_natureza_operacao || '',
          nfe_dados_emissor: nfeData.nfe_dados_emissor || {},
          nfe_dados_destinatario: nfeData.nfe_dados_destinatario || {},
          nfe_dados_transportador: nfeData.nfe_dados_transportador || {},
          nfe_info_complementares: nfeData.nfe_info_complementares || '',
          nfe_itens_conferencia: nfeData.nfe_itens_conferencia || [],
          fluxo_recebimento: { ...prev.fluxo_recebimento, etapa_atual: 2, xml_importado: true }
        }));
        toast.success('XML importado com sucesso!');
      } else { toast.error('Erro ao processar XML'); }
    } catch (error) { toast.error('Erro ao importar XML: ' + (error.message || 'Erro desconhecido')); }
    finally { setImportingXML(false); }
  };

  const removeFile = (field, index) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleZMMTSEUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setZmmtsePDF(result.file_url);
    } catch (error) { console.error('Error uploading ZMMTSE PDF:', error); }
  };

  const importZMMTSEData = async () => {
    if (!zmmtsePDF) return;
    setImportingPDF(true);
    try {
      const jsonSchema = {
        type: "object",
        properties: {
          n_documento: { type: "string", description: "Número do documento MIGO (campo N.DOCUMENTO)" },
          data_documento: { type: "string", description: "Data do documento no formato DD.MM.YYYY" },
          tipo_movimento: { type: "string" },
          centro_estoque: { type: "string" },
          nome_local_entrega: { type: "string" },
          centro_custo: { type: "string" },
          processado_por_nome: { type: "string" },
          processado_por_matricula: { type: "string" },
          itens: {
            type: "array",
            items: {
              type: "object",
              properties: {
                material: { type: "string" },
                texto_breve: { type: "string" },
                qtd: { type: "number", description: "Quantidade (campo Qtd)" },
                un: { type: "string" },
                localizacao: { type: "string" },
                dep: { type: "string" },
                reserva: { type: "string" },
                saldo_em_estoque: { type: "number" },
                observacao: { type: "string" }
              }
            }
          }
        }
      };
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url: zmmtsePDF, json_schema: jsonSchema });
      if (result.status === "success" && result.output) {
        const data = result.output;
        // Converter data DD.MM.YYYY para YYYY-MM-DD
        const convertDate = (d) => {
          if (!d) return '';
          const parts = d.split('.');
          if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
          return d;
        };
        setFormData(prev => ({
          ...prev,
          num_migo: data.n_documento || '',
          data_migo: convertDate(data.data_documento),
          num_reserva: data.itens?.[0]?.reserva || '',
          atendente_nome: data.processado_por_nome ? `${data.processado_por_nome} (${data.processado_por_matricula || ''})`.trim() : '',
          descricao_resumida: data.itens?.[0]?.observacao || '',
          tipo_movimento: data.tipo_movimento || prev.tipo_movimento || '',
          local_entrega: data.nome_local_entrega || prev.local_entrega || '',
          anotacoes: `Centro de estoque: ${data.centro_estoque || ''}, Centro de custo: ${data.centro_custo || ''}`,
          itens_documento: data.itens?.map(item => ({
            codigo: item.material || '',
            descricao: item.texto_breve || '',
            quantidade: item.qtd || 0,
            unidade: item.un || 'UN',
            r_unit: 0,
            r_total: 0,
            deposito: item.dep || '',
            endereco: item.localizacao || '',
            saldo: item.saldo_em_estoque || 0,
            seguravel: false
          })) || []
        }));
        toast.success('PDF ZMMTSE importado com sucesso!');
      } else {
        toast.error('Erro ao processar PDF ZMMTSE');
      }
    } catch (error) {
      console.error('Error importing ZMMTSE data:', error);
      toast.error('Erro ao importar PDF: ' + (error.message || 'Erro desconhecido'));
    }
    finally { setImportingPDF(false); }
  };

  const currentPessoa = pessoas?.find(p => p.user_id === currentUser?.id);

  const handleGenerateOSPDF = async () => {
    setGeneratingOSPDF(true);
    setShowRelatorioOS(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      const element = document.getElementById('relatorio-os');
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 1.2, useCORS: true, backgroundColor: '#ffffff', windowWidth: element.scrollWidth, windowHeight: element.scrollHeight, allowTaint: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const scaledHeight = pdfWidth / (canvas.width / canvas.height);
      const totalPages = Math.ceil(scaledHeight / pdfHeight);
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -(pdfHeight * i), pdfWidth, scaledHeight, '', 'FAST');
      }
      pdf.save(`Dados_Gerais_${formData.codigo || os?.codigo || 'OS'}.pdf`);
    } catch (error) { console.error('Error generating OS PDF:', error); }
    finally { setGeneratingOSPDF(false); setShowRelatorioOS(false); }
  };

  const generatePDFFromElement = async (elementId, filename) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 1.2, useCORS: true, backgroundColor: '#ffffff', windowWidth: element.scrollWidth, windowHeight: element.scrollHeight, allowTaint: true });
    const imgData = canvas.toDataURL('image/jpeg', 0.75);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const scaledHeight = pdfWidth / (canvas.width / canvas.height);
    const totalPages = Math.ceil(scaledHeight / pdfHeight);
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -(pdfHeight * i), pdfWidth, scaledHeight, '', 'FAST');
    }
    pdf.save(filename);
  };

  const handleGenerateSeparacaoPDF = async () => {
    setGeneratingSeparacaoPDF(true);
    setShowRelatorioSeparacao(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await generatePDFFromElement('relatorio-separacao', `Lista_Separacao_${formData.codigo || os?.codigo || 'OS'}.pdf`);
    } catch (error) { console.error('Error generating Separação PDF:', error); }
    finally { setGeneratingSeparacaoPDF(false); setShowRelatorioSeparacao(false); }
  };

  const handleGenerateConferenciaPDF = async () => {
    setGeneratingConferenciaPDF(true);
    setShowRelatorioConferencia(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await generatePDFFromElement('relatorio-conferencia', `Lista_Conferencia_${formData.codigo || os?.codigo || 'OS'}.pdf`);
    } catch (error) { console.error('Error generating Conferência PDF:', error); }
    finally { setGeneratingConferenciaPDF(false); setShowRelatorioConferencia(false); }
  };

  // TimeSheet: subscrição em tempo real para refletir mudanças no header.
  // O play é manual via OSHeaderTimeSheetButton (com modal de seleção).
  useEffect(() => {
    if (!open || !os?.id) return;
    const unsub = base44.entities.OrdemServico.subscribe((event) => {
      if (event.id === os.id && event.data) {
        setFormData(prev => ({
          ...prev,
          timesheet_status: event.data.timesheet_status,
          timesheet_sessoes_ativas: event.data.timesheet_sessoes_ativas,
          timesheet_total_minutos: event.data.timesheet_total_minutos
        }));
      }
    });
    return () => unsub?.();
  }, [open, os?.id]);

  // Mapa de pendências por aba (para badges nos TabsTrigger)
  const pendenciasPorAba = React.useMemo(() => {
    if (!usaFluxoExpedicao && !usaFluxoRecebimento) return {};
    const state = getFluxoState(formData, { usaFluxoExpedicao, usaFluxoRecebimento, fluxoEstrito: usaFluxoExpedicaoEstrito });
    const map = {};
    (state?.pendencias || []).forEach(p => {
      if (p.tab) map[p.tab] = (map[p.tab] || 0) + 1;
    });
    return map;
  }, [formData, usaFluxoExpedicao, usaFluxoRecebimento, usaFluxoExpedicaoEstrito]);

  const PendBadge = ({ tab }) => {
    const n = pendenciasPorAba[tab];
    if (!n) return null;
    return (
      <span
        title={`${n} ${n === 1 ? 'pendência' : 'pendências'} nesta aba`}
        className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold bg-amber-500 text-white"
      >
        {n}
      </span>
    );
  };

  const problemasNaoPreenchidos = formData.problema_recebimento && (!formData.problemas_recebimento_ids || formData.problemas_recebimento_ids.length === 0);
  const hasVolumes = (formData.volumes?.length || 0) > 0;
  const separacaoIncompleta = usaFluxoExpedicao && hasVolumes && (!formData.responsavel_separacao || !formData.data_separacao || !formData.separacao_concluida_em);
  const destinoOk = formData.destino_externo
    ? !!formData.destino_externo_descricao
    : !!formData.instalacao_destino_id;
  const documentoIncompleto = usaFluxoExpedicao && (
    usaFluxoExpedicaoEstrito
      ? (
          !formData.num_reserva || !formData.data_reserva || !formData.usuario_reserva ||
          !formData.orgao || !formData.vinculacao || !formData.instalacao_origem_id || !destinoOk ||
          (formData.num_migo && !formData.data_migo)
        )
      : (!formData.instalacao_origem_id || !destinoOk)
  );
  const migoRecebIncompleto = usaFluxoRecebimento && formData.numero_migo_receb && !formData.data_migo_receb;
  const isValid = formData.categoria_id && formData.subcategorias_ids?.length > 0 && formData.regional_id && formData.almoxarifado_id && formData.lider_id && formData.prazo && formData.complexidade && !prazoError && !problemasNaoPreenchidos && !separacaoIncompleta && !documentoIncompleto && !migoRecebIncompleto;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCloseRequest(); }}>
      <DialogContent className={`${(usaFluxoExpedicao || usaFluxoRecebimento) ? 'max-w-[1300px]' : 'max-w-5xl'} w-[calc(100vw-1rem)] sm:w-full max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden`} aria-describedby={undefined}>
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-5 border-b shrink-0" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="text-base sm:text-xl font-semibold text-white truncate min-w-0 flex-1">
              {os?.id ? `${readOnly ? 'OS' : 'Editar OS'}: ${os.codigo}` : 'Nova Ordem de Serviço'}
            </DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              {os?.id && (
                <OSHeaderTimeSheetButton
                  os={{ ...os, ...{
                    timesheet_status: formData.timesheet_status ?? os.timesheet_status,
                    timesheet_sessoes_ativas: formData.timesheet_sessoes_ativas ?? os.timesheet_sessoes_ativas,
                    timesheet_total_minutos: formData.timesheet_total_minutos ?? os.timesheet_total_minutos,
                  } }}
                  currentPessoa={currentPessoa}
                  onStateChange={(updatedOS) => {
                    setFormData(prev => ({
                      ...prev,
                      timesheet_status: updatedOS.timesheet_status,
                      timesheet_sessoes_ativas: updatedOS.timesheet_sessoes_ativas,
                      timesheet_total_minutos: updatedOS.timesheet_total_minutos
                    }));
                    onSave?.(false, updatedOS);
                  }}
                />
              )}
              {readOnly && userCanEdit && (
                <OSHeaderIconButton
                  icon={Edit}
                  label="Editar"
                  onClick={() => setReadOnly(false)}
                  variant="solid"
                />
              )}
              {os?.id && (
                <OSHeaderIconButton
                  icon={Share2}
                  label="Copiar link"
                  onClick={handleShareOS}
                />
              )}
              <OSHeaderIconButton
                icon={Printer}
                label={generatingOSPDF ? 'Gerando...' : 'Imprimir OS'}
                onClick={handleGenerateOSPDF}
                disabled={generatingOSPDF}
              />
              {usaFluxoExpedicao && (
                <OSHeaderIconButton
                  icon={ListChecks}
                  label={generatingSeparacaoPDF ? 'Gerando...' : 'Lista de Separação'}
                  onClick={handleGenerateSeparacaoPDF}
                  disabled={generatingSeparacaoPDF}
                />
              )}
              {usaFluxoRecebimento && (
                <OSHeaderIconButton
                  icon={ClipboardCheck}
                  label={generatingConferenciaPDF ? 'Gerando...' : 'Lista de Conferência'}
                  onClick={handleGenerateConferenciaPDF}
                  disabled={generatingConferenciaPDF}
                />
              )}
              {os?.id && onCreateRelated && (
                <OSHeaderIconButton
                  icon={Copy}
                  label="Criar OS relacionada"
                  onClick={() => onCreateRelated(os)}
                />
              )}
              {os?.id && canDelete && onDelete && (
                <OSHeaderIconButton
                  icon={Trash2}
                  label="Excluir OS"
                  onClick={() => onDelete(os)}
                />
              )}
              <OSFormHelp activeTab={activeTab} />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-8 bg-slate-50/30 dark:bg-slate-900/30 flex gap-4 items-start">
            <Tabs value={activeTab} onValueChange={handleFormTabChange} className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-700 mb-5 sm:mb-8 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 shrink-0">
               <TabsList className="bg-transparent rounded-none h-auto p-0 space-x-2 sm:space-x-4 border-b-0 flex-nowrap shrink-0">
                <TabsTrigger value="geral" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Dados Gerais</TabsTrigger>
                {isAtendimentoCategory && (<TabsTrigger value="materiais" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Materiais ({formData.itens_documento?.length || 0})</TabsTrigger>)}
                {usaFluxoExpedicao && (<>
                  <TabsTrigger value="documento" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Documento<PendBadge tab="documento" /></TabsTrigger>
                  <TabsTrigger value="materiais" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Materiais<PendBadge tab="materiais" /></TabsTrigger>
                  <TabsTrigger value="volumes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Volumes<PendBadge tab="volumes" /></TabsTrigger>
                  <TabsTrigger value="expedicao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Expedição<PendBadge tab="expedicao" /></TabsTrigger>
                  {os?.id && <TabsTrigger value="assinaturas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">✍️ Assinaturas</TabsTrigger>}
                </>)}
                {usaFluxoRecebimento && (<>
                  <TabsTrigger value="receb-dados" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Dados Recebimento<PendBadge tab="receb-dados" /></TabsTrigger>
                  <TabsTrigger value="receb-documento" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Documento<PendBadge tab="receb-documento" /></TabsTrigger>
                  <TabsTrigger value="receb-doc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Cabeçalho NF<PendBadge tab="receb-doc" /></TabsTrigger>
                  <TabsTrigger value="receb-mat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Materiais<PendBadge tab="receb-mat" /></TabsTrigger>
                  <TabsTrigger value="receb-transp" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Transportador<PendBadge tab="receb-transp" /></TabsTrigger>
                </>)}
                <TabsTrigger value="anexos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3">Anexos<PendBadge tab="anexos" /></TabsTrigger>
                {os?.id && (<>
                  <TabsTrigger value="comentarios" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Comentários</TabsTrigger>
                  <TabsTrigger value="historico" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#84cc16] data-[state=active]:bg-transparent data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold px-0 pb-3 flex items-center gap-1.5"><History className="w-3.5 h-3.5" />Histórico</TabsTrigger>
                </>)}
              </TabsList>
              </div>

              <fieldset disabled={readOnly} className="disabled:opacity-100 border-0 p-0 m-0 min-w-0 flex-1 min-h-0 overflow-y-auto flex flex-col">
              {/* TAB: Dados Gerais */}
              <TabsContent value="geral" className="space-y-8">
                {/* Seção 1: Classificação */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                    Classificação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Categoria <span className="text-red-500">*</span></Label>
                      <Select value={formData.categoria_id} onValueChange={(v) => setFormData({ ...formData, categoria_id: v, subcategorias_ids: [] })}>
                        <SelectTrigger className={`rounded-lg ${!formData.categoria_id ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{(categorias || []).sort((a, b) => a.nome.localeCompare(b.nome)).map(c => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Subcategorias <span className="text-red-500">*</span></Label>
                      <Select value={formData.subcategorias_ids?.[0] || ''} onValueChange={(v) => setFormData({ ...formData, subcategorias_ids: [v] })}>
                        <SelectTrigger className={`rounded-lg ${!formData.subcategorias_ids?.length ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{(filteredSubcategorias || []).sort((a, b) => a.nome.localeCompare(b.nome)).map(s => (<SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Regional <span className="text-red-500">*</span></Label>
                      <Select value={formData.regional_id} onValueChange={(v) => setFormData({ ...formData, regional_id: v, almoxarifado_id: '' })}>
                        <SelectTrigger className={`rounded-lg ${!formData.regional_id ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{(regionais || []).map(r => (<SelectItem key={r.id} value={r.id}>{r.sigla} - {r.descricao}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Almoxarifado <span className="text-red-500">*</span></Label>
                      <Select value={formData.almoxarifado_id} onValueChange={(v) => { const selectedAlmox = (filteredAlmoxarifados || []).find(a => a.id === v); setFormData({ ...formData, almoxarifado_id: v, executores_ids: [], atendente_nome: '', instalacao_origem_id: selectedAlmox?.instalacao_id || '' }); }}>
                        <SelectTrigger className={`rounded-lg ${!formData.almoxarifado_id ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{(filteredAlmoxarifados || []).map(a => (<SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Projetos/Tags</Label>
                      <Select value={formData.projetos_ids?.[0] || ''} onValueChange={(v) => setFormData({ ...formData, projetos_ids: v ? [v] : [] })}>
                        <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg" onKeyDown={(e) => { if ((e.key === 'Delete' || e.key === 'Backspace') && formData.projetos_ids?.[0]) { e.preventDefault(); setFormData({ ...formData, projetos_ids: [] }); } }}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>{(projetos || []).filter(p => {
                          if (formData.regional_id && p.regional_id && p.regional_id !== formData.regional_id) return false;
                          if (formData.almoxarifado_id && p.almoxarifado_id && p.almoxarifado_id !== formData.almoxarifado_id) return false;
                          return true;
                        }).map(p => (<SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Rótulos</Label>
                      <RotuloSelector
                        selectedIds={formData.rotulos_ids || []}
                        onChange={(ids) => setFormData({ ...formData, rotulos_ids: ids })}
                        regionalId={formData.regional_id}
                        currentUserFuncoes={currentPessoa?.funcoes || []}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção 2: Atribuição e Responsáveis */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                    Atribuição e Responsáveis
                  </h3>

                  <div className="space-y-2 mb-6">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Equipe (Opcional)</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Selecione uma equipe para preencher automaticamente líder e executores</p>
                    <Select value="" onValueChange={(equipeId) => { const equipe = equipes.find(e => e.id === equipeId); if (equipe) setFormData(prev => ({ ...prev, lider_id: equipe.lider_id, executores_ids: equipe.membros_ids || [] })); }}>
                      <SelectTrigger className="border-slate-300 dark:border-slate-600 rounded-lg"><SelectValue placeholder="Selecione uma equipe..." /></SelectTrigger>
                      <SelectContent>{equipes.map(e => (<SelectItem key={e.id} value={e.id}>{e.nome} ({e.membros_ids?.length || 0} membros)</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Líder <span className="text-red-500">*</span></Label>
                      <Select value={formData.lider_id} onValueChange={(v) => { const executoresAtualizados = formData.executores_ids?.includes(v) ? formData.executores_ids : [...(formData.executores_ids || []), v]; setFormData({ ...formData, lider_id: v, executores_ids: executoresAtualizados }); }} disabled={!formData.is_global && !formData.almoxarifado_id}>
                        <SelectTrigger className={`rounded-lg ${!formData.lider_id ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`}><SelectValue placeholder={formData.is_global ? "Selecione..." : (formData.almoxarifado_id ? "Selecione..." : "Selecione almoxarifado primeiro")} /></SelectTrigger>
                        <SelectContent>{(pessoas || []).filter(p => p && p.funcoes?.includes('lider') && (formData.is_global || !formData.almoxarifado_id || p.almoxarifados_ids?.includes(formData.almoxarifado_id))).sort((a, b) => a.nome.localeCompare(b.nome)).map(p => (<SelectItem key={p.id} value={p.id}>{p.nome}{formData.is_global && p.almoxarifados_ids?.length > 0 ? '' : ''}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Atendente</Label>
                      <Input list="pessoas-list" value={formData.atendente_nome} onChange={(e) => setFormData({ ...formData, atendente_nome: e.target.value })} placeholder="Digite ou selecione..." className="border-slate-300 dark:border-slate-600 rounded-lg" />
                      <datalist id="pessoas-list">
                        {(formData.is_global ? (pessoas || []) : (formData.almoxarifado_id ? (pessoas || []).filter(p => p && p.almoxarifados_ids?.includes(formData.almoxarifado_id)) : (pessoas || []))).filter(p => p && p.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome)).map(p => (<option key={p.id} value={p.nome} />))}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">OS Global</Label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_global: !formData.is_global, lider_id: '', executores_ids: [], atendente_nome: '' })}
                        title="Permite selecionar pessoas de qualquer regional/almoxarifado"
                        className={`w-full h-10 flex items-center justify-between gap-2 px-3 rounded-lg border transition-colors ${formData.is_global ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}
                      >
                        <span className={`text-sm font-medium ${formData.is_global ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'}`}>🌐 {formData.is_global ? 'Ativado' : 'Desativado'}</span>
                        <span className={`relative w-10 h-5 rounded-full transition-colors ${formData.is_global ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.is_global ? 'translate-x-5' : 'translate-x-0'}`} />
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 col-span-full mt-5">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Executores</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Selecione os usuários que irão executar esta tarefa (ou use uma equipe acima)</p>
                    <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto bg-slate-50/50 dark:bg-slate-800/50">
                      {formData.is_global ? (
                      (pessoas || []).filter(p => p && p.ativo !== false).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')).map((pessoa) => (
                          <div key={pessoa.id} className="flex items-center gap-2">
                            <Checkbox id={`executor-${pessoa.id}`} checked={formData.executores_ids?.includes(pessoa.id)} onCheckedChange={(checked) => { setFormData({ ...formData, executores_ids: checked ? [...(formData.executores_ids || []), pessoa.id] : formData.executores_ids?.filter(id => id !== pessoa.id) || [] }); }} />
                            <Label htmlFor={`executor-${pessoa.id}`} className="cursor-pointer text-sm flex-1">
                              <span className="font-medium">{pessoa.nome}</span>
                              {pessoa.funcao && <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({pessoa.funcao})</span>}
                            </Label>
                          </div>
                        ))
                      ) : formData.almoxarifado_id ? (
                        (pessoas || []).filter(p => p && p.ativo !== false && p.almoxarifados_ids?.includes(formData.almoxarifado_id)).length > 0 ? (
                          (pessoas || []).filter(p => p && p.ativo !== false && p.almoxarifados_ids?.includes(formData.almoxarifado_id)).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')).map((pessoa) => (
                            <div key={pessoa.id} className="flex items-center gap-2">
                              <Checkbox id={`executor-${pessoa.id}`} checked={formData.executores_ids?.includes(pessoa.id)} onCheckedChange={(checked) => { setFormData({ ...formData, executores_ids: checked ? [...(formData.executores_ids || []), pessoa.id] : formData.executores_ids?.filter(id => id !== pessoa.id) || [] }); }} />
                              <Label htmlFor={`executor-${pessoa.id}`} className="cursor-pointer text-sm flex-1">
                                <span className="font-medium">{pessoa.nome}</span>
                                {pessoa.funcao && <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({pessoa.funcao})</span>}
                              </Label>
                            </div>
                          ))
                        ) : (<p className="text-sm text-slate-500">Nenhuma pessoa lotada neste almoxarifado</p>)
                      ) : (<p className="text-sm text-slate-500">Selecione um almoxarifado primeiro</p>)}
                    </div>
                  </div>
                </div>

                {/* Seção 3: Prazos e Controle */}
                <OSPrazosControle formData={formData} setFormData={setFormData} prazoError={prazoError} setPrazoError={setPrazoError} projetos={projetos} isExpedicaoCategory={usaFluxoExpedicao} isRecebimentoCategory={usaFluxoRecebimento} />

                {/* Seção 4: Detalhamento */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                    Detalhamento
                  </h3>
                  <div className="space-y-2 mb-5">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Descrição Resumida</Label>
                    <Textarea value={formData.descricao_resumida} onChange={(e) => setFormData({ ...formData, descricao_resumida: e.target.value })} placeholder="Descreva brevemente a OS..." rows={3} className="border-slate-300 dark:border-slate-600 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Anotações</Label>
                    <Textarea value={formData.anotacoes} onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })} placeholder="Notas adicionais..." rows={3} className="border-slate-300 dark:border-slate-600 rounded-lg" />
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Documento (Expedição) */}
              {usaFluxoExpedicao && (
                <TabsContent value="documento" className="space-y-8">
                  {/* Seção 1: Dados da Solicitação */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                      Dados da Solicitação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Número do Documento {usaFluxoExpedicaoEstrito && <span className="text-red-500">*</span>}</Label>
                        <Input value={formData.num_reserva} onChange={(e) => setFormData({ ...formData, num_reserva: e.target.value })} className={`rounded-lg ${usaFluxoExpedicaoEstrito && !formData.num_reserva ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`} />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ex: número de reserva, pedido, alienação, etc.</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Data Criação {usaFluxoExpedicaoEstrito && <span className="text-red-500">*</span>}</Label>
                        <Input type="date" value={formData.data_reserva} onChange={(e) => {
                          const newDate = e.target.value;
                          const updates = { data_reserva: newDate };
                          if (newDate && !formData.data_necessidade) {
                            const d = new Date(newDate + 'T12:00:00');
                            let count = 0;
                            while (count < 7) {
                              d.setDate(d.getDate() + 1);
                              const day = d.getDay();
                              if (day !== 0 && day !== 6) count++;
                            }
                            updates.data_necessidade = d.toISOString().split('T')[0];
                          }
                          setFormData({ ...formData, ...updates });
                        }} className={`rounded-lg ${usaFluxoExpedicaoEstrito && !formData.data_reserva ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Vinculação {usaFluxoExpedicaoEstrito && <span className="text-red-500">*</span>}</Label>
                        <Select value={formData.vinculacao} onValueChange={(v) => setFormData({ ...formData, vinculacao: v })}>
                          <SelectTrigger className={`rounded-lg ${usaFluxoExpedicaoEstrito && !formData.vinculacao ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent><SelectItem value="custeio">Custeio</SelectItem><SelectItem value="investimento">Investimento</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Seção 2: Dados do Usuário */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                      Dados do Usuário
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Nome Usuário {usaFluxoExpedicaoEstrito && <span className="text-red-500">*</span>}</Label>
                        <Input value={formData.usuario_reserva} onChange={(e) => setFormData({ ...formData, usuario_reserva: e.target.value })} className={`rounded-lg ${usaFluxoExpedicaoEstrito && !formData.usuario_reserva ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Email Usuário</Label>
                        <Input type="email" value={formData.usuario_reserva_email} onChange={(e) => setFormData({ ...formData, usuario_reserva_email: e.target.value })} className="rounded-lg border-slate-300 dark:border-slate-600" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Área do Usuário {usaFluxoExpedicaoEstrito && <span className="text-red-500">*</span>}</Label>
                        <Input value={formData.orgao} onChange={(e) => setFormData({ ...formData, orgao: e.target.value })} className={`rounded-lg ${usaFluxoExpedicaoEstrito && !formData.orgao ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Seção 3: Dados de Baixa do Estoque */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                      Dados de Baixa do Estoque
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Número MIGO</Label>
                        <Input value={formData.num_migo} onChange={(e) => setFormData({ ...formData, num_migo: e.target.value })} className="rounded-lg border-slate-300 dark:border-slate-600" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Data MIGO {formData.num_migo && <span className="text-red-500">*</span>}</Label>
                        <Input type="date" value={formData.data_migo} onChange={(e) => setFormData({ ...formData, data_migo: e.target.value })} className={`rounded-lg ${(formData.num_migo && !formData.data_migo) ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Tipo Movimento</Label>
                        <Input value={formData.tipo_movimento || ''} onChange={(e) => setFormData({ ...formData, tipo_movimento: e.target.value })} placeholder="Manual ou via ZMMTSE" className="rounded-lg border-slate-300 dark:border-slate-600" />
                      </div>
                    </div>
                  </div>

                  {/* Seção 4: Origem e Destino */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                      Origem e Destino
                    </h3>
                    {/* Toggle: Destino é fora da Axia? */}
                    <div className="mb-5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, destino_externo: !formData.destino_externo, instalacao_destino_id: !formData.destino_externo ? '' : formData.instalacao_destino_id, destino_externo_descricao: formData.destino_externo ? '' : formData.destino_externo_descricao })}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border transition-colors w-full sm:w-auto ${formData.destino_externo ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}
                      >
                        <span className={`text-sm font-medium ${formData.destino_externo ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-400'}`}>📦 Destino é fora da Axia?</span>
                        <span className={`relative w-10 h-5 rounded-full transition-colors ${formData.destino_externo ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.destino_externo ? 'translate-x-5' : 'translate-x-0'}`} />
                        </span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Instalação Origem <span className="text-red-500">*</span></Label>
                        <Popover open={openOrigemCombo} onOpenChange={setOpenOrigemCombo}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className={`w-full justify-between rounded-lg ${!formData.instalacao_origem_id ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`}>
                              <span className="truncate">{formData.instalacao_origem_id ? (filteredInstalacoes || []).find(i => i.id === formData.instalacao_origem_id)?.nome : "Selecione..."}</span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar instalação..." />
                              <CommandList>
                                <CommandEmpty>Nenhuma instalação encontrada.</CommandEmpty>
                                <CommandGroup>
                                  {(filteredInstalacoes || []).map((i) => (<CommandItem key={i.id} value={i.nome} onSelect={() => { setFormData({ ...formData, instalacao_origem_id: i.id }); setOpenOrigemCombo(false); }}><Check className={cn("mr-2 h-4 w-4", formData.instalacao_origem_id === i.id ? "opacity-100" : "opacity-0")} />{i.nome}</CommandItem>))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      {!formData.destino_externo ? (
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-medium">Instalação Destino <span className="text-red-500">*</span></Label>
                          <Popover open={openDestinoCombo} onOpenChange={setOpenDestinoCombo}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className={`w-full justify-between rounded-lg ${!formData.instalacao_destino_id ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`}>
                                <span className="truncate">{formData.instalacao_destino_id ? (instalacoes || []).find(i => i.id === formData.instalacao_destino_id)?.nome : "Selecione..."}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="Buscar instalação..." />
                                <CommandList>
                                  <CommandEmpty>Nenhuma instalação encontrada.</CommandEmpty>
                                  <CommandGroup>
                                    {(filteredInstalacoesDestino || []).map((i) => (<CommandItem key={i.id} value={i.nome} onSelect={() => { setFormData({ ...formData, instalacao_destino_id: i.id }); setOpenDestinoCombo(false); }}><Check className={cn("mr-2 h-4 w-4", formData.instalacao_destino_id === i.id ? "opacity-100" : "opacity-0")} />{i.nome}</CommandItem>))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : (
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-medium">Dados do Destinatário (fora da Axia) <span className="text-red-500">*</span></Label>
                          <Textarea
                            value={formData.destino_externo_descricao || ''}
                            onChange={(e) => setFormData({ ...formData, destino_externo_descricao: e.target.value })}
                            placeholder="Razão social, CNPJ, endereço completo, contato..."
                            rows={4}
                            className={`rounded-lg ${!formData.destino_externo_descricao ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'}`}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Local Entrega</Label>
                        <Input value={formData.local_entrega || ''} onChange={(e) => setFormData({ ...formData, local_entrega: e.target.value })} placeholder="Manual ou via ZMMTSE" className="rounded-lg border-slate-300 dark:border-slate-600" />
                      </div>
                    </div>
                  </div>

                  {/* Seção 5: Datas Complementares */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-[#22c55e] to-[#84cc16] rounded-full"></div>
                      Datas Complementares
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Data Ressuprimento</Label>
                        <Input type="date" value={formData.data_ressuprimento || ''} onChange={(e) => setFormData({ ...formData, data_ressuprimento: e.target.value })} className="rounded-lg border-slate-300 dark:border-slate-600" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Data Aprovação EPI</Label>
                        <Input type="date" value={formData.data_aprovacao_epi || ''} onChange={(e) => setFormData({ ...formData, data_aprovacao_epi: e.target.value })} className="rounded-lg border-slate-300 dark:border-slate-600" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Observações Adicionais</Label>
                        <Input value={formData.observacoes_adicionais || ''} onChange={(e) => setFormData({ ...formData, observacoes_adicionais: e.target.value })} placeholder="Notas opcionais..." className="rounded-lg border-slate-300 dark:border-slate-600" />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {usaFluxoExpedicao && (<TabsContent value="materiais">{loadedFormTabs.has('materiais') && <OSItensDocumento itens={formData.itens_documento} onChange={(itens) => setFormData(prev => ({ ...prev, itens_documento: itens }))} />}</TabsContent>)}
              {isAtendimentoCategory && (<TabsContent value="materiais">{loadedFormTabs.has('materiais') && <OSAtendimentoMateriais itens={formData.itens_documento} onChange={(itens) => setFormData(prev => ({ ...prev, itens_documento: itens }))} />}</TabsContent>)}
              {usaFluxoExpedicao && (
                <TabsContent value="volumes" className="space-y-6">
                  <OSVolumes volumes={formData.volumes} onChange={(volumes) => setFormData(prev => ({ ...prev, volumes }))} onGerarEtiquetas={() => setShowEtiquetaModal(true)} />
                  {/* Seção Separação */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-1">Separação</h4>
                    {hasVolumes && <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">* Campos obrigatórios pois há volumes adicionados</p>}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Responsável {hasVolumes && <span className="text-red-500">*</span>}</Label>
                        <Input value={formData.responsavel_separacao} onChange={(e) => setFormData({ ...formData, responsavel_separacao: e.target.value })} className={hasVolumes && !formData.responsavel_separacao ? 'border-red-300 dark:border-red-700' : ''} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Início Separação {hasVolumes && <span className="text-red-500">*</span>}</Label>
                        <Input type="date" value={formData.data_separacao} onChange={(e) => setFormData({ ...formData, data_separacao: e.target.value })} className={hasVolumes && !formData.data_separacao ? 'border-red-300 dark:border-red-700' : ''} />
                      </div>
                      <div className="space-y-2">
                        <Label>Separação Concluída Em {hasVolumes && <span className="text-red-500">*</span>}</Label>
                        <Input type="date" value={formData.separacao_concluida_em || ''} onChange={(e) => setFormData({ ...formData, separacao_concluida_em: e.target.value })} className={hasVolumes && !formData.separacao_concluida_em ? 'border-red-300 dark:border-red-700' : ''} />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração Separação</Label>
                        <div className="h-9 flex items-center px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300">
                          {(() => {
                            if (!formData.data_separacao || !formData.separacao_concluida_em) return <span className="text-slate-400">—</span>;
                            const d1 = new Date(formData.data_separacao);
                            const d2 = new Date(formData.separacao_concluida_em);
                            const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                            return <span className={diff < 0 ? 'text-red-500' : ''}>{diff} {Math.abs(diff) === 1 ? 'dia' : 'dias'}</span>;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {usaFluxoExpedicao && (
                <TabsContent value="expedicao" className="space-y-6">
                  <OSDetalhamentoExpedicao detalhamento={formData.detalhamento_expedicao} onChange={(d) => setFormData(prev => ({ ...prev, detalhamento_expedicao: d }))} os={os} />
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4">Acompanhamento de Entrega</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Status Atendimento</Label>
                        <Select value={formData.status_separacao} onValueChange={(v) => setFormData({ ...formData, status_separacao: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="em_separacao">Em separação</SelectItem><SelectItem value="separado">Separado</SelectItem><SelectItem value="embalando">Embalando</SelectItem><SelectItem value="aguardando_transporte">Aguardando Transporte</SelectItem><SelectItem value="em_rota">Em rota</SelectItem><SelectItem value="entregue">Entregue</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Data Necessidade</Label>
                        <Input type="date" value={formData.data_necessidade} onChange={(e) => setFormData({ ...formData, data_necessidade: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Entrega</Label>
                        <Input
                          type="date"
                          value={formData.data_entrega}
                          disabled={!formData.data_necessidade}
                          title={!formData.data_necessidade ? 'Preencha a Data Necessidade primeiro' : ''}
                          onChange={(e) => {
                            const newData = { ...formData, data_entrega: e.target.value };
                            if (e.target.value) newData.status_separacao = 'entregue';
                            setFormData(newData);
                          }}
                        />
                        {!formData.data_necessidade && <p className="text-xs text-amber-600">Preencha a Data Necessidade primeiro</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Tempo Entrega</Label>
                        <div className="h-9 flex items-center px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300">
                          {(() => {
                            if (!formData.data_entrega || !formData.data_necessidade) return <span className="text-slate-400">—</span>;
                            const d1 = new Date(formData.data_necessidade);
                            const d2 = new Date(formData.data_entrega);
                            const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                            if (diff === 0) return <span>0 dias</span>;
                            return <span>{diff > 0 ? `+${diff}` : diff} dias</span>;
                          })()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Pontualidade</Label>
                        <div className="h-9 flex items-center px-3 rounded-md text-sm font-medium border">
                          {(() => {
                            if (!formData.data_entrega && !formData.data_necessidade) {
                              return <span className="text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 w-full text-center py-0.5 px-2 rounded">Pendente</span>;
                            }
                            if (formData.data_entrega && formData.data_necessidade) {
                              const necessidade = new Date(formData.data_necessidade);
                              const entrega = new Date(formData.data_entrega);
                              if (entrega > necessidade) {
                                return <span className="text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 w-full text-center py-0.5 px-2 rounded">Entregue fora do prazo</span>;
                              }
                              return <span className="text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 w-full text-center py-0.5 px-2 rounded">Entregue no prazo</span>;
                            }
                            return <span className="text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 w-full text-center py-0.5 px-2 rounded">Pendente</span>;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {usaFluxoRecebimento && (
                <TabsContent value="receb-dados" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Data Recebimento</Label><Input type="date" value={formData.data_recebimento} onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Responsável Recebimento</Label><Input type="text" value={formData.responsavel_recebimento || ''} onChange={(e) => setFormData({ ...formData, responsavel_recebimento: e.target.value })} placeholder="Digite o nome do responsável..." /></div>
                    <div className="space-y-2">
                      <Label>Houve um problema? <span className="text-red-500">*</span></Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="problema_recebimento" checked={formData.problema_recebimento === false} onChange={() => setFormData({ ...formData, problema_recebimento: false, problemas_recebimento_ids: [] })} className="w-4 h-4" /><span className="text-sm">Não</span></label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="problema_recebimento" checked={formData.problema_recebimento === true} onChange={() => setFormData({ ...formData, problema_recebimento: true })} className="w-4 h-4" /><span className="text-sm">Sim</span></label>
                      </div>
                    </div>
                  </div>
                  {formData.problema_recebimento && (
                    <div className="border-t pt-6 mt-6">
                      <div className="space-y-3">
                        <Label className="text-sm text-slate-600 dark:text-slate-400">Selecione o(s) problema(s) identificado(s): <span className="text-red-600 font-semibold">*</span></Label>
                        <div className={`space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4 ${problemasNaoPreenchidos ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700' : 'bg-slate-50 dark:bg-slate-800'}`}>
                          {problemasRecebimento.map((problema) => (
                            <div key={problema.id} className="flex items-start gap-2">
                              <Checkbox id={`problema-${problema.id}`} checked={formData.problemas_recebimento_ids?.includes(problema.id)} onCheckedChange={(checked) => { setFormData({ ...formData, problemas_recebimento_ids: checked ? [...(formData.problemas_recebimento_ids || []), problema.id] : formData.problemas_recebimento_ids?.filter(id => id !== problema.id) || [] }); }} />
                              <Label htmlFor={`problema-${problema.id}`} className="cursor-pointer text-sm flex-1">
                                <span className="font-medium">{problema.descricao_resumida}</span>
                                {problema.explicacao && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{problema.explicacao}</p>}
                              </Label>
                            </div>
                          ))}
                          {problemasRecebimento.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Nenhum problema cadastrado</p>}
                        </div>
                        {problemasNaoPreenchidos && <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2"><span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full"></span>É obrigatório selecionar pelo menos um problema quando "Houve um problema?" é marcado como Sim</p>}
                      </div>
                      <div className="mt-6 space-y-4">
                        <div className="space-y-2"><Label>Resumo das Pendências</Label><Textarea value={formData.resumo_pendencias} onChange={(e) => setFormData({ ...formData, resumo_pendencias: e.target.value })} placeholder="Descreva as pendências identificadas..." rows={4} /></div>
                        <div className="space-y-2"><Label>Ações de Acompanhamento</Label><Textarea value={formData.acoes_acompanhamento} onChange={(e) => setFormData({ ...formData, acoes_acompanhamento: e.target.value })} placeholder="Descreva as ações de acompanhamento necessárias..." rows={4} /></div>
                        <div className="space-y-2"><Label>Como foi solucionado</Label><Textarea value={formData.como_foi_solucionado} onChange={(e) => setFormData({ ...formData, como_foi_solucionado: e.target.value })} placeholder="Descreva como o problema foi solucionado..." rows={4} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Data Solução</Label><Input type="date" value={formData.data_solucao} onChange={(e) => setFormData({ ...formData, data_solucao: e.target.value })} /></div>
                          <div className="space-y-2">
                            <Label>Anexos do Problema</Label>
                            <div className="flex gap-2"><Input type="file" multiple className="cursor-pointer" id="problemas-anexos-upload" onChange={(e) => handleFileUpload(e, 'problemas_anexos')} /></div>
                            {formData.problemas_anexos?.length > 0 && <div className="space-y-1 mt-2">{(formData.problemas_anexos || []).map((url, i) => (<div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs"><a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">Anexo {i + 1}</a><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile('problemas_anexos', i)}><X className="w-3 h-3" /></Button></div>))}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}

              {usaFluxoRecebimento && (<TabsContent value="receb-doc" className="space-y-6">{loadedFormTabs.has('receb-doc') && <OSRecebimentoDocumento emissor={formData.nfe_dados_emissor} destinatario={formData.nfe_dados_destinatario} onChange={(data) => setFormData(prev => ({ ...prev, nfe_dados_emissor: data.emissor || prev.nfe_dados_emissor, nfe_dados_destinatario: data.destinatario || prev.nfe_dados_destinatario }))} />}</TabsContent>)}

              {usaFluxoRecebimento && (
                <TabsContent value="receb-documento" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Número da NF</Label><Input value={formData.nfe_numero_receb} onChange={(e) => setFormData({ ...formData, nfe_numero_receb: e.target.value })} placeholder="Preenchido automaticamente pelo XML ou digite manualmente" /></div>
                    <div className="space-y-2"><Label>Data da NF</Label><Input type="date" value={formData.nfe_data_receb} onChange={(e) => setFormData({ ...formData, nfe_data_receb: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Número MIGO</Label><Input type="text" inputMode="numeric" value={formData.numero_migo_receb} onChange={(e) => setFormData({ ...formData, numero_migo_receb: e.target.value.replace(/\D/g, '') })} placeholder="Somente números" /></div>
                    <div className="space-y-2">
                      <Label>Data MIGO {formData.numero_migo_receb && <span className="text-red-500">*</span>}</Label>
                      <Input type="date" value={formData.data_migo_receb} onChange={(e) => setFormData({ ...formData, data_migo_receb: e.target.value })} className={formData.numero_migo_receb && !formData.data_migo_receb ? 'border-red-500' : ''} />
                      {formData.numero_migo_receb && !formData.data_migo_receb && <p className="text-xs text-red-500">Obrigatório quando Número MIGO é preenchido</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Número ID V360</Label>
                      <div className="flex gap-2">
                        <Input type="number" value={formData.numero_v360} onChange={(e) => setFormData({ ...formData, numero_v360: e.target.value })} placeholder="Somente número" className="flex-1" />
                        {formData.numero_v360 && (<Button type="button" variant="outline" size="icon" onClick={() => window.open(`https://axia.virtual360.io/nf/tax_documents/${formData.numero_v360}`, '_blank')} title="Abrir no V360" className="px-3"><ExternalLink className="w-4 h-4" /></Button>)}
                      </div>
                    </div>
                    <div className="space-y-2"><Label>Doc Referência</Label><Input type="text" value={formData.doc_referencia} onChange={(e) => setFormData({ ...formData, doc_referencia: e.target.value })} placeholder="Texto livre" /></div>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Label>Informações Complementares</Label>
                    <Textarea
                      value={formData.nfe_info_complementares}
                      onChange={(e) => setFormData({ ...formData, nfe_info_complementares: e.target.value })}
                      placeholder="Informações complementares da nota fiscal..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              )}

              {usaFluxoRecebimento && (<TabsContent value="receb-transp" className="space-y-6">{loadedFormTabs.has('receb-transp') && <OSRecebimentoTransportador transportador={formData.nfe_dados_transportador} onChange={(data) => setFormData(prev => ({ ...prev, nfe_dados_transportador: data }))} />}</TabsContent>)}
              {usaFluxoRecebimento && (<TabsContent value="receb-mat" className="space-y-6">{loadedFormTabs.has('receb-mat') && <OSRecebimentoMateriais itens={formData.nfe_itens_conferencia} fluxo={formData.fluxo_recebimento} onChange={(data) => setFormData(prev => ({ ...prev, nfe_itens_conferencia: data.itens || prev.nfe_itens_conferencia, fluxo_recebimento: data.fluxo || prev.fluxo_recebimento }))} />}</TabsContent>)}

              {usaFluxoExpedicao && os?.id && (
                <TabsContent value="assinaturas" className="space-y-4">
                  <OSAssinaturaTab os={os} onSave={onSave} />
                </TabsContent>
              )}

              {/* TAB: Anexos */}
              <TabsContent value="anexos" className="space-y-6">
                {usaFluxoRecebimento && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">NFe XML</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">Faça upload do XML para importar dados automaticamente</p>
                    <Input type="file" accept=".xml" onChange={handleNFeXMLUpload} className="cursor-pointer" disabled={importingXML} />
                    {importingXML && <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300"><Loader2 className="w-4 h-4 animate-spin" />Processando XML...</div>}
                  </div>
                )}
                {usaFluxoExpedicao && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Documento ZMMTSE</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">Faça upload do PDF para importar dados automaticamente</p>
                    <div className="flex gap-3">
                      <Input type="file" accept=".pdf" onChange={handleZMMTSEUpload} className="cursor-pointer flex-1" />
                      <Button onClick={importZMMTSEData} disabled={!zmmtsePDF || importingPDF} className="bg-blue-600 hover:bg-blue-700">{importingPDF ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</> : <>Importar Dados</>}</Button>
                    </div>
                    {zmmtsePDF && <div className="mt-2 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300"><Paperclip className="w-4 h-4" /><a href={zmmtsePDF} target="_blank" rel="noopener noreferrer" className="hover:underline">Ver PDF carregado</a></div>}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>Anexos</Label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 mb-2">Arraste arquivos ou clique para enviar</p>
                      <Input type="file" multiple className="hidden" id="anexos-upload" onChange={(e) => handleFileUpload(e, 'anexos')} />
                      <Button variant="outline" size="sm" asChild><label htmlFor="anexos-upload" className="cursor-pointer">Selecionar Arquivos</label></Button>
                    </div>
                    {formData.anexos?.length > 0 && <div className="space-y-2">{(formData.anexos || []).map((url, i) => (<div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"><a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">Anexo {i + 1}</a><Button variant="ghost" size="icon" onClick={() => removeFile('anexos', i)}><X className="w-4 h-4" /></Button></div>))}</div>}
                  </div>
                  <div className="space-y-4">
                    <Label>Imagens</Label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 mb-2">Arraste imagens ou clique para enviar</p>
                      <Input type="file" multiple accept="image/*" className="hidden" id="imagens-upload" onChange={(e) => handleFileUpload(e, 'imagens')} />
                      <Button variant="outline" size="sm" asChild><label htmlFor="imagens-upload" className="cursor-pointer">Selecionar Imagens</label></Button>
                    </div>
                    {formData.imagens?.length > 0 && <div className="grid grid-cols-3 gap-2">{(formData.imagens || []).map((url, i) => (<div key={i} className="relative group"><img src={url} alt={`Imagem ${i + 1}`} loading="lazy" className="w-full aspect-square object-cover rounded-lg" /><Button variant="destructive" size="icon" className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFile('imagens', i)}><X className="w-3 h-3" /></Button></div>))}</div>}
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Comentários (somente OS existente) */}
              {os?.id && (
                <TabsContent value="comentarios" className="">
                  <OSComentariosTab
                    os={os}
                    pessoas={pessoas}
                    currentUser={currentUser}
                    currentUserPessoa={currentPessoa}
                    isActive={activeTab === 'comentarios'}
                  />
                </TabsContent>
              )}

              {/* TAB: Histórico (somente OS existente) */}
              {os?.id && (
                <OSHistoricoTab
                  loaded={loadedFormTabs.has('historico')}
                  auditLogs={auditLogs}
                  auditPage={auditPage}
                  setAuditPage={setAuditPage}
                  pageSize={PAGE_SIZE}
                  pessoas={pessoas}
                />
              )}
              </fieldset>
            </Tabs>

            {(usaFluxoExpedicao || usaFluxoRecebimento) && (
              <div className="hidden lg:flex flex-col w-72 shrink-0 sticky top-3 max-h-[calc(95vh-9rem)] overflow-y-auto pr-1">
                <OSGuiaFluxoPainel
                  formData={formData}
                  usaFluxoExpedicao={usaFluxoExpedicao}
                  usaFluxoRecebimento={usaFluxoRecebimento}
                  fluxoEstrito={usaFluxoExpedicaoEstrito}
                  onNavigateTab={handleFormTabChange}
                />
                <OSIndicadoresPainel
                  formData={formData}
                  activeTab={activeTab}
                  usaFluxoExpedicao={usaFluxoExpedicao}
                  usaFluxoRecebimento={usaFluxoRecebimento}
                  subcategoriasAll={subcategorias}
                />
              </div>
            )}
          </div>
        </div>

        {showEtiquetaModal && (
          <EtiquetaVolumesModal
            open={showEtiquetaModal}
            onClose={() => setShowEtiquetaModal(false)}
            os={{ ...formData, codigo: os?.codigo || formData.codigo }}
            instalacoes={instalacoes}
            almoxarifados={almoxarifados}
          />
        )}

        {showRelatorioOS && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <RelatorioOS
              os={{ ...formData, codigo: os?.codigo || formData.codigo }}
              regional={(regionais || []).find(r => r.id === formData.regional_id)}
              almoxarifado={(almoxarifados || []).find(a => a.id === formData.almoxarifado_id)}
              lider={(pessoas || []).find(p => p.id === formData.lider_id)}
              categoria={(categorias || []).find(c => c.id === formData.categoria_id)}
              subcategorias={subcategorias}
              executores={pessoas}
              projetos={projetos}
              instalacoes={instalacoes}
              rotulos={[]}
              currentUser={currentUser}
            />
          </div>
        )}

        {showRelatorioSeparacao && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <RelatorioSeparacao
              os={{ ...formData, codigo: os?.codigo || formData.codigo }}
              regional={(regionais || []).find(r => r.id === formData.regional_id)}
              almoxarifado={(almoxarifados || []).find(a => a.id === formData.almoxarifado_id)}
              lider={(pessoas || []).find(p => p.id === formData.lider_id)}
              categoria={(categorias || []).find(c => c.id === formData.categoria_id)}
              subcategorias={subcategorias}
              currentUser={currentUser}
            />
          </div>
        )}

        {showRelatorioConferencia && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <RelatorioConferencia
              os={{ ...formData, codigo: os?.codigo || formData.codigo }}
              regional={(regionais || []).find(r => r.id === formData.regional_id)}
              almoxarifado={(almoxarifados || []).find(a => a.id === formData.almoxarifado_id)}
              lider={(pessoas || []).find(p => p.id === formData.lider_id)}
              categoria={(categorias || []).find(c => c.id === formData.categoria_id)}
              currentUser={currentUser}
            />
          </div>
        )}

        <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shrink-0">
          <div className="px-4 sm:px-8 py-3 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
            {!readOnly && <p className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 font-medium flex-shrink-0">* Campos obrigatórios</p>}
            {readOnly && <div className="flex-shrink-0" />}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <Button variant="outline" onClick={handleCloseRequest} className="rounded-lg px-4 sm:px-6 py-2 font-medium border-slate-300 dark:border-slate-600 w-full sm:w-auto">{readOnly ? 'Fechar' : 'Cancelar'}</Button>
              {!readOnly && os?.id && (
                <Button onClick={() => handleSubmit(false)} disabled={!isValid || loading} variant="outline" className="rounded-lg px-4 sm:px-6 py-2 font-medium border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 w-full sm:w-auto">
                  {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>) : (<><Save className="w-4 h-4 mr-2" />Salvar</>)}
                </Button>
              )}
              {!readOnly && (
                <Button onClick={() => handleSubmit(true)} disabled={!isValid || loading} className="rounded-lg px-4 sm:px-6 py-2 font-medium shadow-lg w-full sm:w-auto" style={{ background: (!isValid || loading) ? '#cbd5e1' : 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white' }}>
                  {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>) : (<><Save className="w-4 h-4 mr-2" />{os?.id ? 'Salvar e Fechar' : 'Salvar OS'}</>)}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Confirmação de descarte de alterações */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Se sair agora, elas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDiscardConfirm(false); setIsDirty(false); onClose(); }} className="bg-red-600 hover:bg-red-700">
              Descartar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}