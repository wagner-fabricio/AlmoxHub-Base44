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
import { Save, Plus, Trash2, Upload, X, Loader2, Paperclip, Check, ChevronsUpDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import OSItensDocumento from './OSItensDocumento';
import OSVolumes from './OSVolumes';
import OSDetalhamentoExpedicao from './OSDetalhamentoExpedicao';
import OSRecebimentoDocumento from './OSRecebimentoDocumento.jsx';
import OSRecebimentoTransportador from './OSRecebimentoTransportador.jsx';
import OSRecebimentoMateriais from './OSRecebimentoMateriais.jsx';
import OSFluxoRecebimento from './OSFluxoRecebimento.jsx';

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
  const [importingPDF, setImportingPDF] = useState(false);
  const [zmmtsePDF, setZmmtsePDF] = useState(null);
  const [openOrigemCombo, setOpenOrigemCombo] = useState(false);
  const [openDestinoCombo, setOpenDestinoCombo] = useState(false);
  const [prazoError, setPrazoError] = useState('');
  const [importingXML, setImportingXML] = useState(false);
  const [problemasRecebimento, setProblemasRecebimento] = useState([]);
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
    usuario_reserva_email: '',
    orgao: '',
    data_migo: '',
    num_migo: '',
    vinculacao: '',
    instalacao_origem_id: '',
    instalacao_destino_id: '',
    itens_documento: [],
    volumes: [],
    detalhamento_expedicao: [],
    status_separacao: 'pendente',
    responsavel_separacao: '',
    data_separacao: '',
    data_entrega: '',
    anexos: [],
    imagens: [],
    nfe_numero: '',
    nfe_serie: '',
    nfe_data_emissao: '',
    nfe_chave_acesso: '',
    nfe_natureza_operacao: '',
    nfe_dados_emissor: {},
    nfe_dados_destinatario: {},
    nfe_dados_transportador: {},
    nfe_info_complementares: '',
    nfe_itens_conferencia: [],
    nfe_numero_receb: '',
    nfe_data_receb: '',
    numero_migo_receb: '',
    data_migo_receb: '',
    numero_v360: '',
    doc_referencia: '',
    data_recebimento: '',
    problema_recebimento: false,
    problemas_recebimento_ids: [],
    resumo_pendencias: '',
    acoes_acompanhamento: '',
    como_foi_solucionado: '',
    data_solucao: '',
    problemas_anexos: [],
    fluxo_recebimento: {
      etapa_atual: 1,
      xml_importado: false,
      conferencia_manual_completa: false,
      validacao_divergencias_completa: false,
      armazenagem_completa: false
    },
    fluxo_expedicao: {
      etapa_atual: 1,
      solicitacao_completa: true,
      solicitacao_data: new Date().toISOString(),
      separacao_completa: false,
      preparacao_completa: false,
      envio_completo: false,
      entrega_completa: false
    }
  });

  useEffect(() => {
    // Carregar problemas de recebimento
    const loadProblemas = async () => {
      try {
        const problemas = await base44.entities.ProblemaRecebimento.list('-descricao_resumida');
        setProblemasRecebimento(problemas);
      } catch (error) {
        console.error('Erro ao carregar problemas:', error);
      }
    };
    loadProblemas();

    if (os && os.id) {
      // Spread os data first, then override dates
      const newFormData = {
        categoria_id: os.categoria_id || '',
        subcategorias_ids: os.subcategorias_ids || [],
        regional_id: os.regional_id || '',
        almoxarifado_id: os.almoxarifado_id || '',
        lider_id: os.lider_id || '',
        atendente_nome: os.atendente_nome || '',
        executores_ids: os.executores_ids || [],
        outros_envolvidos_ids: os.outros_envolvidos_ids || [],
        prazo: os.prazo ? os.prazo.split('T')[0] : '',
        data_inicial: os.data_inicial ? os.data_inicial.split('T')[0] : '',
        prioridade: os.prioridade || 'media',
        status: os.status || 'elaboracao',
        anotacoes: os.anotacoes || '',
        projetos_ids: os.projetos_ids || [],
        descricao_resumida: os.descricao_resumida || '',
        num_reserva: os.num_reserva || '',
        data_reserva: os.data_reserva ? os.data_reserva.split('T')[0] : '',
        usuario_reserva: os.usuario_reserva || '',
        usuario_reserva_email: os.usuario_reserva_email || '',
        orgao: os.orgao || '',
        data_migo: os.data_migo ? os.data_migo.split('T')[0] : '',
        num_migo: os.num_migo || '',
        vinculacao: os.vinculacao || '',
        instalacao_origem_id: os.instalacao_origem_id || '',
        instalacao_destino_id: os.instalacao_destino_id || '',
        itens_documento: os.itens_documento || [],
        volumes: os.volumes || [],
        detalhamento_expedicao: os.detalhamento_expedicao || [],
        status_separacao: os.status_separacao || 'pendente',
        responsavel_separacao: os.responsavel_separacao || '',
        data_separacao: os.data_separacao ? os.data_separacao.split('T')[0] : '',
        data_entrega: os.data_entrega ? os.data_entrega.split('T')[0] : '',
        anexos: os.anexos || [],
        imagens: os.imagens || [],
        nfe_numero: os.nfe_numero || '',
        nfe_serie: os.nfe_serie || '',
        nfe_data_emissao: os.nfe_data_emissao || '',
        nfe_chave_acesso: os.nfe_chave_acesso || '',
        nfe_natureza_operacao: os.nfe_natureza_operacao || '',
        nfe_dados_emissor: os.nfe_dados_emissor || {},
        nfe_dados_destinatario: os.nfe_dados_destinatario || {},
        nfe_dados_transportador: os.nfe_dados_transportador || {},
        nfe_info_complementares: os.nfe_info_complementares || '',
        nfe_itens_conferencia: os.nfe_itens_conferencia || [],
        nfe_numero_receb: os.nfe_numero_receb || '',
        nfe_data_receb: os.nfe_data_receb || '',
        numero_migo_receb: os.numero_migo_receb || '',
        data_migo_receb: os.data_migo_receb ? os.data_migo_receb.split('T')[0] : '',
        numero_v360: os.numero_v360 || '',
        doc_referencia: os.doc_referencia || '',
        data_recebimento: os.data_recebimento ? os.data_recebimento.split('T')[0] : '',
        problema_recebimento: os.problema_recebimento || false,
        problemas_recebimento_ids: os.problemas_recebimento_ids || [],
        resumo_pendencias: os.resumo_pendencias || '',
        acoes_acompanhamento: os.acoes_acompanhamento || '',
        como_foi_solucionado: os.como_foi_solucionado || '',
        data_solucao: os.data_solucao ? os.data_solucao.split('T')[0] : '',
        problemas_anexos: os.problemas_anexos || [],
        fluxo_recebimento: os.fluxo_recebimento || {
          etapa_atual: 1,
          xml_importado: false,
          conferencia_manual_completa: false,
          validacao_divergencias_completa: false,
          armazenagem_completa: false
        },
        fluxo_expedicao: os.fluxo_expedicao || {
          etapa_atual: 1,
          solicitacao_completa: true,
          solicitacao_data: os.created_date || new Date().toISOString(),
          separacao_completa: false,
          preparacao_completa: false,
          envio_completo: false,
          entrega_completa: false
        },
        codigo: os.codigo || '',
        progresso: os.progresso || 0
      };
      setFormData(newFormData);
    } else if (os && !os.id) {
      // Nova OS relacionada - preencher anotações com dados da OS origem
      const anotacoesRelacionada = `Descrição: ${os.descricao_resumida || ''}`;
      
      setFormData({
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
        anotacoes: anotacoesRelacionada,
        projetos_ids: [],
        descricao_resumida: '',
        num_reserva: '',
        data_reserva: '',
        usuario_reserva: '',
        usuario_reserva_email: '',
        orgao: '',
        data_migo: '',
        num_migo: '',
        vinculacao: '',
        instalacao_origem_id: '',
        instalacao_destino_id: '',
        itens_documento: [],
        volumes: [],
        detalhamento_expedicao: [],
        status_separacao: 'pendente',
        responsavel_separacao: '',
        data_separacao: '',
        data_entrega: '',
        anexos: [],
        imagens: [],
        nfe_numero: '',
        nfe_serie: '',
        nfe_data_emissao: '',
        nfe_chave_acesso: '',
        nfe_natureza_operacao: '',
        nfe_dados_emissor: {},
        nfe_dados_destinatario: {},
        nfe_dados_transportador: {},
        nfe_itens_conferencia: [],
        nfe_numero_receb: '',
        nfe_data_receb: '',
        numero_migo_receb: '',
        data_migo_receb: '',
        numero_v360: '',
        doc_referencia: '',
        fluxo_recebimento: {
          etapa_atual: 1,
          xml_importado: false,
          conferencia_manual_completa: false,
          validacao_divergencias_completa: false,
          armazenagem_completa: false
        }
      });
    } else {
      // Reset completo para nova OS sem relação
      setFormData({
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
        usuario_reserva_email: '',
        orgao: '',
        data_migo: '',
        num_migo: '',
        vinculacao: '',
        instalacao_origem_id: '',
        instalacao_destino_id: '',
        itens_documento: [],
        volumes: [],
        detalhamento_expedicao: [],
        status_separacao: 'pendente',
        responsavel_separacao: '',
        data_separacao: '',
        data_entrega: '',
        anexos: [],
        imagens: [],
        nfe_numero: '',
        nfe_serie: '',
        nfe_data_emissao: '',
        nfe_chave_acesso: '',
        nfe_natureza_operacao: '',
        nfe_dados_emissor: {},
        nfe_dados_destinatario: {},
        nfe_dados_transportador: {},
        nfe_itens_conferencia: [],
        nfe_numero_receb: '',
        nfe_data_receb: '',
        numero_migo_receb: '',
        data_migo_receb: '',
        numero_v360: '',
        doc_referencia: '',
        problema_recebimento: false,
        problemas_recebimento_ids: [],
        resumo_pendencias: '',
        acoes_acompanhamento: '',
        como_foi_solucionado: '',
        data_solucao: '',
        problemas_anexos: [],
        fluxo_recebimento: {
          etapa_atual: 1,
          xml_importado: false,
          conferencia_manual_completa: false,
          validacao_divergencias_completa: false,
          armazenagem_completa: false
        },
        fluxo_expedicao: {
          etapa_atual: 1,
          solicitacao_completa: true,
          solicitacao_data: new Date().toISOString(),
          separacao_completa: false,
          preparacao_completa: false,
          envio_completo: false,
          entrega_completa: false
        }
        });
        }
        }, [os, currentUser, pessoas, almoxarifados, categorias, subcategorias]);

  const filteredSubcategorias = Array.isArray(subcategorias) ? subcategorias.filter(s => s?.categoria_id === formData.categoria_id) : [];
  const filteredAlmoxarifados = Array.isArray(almoxarifados) ? almoxarifados.filter(a => a?.regional_id === formData.regional_id) : [];
  const filteredInstalacoes = Array.isArray(instalacoes) ? instalacoes.filter(i => i?.regional_id === formData.regional_id) : [];
  
  const selectedCategoria = Array.isArray(categorias) ? categorias.find(c => c?.id === formData.categoria_id) : null;
  const selectedSubcategorias = Array.isArray(subcategorias) ? subcategorias.filter(s => formData.subcategorias_ids?.includes(s?.id)) : [];
  
  // Filtro para Instalação Destino: se subcategoria é "venda intercompany", mostra todas; senão, filtra por região do almoxarifado
  const isVendaIntercompany = selectedSubcategorias.some(s => s?.nome?.toLowerCase().includes('venda intercompany'));
  const selectedAlmoxarifado = Array.isArray(almoxarifados) ? almoxarifados.find(a => a?.id === formData.almoxarifado_id) : null;
  const selectedInstalacaoAlmoxarifado = Array.isArray(instalacoes) ? instalacoes.find(i => i?.id === selectedAlmoxarifado?.instalacao_id) : null;
  const regiaoAlmoxarifado = selectedInstalacaoAlmoxarifado?.regiao;
  
  const filteredInstalacoesDestino = isVendaIntercompany 
    ? (Array.isArray(instalacoes) ? instalacoes : [])
    : (Array.isArray(instalacoes) ? instalacoes.filter(i => i?.regiao === regiaoAlmoxarifado) : []);
  
  // Check if we should show expedition fields
  const isExpedicaoCategory = 
    selectedCategoria?.nome?.toLowerCase().includes('expedição');
  
  const isRecebimentoCategory = 
    selectedCategoria?.nome?.toLowerCase().includes('recebimento');

  const calculateProgress = (data) => {
    const isRecebimento = selectedCategoria?.nome?.toLowerCase().includes('recebimento');
    
    if (isRecebimento) {
      // Progresso baseado no fluxo de recebimento - cada etapa é 25%
      let progress = 0;
      
      if (data.fluxo_recebimento?.xml_importado) {
        progress = 25;
      }
      if (data.fluxo_recebimento?.conferencia_manual_completa) {
        progress = 50;
      }
      if (data.fluxo_recebimento?.validacao_divergencias_completa) {
        progress = 75;
      }
      if (data.fluxo_recebimento?.armazenagem_completa) {
        progress = 100;
      }
      
      return progress;
    }
    
    // Progresso baseado no fluxo de expedição
    // Cada etapa representa 20% do progresso total
    let progress = 0;

    if (data.fluxo_expedicao?.solicitacao_completa) {
      progress = 20;
    }
    if (data.fluxo_expedicao?.separacao_completa) {
      progress = 40;
    }
    if (data.fluxo_expedicao?.preparacao_completa) {
      progress = 60;
    }
    if (data.fluxo_expedicao?.envio_completo) {
      progress = 80;
    }
    if (data.fluxo_expedicao?.entrega_completa) {
      progress = 100;
    }

    return progress;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let codigo = formData.codigo;
      const isNew = !os?.id;

      if (isNew) {
        // Generate unique ID with regional prefix
        const regional = Array.isArray(regionais) ? regionais.find(r => r?.id === formData.regional_id) : null;
        const regionalSigla = regional?.sigla || 'XX';
        const today = format(new Date(), 'yyyyMMdd');

        // Get all existing codes to ensure uniqueness
        const allOrdens = await base44.entities.OrdemServico.list();
        const existingCodes = new Set((allOrdens || []).map(o => o?.codigo).filter(Boolean));

        // Try sequential numbers until we find an unused one
        let seq = 1;
        let codigo_tentativa = '';
        do {
          codigo_tentativa = `${regionalSigla}-${today}-${String(seq).padStart(4, '0')}`;
          seq++;
        } while (existingCodes.has(codigo_tentativa));

        codigo = codigo_tentativa;
      }

      // Inicializar fluxo_expedicao se for expedição e não existir
      let fluxoExpedicao = formData.fluxo_expedicao;
      if (isExpedicaoCategory && isNew && !fluxoExpedicao) {
        fluxoExpedicao = {
          etapa_atual: 1,
          solicitacao_completa: true,
          solicitacao_data: new Date().toISOString(),
          separacao_completa: false,
          preparacao_completa: false,
          envio_completo: false,
          entrega_completa: false
        };
      }

      const dataToSave = {
        ...formData,
        codigo,
        fluxo_expedicao: isExpedicaoCategory ? fluxoExpedicao : formData.fluxo_expedicao,
        progresso: (isExpedicaoCategory || isRecebimentoCategory) ? calculateProgress({
          ...formData,
          fluxo_expedicao: isExpedicaoCategory ? fluxoExpedicao : formData.fluxo_expedicao
        }) : (formData.progresso || 0)
      };

      console.log('Dados a serem salvos:', dataToSave);
      console.log('Itens documento:', dataToSave.itens_documento);

      let savedOS;
      if (os?.id) {
        // Atualizar OS existente
        savedOS = await base44.entities.OrdemServico.update(os.id, dataToSave);

        // Atualizar fluxo de expedição se aplicável
        if (isExpedicaoCategory) {
          try {
            const fluxoResult = await base44.functions.invoke('atualizarFluxoExpedicao', { os_id: os.id });
            console.log('Fluxo atualizado:', fluxoResult.data);
          } catch (fluxoError) {
            console.error('Erro ao atualizar fluxo de expedição:', fluxoError);
          }
        }

        // Registrar no histórico com campos alterados
        try {
          const camposAlterados = {};
          const camposSignificativos = [
            'status', 'prioridade', 'progresso', 'prazo', 'lider_id',
            'almoxarifado_id', 'categoria_id', 'regional_id', 'data_inicial',
            'data_conclusao', 'anotacoes', 'descricao_resumida', 'atendente_nome'
          ];

          camposSignificativos.forEach(campo => {
            const valorAntigo = os[campo];
            const valorNovo = dataToSave[campo];
            if (JSON.stringify(valorAntigo) !== JSON.stringify(valorNovo)) {
              camposAlterados[campo] = {
                valor_anterior: valorAntigo,
                valor_novo: valorNovo
              };
            }
          });

          // Se houve alterações, registrar cada uma
          if (Object.keys(camposAlterados).length > 0) {
            for (const [campo, valores] of Object.entries(camposAlterados)) {
              await base44.functions.invoke('registrarAuditLog', {
                action: 'update',
                entity_type: 'OrdemServico',
                entity_id: os.id,
                details: {
                  campo: campo,
                  valor_anterior: valores.valor_anterior,
                  valor_novo: valores.valor_novo
                }
              });
            }
          }
        } catch (auditError) {
          console.error('Erro ao registrar atualização no histórico:', auditError);
        }
      } else {
        // Criar nova OS
        savedOS = await base44.entities.OrdemServico.create(dataToSave);

        // Atualizar fluxo de expedição se aplicável
        if (isExpedicaoCategory) {
          try {
            await base44.functions.invoke('atualizarFluxoExpedicao', { os_id: savedOS.id });
          } catch (fluxoError) {
            console.error('Erro ao atualizar fluxo de expedição:', fluxoError);
          }
        }
        
        // Registrar criação no histórico
        try {
          await base44.functions.invoke('registrarAuditLog', {
            action: 'create',
            entity_type: 'OrdemServico',
            entity_id: savedOS.id,
            details: {
              descricao: `OS ${codigo} criada`
            }
          });
        } catch (auditError) {
          console.error('Erro ao registrar criação no histórico:', auditError);
        }
        
        // Criar notificações para pessoas atribuídas na nova OS
        const osId = savedOS.id;
        const pessoasParaNotificar = new Set();
        
        // Adicionar líder
        if (formData.lider_id) {
          pessoasParaNotificar.add(formData.lider_id);
        }
        
        // Adicionar executores
        if (formData.executores_ids?.length > 0) {
          formData.executores_ids.forEach(id => pessoasParaNotificar.add(id));
        }
        
        // Adicionar atendente (buscar por nome)
        if (formData.atendente_nome) {
          const atendente = pessoas.find(p => p.nome === formData.atendente_nome);
          if (atendente) {
            pessoasParaNotificar.add(atendente.id);
          }
        }
        
        // Remover o próprio usuário criador
        const currentPessoa = pessoas.find(p => p.user_id === currentUser?.id);
        if (currentPessoa) {
          pessoasParaNotificar.delete(currentPessoa.id);
        }
        
        // Criar notificações
        for (const pessoaId of pessoasParaNotificar) {
          try {
            await base44.entities.Notificacao.create({
              destinatario_id: pessoaId,
              remetente_id: currentPessoa?.id,
              tipo: 'atribuicao',
              referencia_id: osId,
              referencia_tipo: 'tarefa',
              mensagem: `Você foi atribuído(a) à nova OS ${codigo}`,
              lida: false
            });
          } catch (notifError) {
            console.error('Erro ao criar notificação:', notifError);
          }
        }
      }

      onSave?.(isNew, { ...dataToSave, id: savedOS.id || os?.id });
      toast.success(`OS ${codigo || savedOS.codigo} salva com sucesso!`);
      onClose();
    } catch (error) {
      console.error('Error saving OS:', error);
      toast.error('Erro ao salvar OS', { description: error.message });
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

  const handleNFeXMLUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingXML(true);
    try {
      const formDataXML = new FormData();
      formDataXML.append('file', file);

      const response = await base44.functions.invoke('parseNFeXML', {
        file: file
      });

      if (response.data) {
        const nfeData = response.data;
        setFormData(prev => {
          const updated = {
            ...prev,
            nfe_numero: nfeData.nfe_numero || '',
            nfe_numero_receb: nfeData.nfe_numero || '',
            nfe_serie: nfeData.nfe_serie || '',
            nfe_data_emissao: nfeData.nfe_data_emissao || '',
            nfe_data_receb: nfeData.nfe_data_emissao || '',
            nfe_chave_acesso: nfeData.nfe_chave_acesso || '',
            nfe_natureza_operacao: nfeData.nfe_natureza_operacao || '',
            nfe_dados_emissor: nfeData.nfe_dados_emissor || {},
            nfe_dados_destinatario: nfeData.nfe_dados_destinatario || {},
            nfe_dados_transportador: nfeData.nfe_dados_transportador || {},
            nfe_info_complementares: nfeData.nfe_info_complementares || '',
            nfe_itens_conferencia: nfeData.nfe_itens_conferencia || [],
            fluxo_recebimento: {
              ...prev.fluxo_recebimento,
              etapa_atual: 2,
              xml_importado: true
            }
          };
          console.log('Dados do XML importados:', updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('Erro ao fazer upload do XML:', error);
    } finally {
      setImportingXML(false);
    }
  };

  const removeFile = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleZMMTSEUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setZmmtsePDF(result.file_url);
    } catch (error) {
      console.error('Error uploading ZMMTSE PDF:', error);
    }
  };

  const importZMMTSEData = async () => {
    if (!zmmtsePDF) return;
    
    setImportingPDF(true);
    try {
      const jsonSchema = {
        type: "object",
        properties: {
          n_documento: { type: "string", description: "Número do documento" },
          data_documento: { type: "string", description: "Data do documento no formato DD.MM.YYYY" },
          tipo_movimento: { type: "string", description: "Tipo de movimento" },
          centro_estoque: { type: "string", description: "Centro de estoque" },
          nome_local_entrega: { type: "string", description: "Nome/Local de entrega" },
          centro_custo: { type: "string", description: "Centro de custo" },
          processado_por_nome: { type: "string", description: "Nome completo da pessoa que processou" },
          processado_por_matricula: { type: "string", description: "Matrícula da pessoa que processou" },
          itens: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string", description: "Número do item" },
                material: { type: "string", description: "Código do material" },
                texto_breve: { type: "string", description: "Descrição breve do material" },
                qtd: { type: "number", description: "Quantidade" },
                un: { type: "string", description: "Unidade de medida" },
                localizacao: { type: "string", description: "Localização física do item" },
                dep: { type: "string", description: "Depósito (campo 'Dep.' no documento)" },
                reserva: { type: "string", description: "Número da reserva" },
                saldo_em_estoque: { type: "number", description: "Saldo disponível em estoque" },
                observacao: { type: "string", description: "Observação sobre o item" }
              }
            },
            description: "Lista de itens do documento"
          }
        }
      };

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: zmmtsePDF,
        json_schema: jsonSchema
      });

      if (result.status === "success" && result.output) {
        const data = result.output;
        
        // Mapear campos principais
        const updates = {
          num_reserva: data.itens?.[0]?.reserva || '',
          data_migo: data.data_documento ? format(new Date(data.data_documento.split('.').reverse().join('-')), 'yyyy-MM-dd') : '',
          atendente_nome: data.processado_por_nome ? `${data.processado_por_nome} (${data.processado_por_matricula || ''})`.trim() : '',
          descricao_resumida: data.itens?.[0]?.observacao || '',
          anotacoes: `Centro de estoque: ${data.centro_estoque || ''}, Local Entrega: ${data.nome_local_entrega || ''}, Centro de custo: ${data.centro_custo || ''}, Tipo de movimento: ${data.tipo_movimento || ''}`,
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
        };

        setFormData(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.error('Error importing ZMMTSE data:', error);
    } finally {
      setImportingPDF(false);
    }
  };

  const isValid = formData.categoria_id && formData.subcategorias_ids?.length > 0 && 
    formData.regional_id && formData.almoxarifado_id && formData.lider_id && formData.prazo && !prazoError;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-800">
          <DialogTitle className="text-xl font-semibold">
            {os?.id ? `Editar OS: ${os.codigo}` : 'Nova Ordem de Serviço'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-6">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800 p-1">
                <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
                {isExpedicaoCategory && (
                  <>
                    <TabsTrigger value="documento">Documento</TabsTrigger>
                    <TabsTrigger value="materiais">Materiais</TabsTrigger>
                    <TabsTrigger value="volumes">Volumes</TabsTrigger>
                    <TabsTrigger value="expedicao">Expedição</TabsTrigger>
                  </>
                )}
                {isRecebimentoCategory && (
                  <>
                    <TabsTrigger value="receb-dados">Dados Recebimento</TabsTrigger>
                    <TabsTrigger value="receb-documento">Documento</TabsTrigger>
                    <TabsTrigger value="receb-doc">Cabeçalho NF</TabsTrigger>
                    <TabsTrigger value="receb-mat">Materiais</TabsTrigger>
                    <TabsTrigger value="receb-transp">Transportador</TabsTrigger>
                    <TabsTrigger value="receb-rodape">Rodapé NF</TabsTrigger>
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
                        {(categorias || []).map(c => (
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
                        {(filteredSubcategorias || []).map(s => (
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
                        {(regionais || []).map(r => (
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
                      onValueChange={(v) => {
                        const selectedAlmox = (filteredAlmoxarifados || []).find(a => a.id === v);
                        setFormData({ 
                          ...formData, 
                          almoxarifado_id: v, 
                          executores_ids: [], 
                          atendente_nome: '',
                          instalacao_origem_id: selectedAlmox?.instalacao_id || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(filteredAlmoxarifados || []).map(a => (
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
                      disabled={!formData.almoxarifado_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.almoxarifado_id ? "Selecione..." : "Selecione almoxarifado primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(pessoas || [])
                          .filter(p => p && p.funcoes?.includes('lider') && 
                            (!formData.almoxarifado_id || p.almoxarifados_ids?.includes(formData.almoxarifado_id)))
                          .sort((a, b) => a.nome.localeCompare(b.nome))
                          .map(p => (
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
                      {formData.almoxarifado_id ? (
                        (pessoas || [])
                          .filter(p => p && p.almoxarifados_ids?.includes(formData.almoxarifado_id))
                          .sort((a, b) => a.nome.localeCompare(b.nome))
                          .map(p => (
                            <option key={p.id} value={p.nome} />
                          ))
                      ) : (
                        (pessoas || [])
                          .sort((a, b) => a.nome.localeCompare(b.nome))
                          .map(p => (
                            <option key={p.id} value={p.nome} />
                          ))
                      )}
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
                      (pessoas || []).filter(p => p && p.almoxarifados_ids?.includes(formData.almoxarifado_id)).length > 0 ? (
                        (pessoas || [])
                          .filter(p => p && p.almoxarifados_ids?.includes(formData.almoxarifado_id))
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
                      onChange={(e) => {
                        const novoPrazo = e.target.value;
                        if (novoPrazo && formData.data_inicial && new Date(novoPrazo) < new Date(formData.data_inicial)) {
                          setPrazoError('O prazo não pode ser anterior à data inicial');
                        } else {
                          setPrazoError('');
                        }
                        setFormData({ ...formData, prazo: novoPrazo });
                      }}
                      className={prazoError ? 'border-red-500' : ''}
                    />
                    {prazoError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{prazoError}</p>
                    )}
                  </div>

                  {/* Data Inicial */}
                  <div className="space-y-2">
                    <Label>Data Inicial</Label>
                    <Input
                      type="date"
                      value={formData.data_inicial}
                      onChange={(e) => {
                        const novaDataInicial = e.target.value;
                        if (formData.prazo && novaDataInicial && new Date(formData.prazo) < new Date(novaDataInicial)) {
                          setPrazoError('O prazo não pode ser anterior à data inicial');
                        } else {
                          setPrazoError('');
                        }
                        setFormData({ ...formData, data_inicial: novaDataInicial });
                      }}
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
                      disabled={isExpedicaoCategory || isRecebimentoCategory}
                      className={(isExpedicaoCategory || isRecebimentoCategory) ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed' : ''}
                    />
                    {!isExpedicaoCategory && !isRecebimentoCategory && (
                      <Slider
                        value={[formData.progresso || 0]}
                        onValueChange={(value) => setFormData({ ...formData, progresso: value[0] })}
                        min={0}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    )}
                    {isExpedicaoCategory && (
                      <p className="text-xs text-slate-500">Progresso automático baseado no fluxo de expedição</p>
                    )}
                    {isRecebimentoCategory && (
                      <p className="text-xs text-slate-500">Progresso automático baseado no fluxo de recebimento</p>
                    )}
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
                        {(projetos || []).map(p => (
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
              {isExpedicaoCategory && (
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
                      <Label>Nome Usuário *</Label>
                      <Input
                        value={formData.usuario_reserva}
                        onChange={(e) => setFormData({ ...formData, usuario_reserva: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Usuário</Label>
                      <Input
                        type="email"
                        value={formData.usuario_reserva_email}
                        onChange={(e) => setFormData({ ...formData, usuario_reserva_email: e.target.value })}
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
                      <Popover open={openOrigemCombo} onOpenChange={setOpenOrigemCombo}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openOrigemCombo}
                            className="w-full justify-between"
                          >
                            {formData.instalacao_origem_id
                              ? (filteredInstalacoes || []).find(i => i.id === formData.instalacao_origem_id)?.nome
                              : "Selecione..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar instalação..." />
                            <CommandList>
                              <CommandEmpty>Nenhuma instalação encontrada.</CommandEmpty>
                              <CommandGroup>
                                {(filteredInstalacoes || []).map((i) => (
                                  <CommandItem
                                    key={i.id}
                                    value={i.nome}
                                    onSelect={() => {
                                      setFormData({ ...formData, instalacao_origem_id: i.id });
                                      setOpenOrigemCombo(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.instalacao_origem_id === i.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {i.nome}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Instalação Destino</Label>
                      <Popover open={openDestinoCombo} onOpenChange={setOpenDestinoCombo}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openDestinoCombo}
                            className="w-full justify-between"
                          >
                            {formData.instalacao_destino_id
                              ? (instalacoes || []).find(i => i.id === formData.instalacao_destino_id)?.nome
                              : "Selecione..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar instalação..." />
                            <CommandList>
                              <CommandEmpty>Nenhuma instalação encontrada.</CommandEmpty>
                              <CommandGroup>
                                {(filteredInstalacoesDestino || []).map((i) => (
                                  <CommandItem
                                    key={i.id}
                                    value={i.nome}
                                    onSelect={() => {
                                      setFormData({ ...formData, instalacao_destino_id: i.id });
                                      setOpenDestinoCombo(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.instalacao_destino_id === i.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {i.nome}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* TAB: Materiais */}
              {isExpedicaoCategory && (
                <TabsContent value="materiais">
                  <OSItensDocumento
                    itens={formData.itens_documento}
                    onChange={(itens) => setFormData(prev => ({ ...prev, itens_documento: itens }))}
                  />
                </TabsContent>
              )}

              {/* TAB: Volumes */}
              {isExpedicaoCategory && (
                <TabsContent value="volumes">
                  <OSVolumes
                    volumes={formData.volumes}
                    onChange={(volumes) => setFormData(prev => ({ ...prev, volumes: volumes }))}
                  />
                </TabsContent>
              )}



              {/* TAB: Expedição */}
              {isExpedicaoCategory && (
                <TabsContent value="expedicao" className="space-y-6">
                  <OSDetalhamentoExpedicao
                    detalhamento={formData.detalhamento_expedicao}
                    onChange={(d) => setFormData(prev => ({ ...prev, detalhamento_expedicao: d }))}
                    os={os}
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
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em_separacao">Em separação</SelectItem>
                            <SelectItem value="separado">Separado</SelectItem>
                            <SelectItem value="em_rota">Em rota</SelectItem>
                            <SelectItem value="entregue">Entregue</SelectItem>
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
                      <div className="space-y-2">
                        <Label>Data Entrega</Label>
                        <Input
                          type="date"
                          value={formData.data_entrega}
                          onChange={(e) => {
                            const newData = { ...formData, data_entrega: e.target.value };
                            if (e.target.value) {
                              newData.status_separacao = 'entregue';
                            }
                            setFormData(newData);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* TAB: Recebimento - Dados Recebimento */}
              {isRecebimentoCategory && (
                <TabsContent value="receb-dados" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Data Recebimento */}
                    <div className="space-y-2">
                      <Label>Data Recebimento</Label>
                      <Input
                        type="date"
                        value={formData.data_recebimento}
                        onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
                      />
                    </div>

                    {/* Houve um problema? */}
                    <div className="space-y-2">
                      <Label>Houve um problema?</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="problema_recebimento"
                            checked={!formData.problema_recebimento}
                            onChange={() => setFormData({ ...formData, problema_recebimento: false, problemas_recebimento_ids: [] })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Não</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="problema_recebimento"
                            checked={formData.problema_recebimento}
                            onChange={() => setFormData({ ...formData, problema_recebimento: true })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Sim</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Problemas */}
                  {formData.problema_recebimento && (
                    <div className="border-t pt-6 mt-6">
                      <div className="space-y-3">
                        <Label className="text-sm text-slate-600 dark:text-slate-400">
                          Selecione o(s) problema(s) identificado(s):
                        </Label>
                        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                          {problemasRecebimento.map((problema) => (
                            <div key={problema.id} className="flex items-start gap-2">
                              <Checkbox
                                id={`problema-${problema.id}`}
                                checked={formData.problemas_recebimento_ids?.includes(problema.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      problemas_recebimento_ids: [...(formData.problemas_recebimento_ids || []), problema.id]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      problemas_recebimento_ids: formData.problemas_recebimento_ids?.filter(id => id !== problema.id) || []
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`problema-${problema.id}`} className="cursor-pointer text-sm flex-1">
                                <span className="font-medium">{problema.descricao_resumida}</span>
                                {problema.explicacao && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {problema.explicacao}
                                  </p>
                                )}
                              </Label>
                            </div>
                          ))}
                          {problemasRecebimento.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">
                              Nenhum problema cadastrado
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Campos adicionais quando há problema */}
                      <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                          <Label>Resumo das Pendências</Label>
                          <Textarea
                            value={formData.resumo_pendencias}
                            onChange={(e) => setFormData({ ...formData, resumo_pendencias: e.target.value })}
                            placeholder="Descreva as pendências identificadas..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Ações de Acompanhamento</Label>
                          <Textarea
                            value={formData.acoes_acompanhamento}
                            onChange={(e) => setFormData({ ...formData, acoes_acompanhamento: e.target.value })}
                            placeholder="Descreva as ações de acompanhamento necessárias..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Como foi solucionado</Label>
                          <Textarea
                            value={formData.como_foi_solucionado}
                            onChange={(e) => setFormData({ ...formData, como_foi_solucionado: e.target.value })}
                            placeholder="Descreva como o problema foi solucionado..."
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Data Solução</Label>
                            <Input
                              type="date"
                              value={formData.data_solucao}
                              onChange={(e) => setFormData({ ...formData, data_solucao: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Anexos do Problema</Label>
                            <div className="flex gap-2">
                              <Input
                                type="file"
                                multiple
                                className="cursor-pointer"
                                id="problemas-anexos-upload"
                                onChange={(e) => handleFileUpload(e, 'problemas_anexos')}
                              />
                            </div>
                            {formData.problemas_anexos?.length > 0 && (
                              <div className="space-y-1 mt-2">
                                {(formData.problemas_anexos || []).map((url, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                                      Anexo {i + 1}
                                    </a>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile('problemas_anexos', i)}>
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* TAB: Recebimento - Documento */}
              {isRecebimentoCategory && (
                <TabsContent value="receb-doc" className="space-y-6">
                  <OSRecebimentoDocumento
                    emissor={formData.nfe_dados_emissor}
                    destinatario={formData.nfe_dados_destinatario}
                    onChange={(data) => setFormData(prev => ({
                      ...prev,
                      nfe_dados_emissor: data.emissor || prev.nfe_dados_emissor,
                      nfe_dados_destinatario: data.destinatario || prev.nfe_dados_destinatario
                    }))}
                  />
                </TabsContent>
              )}

              {/* TAB: Recebimento - Rodapé NF */}
              {isRecebimentoCategory && (
                <TabsContent value="receb-rodape" className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Informações Complementares</Label>
                      <Textarea
                        value={formData.nfe_info_complementares}
                        onChange={(e) => setFormData({ ...formData, nfe_info_complementares: e.target.value })}
                        placeholder="Informações complementares da nota fiscal..."
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* TAB: Recebimento - Documento */}
              {isRecebimentoCategory && (
                <TabsContent value="receb-documento" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Número da NF */}
                    <div className="space-y-2">
                      <Label>Número da NF</Label>
                      <Input
                        value={formData.nfe_numero_receb}
                        onChange={(e) => setFormData({ ...formData, nfe_numero_receb: e.target.value })}
                        placeholder="Preenchido automaticamente pelo XML ou digite manualmente"
                      />
                    </div>

                    {/* Data da NF */}
                    <div className="space-y-2">
                      <Label>Data da NF</Label>
                      <Input
                        type="date"
                        value={formData.nfe_data_receb}
                        onChange={(e) => setFormData({ ...formData, nfe_data_receb: e.target.value })}
                      />
                    </div>

                    {/* Número MIGO */}
                    <div className="space-y-2">
                      <Label>Número MIGO</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formData.numero_migo_receb}
                        onChange={(e) => setFormData({ ...formData, numero_migo_receb: e.target.value.replace(/\D/g, '') })}
                        placeholder="Somente números"
                      />
                    </div>

                    {/* Data MIGO */}
                    <div className="space-y-2">
                      <Label>Data MIGO</Label>
                      <Input
                        type="date"
                        value={formData.data_migo_receb}
                        onChange={(e) => setFormData({ ...formData, data_migo_receb: e.target.value })}
                      />
                    </div>

                    {/* Número ID V360 */}
                    <div className="space-y-2">
                      <Label>Número ID V360</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={formData.numero_v360}
                          onChange={(e) => setFormData({ ...formData, numero_v360: e.target.value })}
                          placeholder="Somente número"
                          className="flex-1"
                        />
                        {formData.numero_v360 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(`https://axia.virtual360.io/nf/tax_documents/${formData.numero_v360}`, '_blank')}
                            title="Abrir no V360"
                            className="px-3"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Doc Referência */}
                    <div className="space-y-2">
                      <Label>Doc Referência</Label>
                      <Input
                        type="text"
                        value={formData.doc_referencia}
                        onChange={(e) => setFormData({ ...formData, doc_referencia: e.target.value })}
                        placeholder="Texto livre"
                      />
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* TAB: Recebimento - Transportador */}
              {isRecebimentoCategory && (
                <TabsContent value="receb-transp" className="space-y-6">
                  <OSRecebimentoTransportador
                    transportador={formData.nfe_dados_transportador}
                    onChange={(data) => setFormData(prev => ({
                      ...prev,
                      nfe_dados_transportador: data
                    }))}
                  />
                </TabsContent>
              )}

              {/* TAB: Recebimento - Materiais */}
              {isRecebimentoCategory && (
                <TabsContent value="receb-mat" className="space-y-6">
                  <OSRecebimentoMateriais
                    itens={formData.nfe_itens_conferencia}
                    fluxo={formData.fluxo_recebimento}
                    onChange={(data) => setFormData(prev => ({
                      ...prev,
                      nfe_itens_conferencia: data.itens || prev.nfe_itens_conferencia,
                      fluxo_recebimento: data.fluxo || prev.fluxo_recebimento
                    }))}
                  />
                </TabsContent>
              )}

              {/* TAB: Recebimento - Detalhes (Fluxo) */}
              {isRecebimentoCategory && (
                <TabsContent value="receb-detalhes" className="space-y-6">
                  <OSFluxoRecebimento fluxo={formData.fluxo_recebimento} />
                </TabsContent>
              )}

              {/* TAB: Anexos */}
              <TabsContent value="anexos" className="space-y-6">
                {/* NFe XML Import Section */}
                {isRecebimentoCategory && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">NFe XML</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">Faça upload do XML para importar dados automaticamente</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept=".xml"
                          onChange={handleNFeXMLUpload}
                          className="cursor-pointer"
                          disabled={importingXML}
                        />
                      </div>
                    </div>
                    {importingXML && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando XML...
                      </div>
                    )}
                  </div>
                )}

                {/* ZMMTSE Import Section */}
                {isExpedicaoCategory && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Documento ZMMTSE</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Faça upload do PDF para importar dados automaticamente</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleZMMTSEUpload}
                          className="cursor-pointer"
                        />
                      </div>
                      <Button 
                        onClick={importZMMTSEData}
                        disabled={!zmmtsePDF || importingPDF}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {importingPDF ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</>
                        ) : (
                          <>Importar Dados</>
                        )}
                      </Button>
                    </div>
                    {zmmtsePDF && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <Paperclip className="w-4 h-4" />
                        <a href={zmmtsePDF} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Ver PDF carregado
                        </a>
                      </div>
                    )}
                  </div>
                )}

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
                        {(formData.anexos || []).map((url, i) => (
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
                        {(formData.imagens || []).map((url, i) => (
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