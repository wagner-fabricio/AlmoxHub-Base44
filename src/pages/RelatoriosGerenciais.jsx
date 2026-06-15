import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/components/contexts/AppContext';
import { Loader2, ShieldAlert, FileBarChart } from 'lucide-react';
import { subDays, differenceInDays, format } from 'date-fns';
import RelatorioFilters from '@/components/relatorios/RelatorioFilters';
import RelatorioHeader from '@/components/relatorios/RelatorioHeader';
import RelatorioKPIsExecutivos from '@/components/relatorios/RelatorioKPIsExecutivos';
import RelatorioAnaliseRegional from '@/components/relatorios/RelatorioAnaliseRegional';
import RelatorioPaineis from '@/components/relatorios/RelatorioPaineis';
import RelatorioLeadTime from '@/components/relatorios/RelatorioLeadTime';
import RelatorioProjetos from '@/components/relatorios/RelatorioProjetos';
import RelatorioProblemasIncidentes from '@/components/relatorios/RelatorioProblemasIncidentes';
import RelatorioRoteirizacao from '@/components/relatorios/RelatorioRoteirizacao';
import RelatorioIASection from '@/components/relatorios/RelatorioIASection';
import ExportarRelatorioMenu from '@/components/relatorios/ExportarRelatorioMenu';
import { calcularRoteirizacao } from '@/lib/roteirizacao';

const statusLabels = { elaboracao: 'Em Elaboração', execucao: 'Em Execução', concluido: 'Concluído', cancelado: 'Cancelado' };

export default function RelatoriosGerenciais() {
  const { ordens, regionais, almoxarifados, instalacoes, categorias, subcategorias, projetos, currentPessoa, currentUser, loading: ctxLoading } = useApp();
  const [filters, setFilters] = useState({
    regional: [], almoxarifado: [], categoria: [], subcategoria: [],
    status: [], periodo: '30', dataInicio: '', dataFim: '', orientacao: 'retrato'
  });
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [problemasExpedicao, setProblemasExpedicao] = useState([]);
  const [problemasRecebimento, setProblemasRecebimento] = useState([]);

  // Carrega catálogos de problemas (expedição e recebimento) para análise de incidências
  useEffect(() => {
    (async () => {
      try {
        const [pe, pr] = await Promise.all([
          base44.entities.ProblemaExpedicao.list(),
          base44.entities.ProblemaRecebimento.list(),
        ]);
        setProblemasExpedicao(Array.isArray(pe) ? pe : []);
        setProblemasRecebimento(Array.isArray(pr) ? pr : []);
      } catch (e) {
        console.error('Erro ao carregar catálogos de problemas:', e);
      }
    })();
  }, []);

  const isGestor = currentPessoa?.funcoes?.includes('gestor');
  const isAdmin = currentUser?.role === 'admin';
  const podeAcessar = isGestor || isAdmin;

  // Filtra OS conforme filtros
  const filteredOrdens = useMemo(() => {
    let periodoStart = null, periodoEnd = null, periodoCutoff = null;
    if (filters.periodo === 'mes_atual') {
      const now = new Date();
      periodoStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodoEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (filters.periodo === 'customizado') {
      if (filters.dataInicio) periodoStart = new Date(filters.dataInicio);
      if (filters.dataFim) { periodoEnd = new Date(filters.dataFim); periodoEnd.setHours(23, 59, 59, 999); }
    } else if (filters.periodo !== 'all') {
      periodoCutoff = subDays(new Date(), parseInt(filters.periodo));
    }

    return ordens.filter(os => {
      if (filters.regional.length > 0 && !filters.regional.includes(os.regional_id)) return false;
      if (filters.almoxarifado.length > 0 && !filters.almoxarifado.includes(os.almoxarifado_id)) return false;
      if (filters.categoria.length > 0 && !filters.categoria.includes(os.categoria_id)) return false;
      if (filters.subcategoria.length > 0 && !(os.subcategorias_ids || []).some(s => filters.subcategoria.includes(s))) return false;
      if (filters.status.length > 0 && !filters.status.includes(os.status)) return false;

      const osDate = new Date(os.created_date);
      if (periodoStart && periodoEnd) { if (osDate < periodoStart || osDate > periodoEnd) return false; }
      else if (periodoStart) { if (osDate < periodoStart) return false; }
      else if (periodoEnd) { if (osDate > periodoEnd) return false; }
      else if (periodoCutoff) { if (osDate < periodoCutoff) return false; }
      return true;
    });
  }, [ordens, filters]);

  const categoriaRecebimento = useMemo(() => categorias.find(c => c.nome?.toLowerCase().includes('recebimento')), [categorias]);
  const categoriaExpedicao = useMemo(() => categorias.find(c => c.nome?.toLowerCase().includes('expedição')), [categorias]);

  const periodoLabel = useMemo(() => {
    if (filters.periodo === 'all') return 'Todo o período';
    if (filters.periodo === 'mes_atual') return `Mês atual (${format(new Date(), 'MMMM/yyyy')})`;
    if (filters.periodo === 'customizado') return `${filters.dataInicio || '...'} até ${filters.dataFim || '...'}`;
    return `Últimos ${filters.periodo} dias`;
  }, [filters]);

  // Cálculo dos dados consolidados
  const dadosConsolidados = useMemo(() => {
    const hoje = new Date();
    const totalOS = filteredOrdens.length;
    const osEmExecucao = filteredOrdens.filter(os => os.status === 'execucao').length;
    const osConcluidas = filteredOrdens.filter(os => os.status === 'concluido').length;
    const osEmElaboracao = filteredOrdens.filter(os => os.status === 'elaboracao').length;
    const osCanceladas = filteredOrdens.filter(os => os.status === 'cancelado').length;

    const avgProgress = totalOS > 0 ? Math.round(filteredOrdens.reduce((s, os) => s + (os.progresso || 0), 0) / totalOS) : 0;

    const osComPrazo = filteredOrdens.filter(os => os.prazo);
    const onTime = osComPrazo.filter(os => {
      if (os.status === 'concluido' && os.data_conclusao) return new Date(os.data_conclusao) <= new Date(os.prazo);
      return new Date(os.prazo) >= hoje;
    }).length;
    const onTimeRate = osComPrazo.length > 0 ? Math.round((onTime / osComPrazo.length) * 100) : 0;

    const concluidasComData = filteredOrdens.filter(os => os.status === 'concluido' && os.data_conclusao && os.data_inicial);
    const avgResolutionDays = concluidasComData.length > 0
      ? Math.round(concluidasComData.reduce((s, os) => s + Math.abs(differenceInDays(new Date(os.data_conclusao), new Date(os.data_inicial))), 0) / concluidasComData.length)
      : 0;

    const kpis = {
      totalOS, osEmExecucao, osConcluidas, osEmElaboracao, osCanceladas,
      percConclusao: totalOS > 0 ? Math.round((osConcluidas / totalOS) * 100) : 0,
      avgProgress, onTimeRate, avgResolutionDays
    };

    // Por regional — quando apenas 1 regional está selecionada (sem almoxarifado), agrupa por almoxarifado dessa regional
    const agruparPorAlmoxarifado = filters.regional.length === 1 && filters.almoxarifado.length === 0;
    const porRegional = agruparPorAlmoxarifado
      ? almoxarifados
          .filter(a => a.regional_id === filters.regional[0])
          .map(a => {
            const reg = filteredOrdens.filter(os => os.almoxarifado_id === a.id);
            return {
              name: a.nome,
              elaboracao: reg.filter(os => os.status === 'elaboracao').length,
              execucao: reg.filter(os => os.status === 'execucao').length,
              concluido: reg.filter(os => os.status === 'concluido').length,
              cancelado: reg.filter(os => os.status === 'cancelado').length,
              total: reg.length
            };
          }).filter(d => d.total > 0).sort((a, b) => b.total - a.total)
      : regionais.map(r => {
          const reg = filteredOrdens.filter(os => os.regional_id === r.id);
          return {
            name: r.sigla,
            elaboracao: reg.filter(os => os.status === 'elaboracao').length,
            execucao: reg.filter(os => os.status === 'execucao').length,
            concluido: reg.filter(os => os.status === 'concluido').length,
            cancelado: reg.filter(os => os.status === 'cancelado').length,
            total: reg.length
          };
        }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

    // Top 10 almoxarifados — empilhado por categoria
    const porAlmoxarifado = almoxarifados
      .map(a => {
        const osDoAlmox = filteredOrdens.filter(os => os.almoxarifado_id === a.id);
        const porCategoria = {};
        categorias.forEach(c => {
          const count = osDoAlmox.filter(os => os.categoria_id === c.id).length;
          if (count > 0) porCategoria[c.nome] = count;
        });
        return { name: a.nome, total: osDoAlmox.length, ...porCategoria };
      })
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const categoriasUsadas = categorias
      .filter(c => porAlmoxarifado.some(a => (a[c.nome] || 0) > 0))
      .map(c => ({ nome: c.nome, cor: c.cor || '#64748b' }));

    // Recebimento
    const osRecebimento = categoriaRecebimento ? filteredOrdens.filter(os => os.categoria_id === categoriaRecebimento.id) : [];
    const comProblemas = osRecebimento.filter(os => os.problema_recebimento).length;
    const conformes = osRecebimento.length - comProblemas;
    // LTR (Lead Time de Recebimento) = data_migo_receb − data_recebimento (dias corridos)
    const recebimentoConcluidas = osRecebimento.filter(os => os.data_recebimento && os.data_migo_receb);
    const leadTimeRec = recebimentoConcluidas.length > 0
      ? Math.round(recebimentoConcluidas.reduce((s, os) => s + Math.max(0, differenceInDays(new Date(os.data_migo_receb), new Date(os.data_recebimento))), 0) / recebimentoConcluidas.length)
      : 0;
    // Breakdown de recebimento — por regional ou por almoxarifado (quando 1 regional selecionada)
    const breakdownRecebimento = (() => {
      const calcBuckets = (osList) => {
        const conf = osList.filter(o => !o.problema_recebimento && o.status === 'concluido').length;
        const prob = osList.filter(o => o.problema_recebimento).length;
        const pend = osList.filter(o => !o.problema_recebimento && o.status !== 'concluido').length;
        return { conformes: conf, comProblemas: prob, pendentes: pend, total: osList.length };
      };

      if (agruparPorAlmoxarifado) {
        return almoxarifados
          .filter(a => a.regional_id === filters.regional[0])
          .map(a => ({ name: a.nome, ...calcBuckets(osRecebimento.filter(os => os.almoxarifado_id === a.id)) }))
          .filter(d => d.total > 0)
          .sort((a, b) => b.total - a.total);
      }
      return regionais
        .map(r => ({ name: r.sigla, ...calcBuckets(osRecebimento.filter(os => os.regional_id === r.id)) }))
        .filter(d => d.total > 0)
        .sort((a, b) => b.total - a.total);
    })();

    const recebimento = {
      total: osRecebimento.length,
      taxaConformidade: osRecebimento.length > 0 ? Math.round((conformes / osRecebimento.length) * 100) : 0,
      comProblemas,
      leadTime: leadTimeRec,
      distribuicao: [
        { name: 'Conformes', value: conformes },
        { name: 'Com Problemas', value: comProblemas },
        { name: 'Pendentes', value: osRecebimento.filter(os => os.status === 'elaboracao').length }
      ].filter(d => d.value > 0),
      breakdown: breakdownRecebimento,
      breakdownTipo: agruparPorAlmoxarifado ? 'almoxarifado' : 'regional'
    };

    // Expedição
    const osExpedicao = categoriaExpedicao ? filteredOrdens.filter(os => os.categoria_id === categoriaExpedicao.id) : [];
    const expConcluidasComPrazo = osExpedicao.filter(os => os.status === 'concluido' && os.data_entrega && os.prazo);
    const otifCount = expConcluidasComPrazo.filter(os => new Date(os.data_entrega) <= new Date(os.prazo)).length;
    const otif = expConcluidasComPrazo.length > 0 ? Math.round((otifCount / expConcluidasComPrazo.length) * 100) : 0;
    const emTransito = osExpedicao.filter(os => os.status_separacao === 'em_rota' || os.status_separacao === 'aguardando_transporte').length;
    const expConcluidas = osExpedicao.filter(os => os.status === 'concluido' && os.data_entrega && os.created_date);
    const leadTimeExp = expConcluidas.length > 0
      ? Math.round(expConcluidas.reduce((s, os) => s + Math.abs(differenceInDays(new Date(os.data_entrega), new Date(os.created_date))), 0) / expConcluidas.length)
      : 0;
    const sepLabels = { pendente: 'Pendente', em_separacao: 'Em Separação', separado: 'Separado', embalando: 'Embalando', aguardando_transporte: 'Aguardando Transp.', em_rota: 'Em Rota', entregue: 'Entregue' };
    const statusSeparacao = Object.entries(sepLabels)
      .map(([k, label]) => ({ name: label, total: osExpedicao.filter(os => os.status_separacao === k).length }))
      .filter(d => d.total > 0);
    const expedicao = {
      total: osExpedicao.length,
      otif,
      emTransito,
      leadTime: leadTimeExp,
      statusSeparacao
    };

    // Lead Time Reservas (OS com data_reserva preenchida)
    const osReservas = filteredOrdens.filter(os => os.data_reserva && os.status === 'concluido' && os.data_conclusao);
    const leadTimeReservas = {
      total: osReservas.length,
      dias: osReservas.length > 0
        ? Math.round(osReservas.reduce((s, os) => s + Math.abs(differenceInDays(new Date(os.data_conclusao), new Date(os.data_reserva))), 0) / osReservas.length)
        : 0
    };

    // Lead Time NF Estoque (OS com nfe_data_emissao e data_recebimento)
    const osNFEstoque = filteredOrdens.filter(os => os.nfe_data_emissao && os.data_recebimento);
    const leadTimeNFEstoque = {
      total: osNFEstoque.length,
      dias: osNFEstoque.length > 0
        ? Math.round(osNFEstoque.reduce((s, os) => s + Math.abs(differenceInDays(new Date(os.data_recebimento), new Date(os.nfe_data_emissao))), 0) / osNFEstoque.length)
        : 0
    };

    // ============ PROJETOS ============
    // Determina período de avaliação
    let periodoStart = null, periodoEnd = new Date();
    if (filters.periodo === 'mes_atual') {
      const now = new Date();
      periodoStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodoEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (filters.periodo === 'customizado') {
      if (filters.dataInicio) periodoStart = new Date(filters.dataInicio);
      if (filters.dataFim) { periodoEnd = new Date(filters.dataFim); periodoEnd.setHours(23, 59, 59, 999); }
    } else if (filters.periodo !== 'all') {
      periodoStart = subDays(new Date(), parseInt(filters.periodo));
    }

    // Aplica filtros de regional/almoxarifado nos projetos
    const projetosFiltrados = (projetos || []).filter(p => {
      if (filters.regional.length > 0 && !filters.regional.includes(p.regional_id)) return false;
      if (filters.almoxarifado.length > 0 && !filters.almoxarifado.includes(p.almoxarifado_id)) return false;
      return true;
    });

    const projetosConcluidos = projetosFiltrados.filter(p => {
      if (p.status_projeto !== 'concluido' || !p.data_final_execucao) return false;
      const dataConcl = new Date(p.data_final_execucao);
      if (periodoStart && dataConcl < periodoStart) return false;
      if (periodoEnd && dataConcl > periodoEnd) return false;
      return true;
    });

    const projetosAbertos = projetosFiltrados.filter(p =>
      p.status_projeto === 'ativo' || p.status_projeto === 'parado'
    );

    // Avaliação de prazos
    const projetosNoPrazo = projetosConcluidos.filter(p =>
      p.data_final_prevista && p.data_final_execucao &&
      new Date(p.data_final_execucao) <= new Date(p.data_final_prevista)
    ).length;
    const projetosAtrasados = projetosConcluidos.filter(p =>
      p.data_final_prevista && p.data_final_execucao &&
      new Date(p.data_final_execucao) > new Date(p.data_final_prevista)
    ).length;

    const projetosAbertosAtrasados = projetosAbertos.filter(p =>
      p.data_final_prevista && new Date(p.data_final_prevista) < hoje
    ).length;
    const projetosParados = projetosAbertos.filter(p => p.status_projeto === 'parado').length;

    // Duração média de projetos concluídos
    const duracoesProjetos = projetosConcluidos
      .filter(p => p.data_inicial_execucao && p.data_final_execucao)
      .map(p => Math.abs(differenceInDays(new Date(p.data_final_execucao), new Date(p.data_inicial_execucao))));
    const duracaoMediaProjetos = duracoesProjetos.length > 0
      ? Math.round(duracoesProjetos.reduce((s, d) => s + d, 0) / duracoesProjetos.length)
      : 0;

    const projetosDados = {
      totalConcluidos: projetosConcluidos.length,
      totalAbertos: projetosAbertos.length,
      noPrazo: projetosNoPrazo,
      atrasados: projetosAtrasados,
      taxaNoPrazo: projetosConcluidos.length > 0 ? Math.round((projetosNoPrazo / projetosConcluidos.length) * 100) : 0,
      abertosAtrasados: projetosAbertosAtrasados,
      parados: projetosParados,
      duracaoMediaDias: duracaoMediaProjetos,
      listaConcluidos: projetosConcluidos.slice(0, 10).map(p => ({
        nome: p.nome,
        regional: regionais.find(r => r.id === p.regional_id)?.sigla || '-',
        duracao: p.data_inicial_execucao && p.data_final_execucao
          ? Math.abs(differenceInDays(new Date(p.data_final_execucao), new Date(p.data_inicial_execucao)))
          : null,
        noPrazo: p.data_final_prevista && p.data_final_execucao
          ? new Date(p.data_final_execucao) <= new Date(p.data_final_prevista)
          : null
      })),
      listaAbertos: projetosAbertos.slice(0, 10).map(p => ({
        nome: p.nome,
        regional: regionais.find(r => r.id === p.regional_id)?.sigla || '-',
        status: p.status_projeto,
        atrasado: p.data_final_prevista && new Date(p.data_final_prevista) < hoje
      }))
    };

    // ============ INCIDÊNCIAS DE PROBLEMAS ============
    // Conta ocorrências de cada problema (expedição e recebimento) entre as OS filtradas
    const contarIncidencias = (catalog, getIds) => {
      const contagem = new Map();
      filteredOrdens.forEach(os => {
        const ids = getIds(os) || [];
        ids.forEach(id => contagem.set(id, (contagem.get(id) || 0) + 1));
      });
      return catalog
        .map(p => ({
          id: p.id,
          descricao: p.descricao_resumida,
          explicacao: p.explicacao,
          ocorrencias: contagem.get(p.id) || 0,
        }))
        .filter(p => p.ocorrencias > 0)
        .sort((a, b) => b.ocorrencias - a.ocorrencias);
    };

    const topProblemasExpedicao = contarIncidencias(problemasExpedicao, os => os.problemas_expedicao_ids);
    const topProblemasRecebimento = contarIncidencias(problemasRecebimento, os => os.problemas_recebimento_ids);

    const osComOcorrenciaExp = filteredOrdens.filter(os => os.houve_ocorrencia_expedicao).length;
    const osComProblemaReceb = filteredOrdens.filter(os => os.problema_recebimento).length;

    const problemas = {
      expedicao: {
        totalOSComOcorrencia: osComOcorrenciaExp,
        totalIncidentesCatalogados: topProblemasExpedicao.reduce((s, p) => s + p.ocorrencias, 0),
        top: topProblemasExpedicao.slice(0, 10),
      },
      recebimento: {
        totalOSComProblema: osComProblemaReceb,
        totalIncidentesCatalogados: topProblemasRecebimento.reduce((s, p) => s + p.ocorrencias, 0),
        top: topProblemasRecebimento.slice(0, 10),
      },
    };

    // ============ ROTEIRIZAÇÃO / LOGÍSTICA ============
    const roteirizacao = calcularRoteirizacao(filteredOrdens, almoxarifados, instalacoes || []);

    return { kpis, porRegional, porAlmoxarifado, categoriasUsadas, recebimento, expedicao, leadTimeReservas, leadTimeNFEstoque, agruparPorAlmoxarifado, projetos: projetosDados, problemas, roteirizacao };
  }, [filteredOrdens, regionais, almoxarifados, instalacoes, categorias, categoriaRecebimento, categoriaExpedicao, projetos, problemasExpedicao, problemasRecebimento, filters]);

  const handleGerar = async () => {
    setLoading(true);
    try {
      const filtrosAplicados = {
        regionais: filters.regional.map(id => regionais.find(r => r.id === id)?.sigla).filter(Boolean),
        almoxarifados: filters.almoxarifado.map(id => almoxarifados.find(a => a.id === id)?.nome).filter(Boolean),
        categorias: filters.categoria.map(id => categorias.find(c => c.id === id)?.nome).filter(Boolean),
        status: filters.status.map(s => statusLabels[s]),
        periodo: periodoLabel
      };

      const response = await base44.functions.invoke('gerarResumoRelatorio', {
        dados: dadosConsolidados,
        filtrosAplicados
      });

      if (response.data.error) throw new Error(response.data.error);

      // Alguns modelos retornam o schema dentro de .response
      const analise = response.data.analise?.response || response.data.analise;

      setRelatorio({
        analise,
        filtrosAplicados,
        dataGeracao: new Date().toISOString()
      });

      setTimeout(() => {
        document.getElementById('relatorio-content')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (e) {
      alert('Erro ao gerar relatório: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (ctxLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!podeAcessar) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Acesso Restrito</h2>
          <p className="text-slate-600 dark:text-slate-400">Esta página está disponível apenas para usuários com função de Gestor ou Administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0000FF 0%, #0A003C 100%)' }}>
              <FileBarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Relatórios Gerenciais</h1>
              <p className="text-slate-500 dark:text-slate-400">Análise executiva consolidada</p>
            </div>
          </div>
        </div>
        {relatorio && (
          <ExportarRelatorioMenu
            elementId="relatorio-content"
            dados={dadosConsolidados}
            analise={relatorio.analise}
            periodoLabel={periodoLabel}
            orientacao={filters.orientacao}
            filtrosAplicados={relatorio.filtrosAplicados}
            dataGeracao={relatorio.dataGeracao}
          />
        )}
      </div>

      {/* Filtros */}
      <RelatorioFilters
        filters={filters}
        setFilters={setFilters}
        regionais={regionais}
        almoxarifados={almoxarifados}
        categorias={categorias}
        subcategorias={subcategorias}
        onGerar={handleGerar}
        loading={loading}
      />

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#0000FF' }} />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Gerando análise executiva...</h3>
            <p className="text-slate-500 mt-1">A IA está analisando {dadosConsolidados.kpis.totalOS} OS. Isso pode levar alguns segundos.</p>
          </div>
        </div>
      )}

      {/* Conteúdo do Relatório — permanece visível mesmo durante geração de novo */}
      {relatorio && (
        <div id="relatorio-content" className="space-y-8 bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
          <RelatorioHeader
            filtrosAplicados={relatorio.filtrosAplicados}
            periodoLabel={periodoLabel}
            dataGeracao={relatorio.dataGeracao}
          />
          <RelatorioKPIsExecutivos kpis={dadosConsolidados.kpis} />
          <RelatorioLeadTime
            leadTimeReservas={dadosConsolidados.leadTimeReservas}
            leadTimeNFEstoque={dadosConsolidados.leadTimeNFEstoque}
          />
          <RelatorioAnaliseRegional
            porRegional={dadosConsolidados.porRegional}
            porAlmoxarifado={dadosConsolidados.porAlmoxarifado}
            categoriasUsadas={dadosConsolidados.categoriasUsadas}
            agruparPorAlmoxarifado={dadosConsolidados.agruparPorAlmoxarifado}
            regionalSelecionada={dadosConsolidados.agruparPorAlmoxarifado ? regionais.find(r => r.id === filters.regional[0])?.sigla : null}
          />
          <RelatorioPaineis
            recebimento={dadosConsolidados.recebimento}
            expedicao={dadosConsolidados.expedicao}
          />
          <RelatorioProjetos projetos={dadosConsolidados.projetos} />
          <RelatorioProblemasIncidentes problemas={dadosConsolidados.problemas} />
          <RelatorioRoteirizacao roteirizacao={dadosConsolidados.roteirizacao} />
          <RelatorioIASection analise={relatorio.analise} />
        </div>
      )}

      {/* Estado inicial */}
      {!relatorio && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
            <FileBarChart className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Configure os filtros e gere seu relatório</h3>
          <p className="text-slate-500 max-w-md mx-auto">Selecione o escopo desejado nos filtros acima e clique em "Gerar Relatório" para receber uma análise executiva completa.</p>
          <p className="text-xs text-slate-400 mt-4">📊 {filteredOrdens.length} OS serão analisadas com os filtros atuais</p>
        </div>
      )}
    </div>
  );
}