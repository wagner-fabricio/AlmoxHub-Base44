import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Plus, Pencil, Trash2, Search, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FeriadoFormModal from '@/components/feriados/FeriadoFormModal';
import { toast } from '@/components/ui/use-toast';

const TIPO_LABELS = { nacional: 'Nacional', estadual: 'Estadual', municipal: 'Municipal', local: 'Local' };
const TIPO_COLORS = {
  nacional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  estadual: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  municipal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  local: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
};
const OCORRENCIA_LABELS = {
  feriado: 'Feriado',
  ponto_facultativo: 'Ponto Facultativo',
  dia_ponte: 'Dia Ponte',
  fechamento_contabil: 'Fechamento Contábil SAP',
  outros: 'Outros',
};

const parseDateLocal = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function FeriadosPage() {
  const [feriados, setFeriados] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [instalacoes, setInstalacoes] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const [ano, setAno] = useState(currentYear);
  const [filtroRegional, setFiltroRegional] = useState('todas');
  const [filtroAlmox, setFiltroAlmox] = useState('todos');
  const [filtroUF, setFiltroUF] = useState('todas');
  const [filtroCidade, setFiltroCidade] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroOcorrencia, setFiltroOcorrencia] = useState('todas');
  const [busca, setBusca] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fs, alms, insts, regs] = await Promise.all([
        base44.entities.Feriado.list('-data', 2000),
        base44.entities.Almoxarifado.list('-created_date', 500),
        base44.entities.Instalacao.list('-created_date', 500),
        base44.entities.Regional.list(),
      ]);
      setFeriados(fs || []);
      setAlmoxarifados(alms || []);
      setInstalacoes(insts || []);
      setRegionais(regs || []);
    } catch (e) {
      toast({ title: 'Erro ao carregar', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Enriquecer almoxarifados com cidade/UF da instalação
  const almoxEnriquecidos = useMemo(() => {
    return almoxarifados.map(a => {
      const inst = instalacoes.find(i => i.id === a.instalacao_id);
      return { ...a, cidade: inst?.cidade || '', estado: inst?.estado || '' };
    });
  }, [almoxarifados, instalacoes]);

  // Anos disponíveis (a partir dos feriados existentes + ano atual e próximos)
  const anosDisponiveis = useMemo(() => {
    const set = new Set([currentYear, currentYear + 1, currentYear - 1]);
    feriados.forEach(f => { if (f.ano) set.add(f.ano); else if (f.data) set.add(parseInt(f.data.substring(0, 4), 10)); });
    return [...set].sort((a, b) => b - a);
  }, [feriados, currentYear]);

  const ufsDisponiveis = useMemo(() => {
    const set = new Set();
    almoxEnriquecidos.forEach(a => a.estado && set.add(a.estado));
    feriados.forEach(f => f.estado && set.add(f.estado));
    return [...set].sort();
  }, [almoxEnriquecidos, feriados]);

  const cidadesDisponiveis = useMemo(() => {
    const set = new Set();
    almoxEnriquecidos.forEach(a => {
      if (a.cidade && (filtroUF === 'todas' || a.estado === filtroUF)) set.add(a.cidade);
    });
    feriados.forEach(f => {
      if (f.cidade && (filtroUF === 'todas' || f.estado === filtroUF)) set.add(f.cidade);
    });
    return [...set].sort();
  }, [almoxEnriquecidos, feriados, filtroUF]);

  // Almoxarifados filtrados por regional para o filtro
  const almoxParaFiltro = useMemo(() => {
    return almoxEnriquecidos.filter(a => filtroRegional === 'todas' || a.regional_id === filtroRegional);
  }, [almoxEnriquecidos, filtroRegional]);

  const feriadosFiltrados = useMemo(() => {
    return feriados.filter(f => {
      const anoF = f.ano || (f.data ? parseInt(f.data.substring(0, 4), 10) : null);
      if (anoF !== ano) return false;
      if (filtroTipo !== 'todos' && f.tipo !== filtroTipo) return false;
      if (filtroOcorrencia !== 'todas' && (f.tipo_ocorrencia || 'feriado') !== filtroOcorrencia) return false;
      if (filtroUF !== 'todas') {
        // Nacional aparece para qualquer UF; estadual/municipal/local precisam casar
        if (f.tipo === 'nacional') {
          // ok
        } else if (f.tipo === 'estadual' || f.tipo === 'municipal') {
          if (f.estado !== filtroUF) return false;
        } else if (f.tipo === 'local') {
          const alm = almoxEnriquecidos.find(a => a.id === f.almoxarifado_id);
          if (!alm || alm.estado !== filtroUF) return false;
        }
      }
      if (filtroCidade !== 'todas') {
        if (f.tipo === 'nacional' || f.tipo === 'estadual') {
          // nacional/estadual valem para a cidade — ok
        } else if (f.tipo === 'municipal') {
          if ((f.cidade || '').toLowerCase() !== filtroCidade.toLowerCase()) return false;
        } else if (f.tipo === 'local') {
          const alm = almoxEnriquecidos.find(a => a.id === f.almoxarifado_id);
          if (!alm || (alm.cidade || '').toLowerCase() !== filtroCidade.toLowerCase()) return false;
        }
      }
      if (filtroRegional !== 'todas') {
        // Mostrar só feriados que afetam ao menos 1 almoxarifado da regional
        const almoxRegional = almoxParaFiltro;
        if (almoxRegional.length === 0) return false;
        if (f.tipo === 'nacional') {
          // ok — afeta todos
        } else if (f.tipo === 'estadual') {
          if (!almoxRegional.some(a => a.estado === f.estado)) return false;
        } else if (f.tipo === 'municipal') {
          if (!almoxRegional.some(a => a.estado === f.estado && (a.cidade || '').toLowerCase() === (f.cidade || '').toLowerCase())) return false;
        } else if (f.tipo === 'local') {
          if (!almoxRegional.some(a => a.id === f.almoxarifado_id)) return false;
        }
      }
      if (filtroAlmox !== 'todos') {
        const alm = almoxEnriquecidos.find(a => a.id === filtroAlmox);
        if (!alm) return false;
        if (f.tipo === 'nacional') {
          // ok
        } else if (f.tipo === 'estadual') {
          if (alm.estado !== f.estado) return false;
        } else if (f.tipo === 'municipal') {
          if (alm.estado !== f.estado || (alm.cidade || '').toLowerCase() !== (f.cidade || '').toLowerCase()) return false;
        } else if (f.tipo === 'local') {
          if (f.almoxarifado_id !== filtroAlmox) return false;
        }
      }
      if (busca.trim()) {
        const q = busca.toLowerCase();
        if (!(f.nome || '').toLowerCase().includes(q) && !(f.cidade || '').toLowerCase().includes(q) && !(f.estado || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [feriados, ano, filtroTipo, filtroOcorrencia, filtroUF, filtroCidade, filtroRegional, filtroAlmox, busca, almoxEnriquecidos, almoxParaFiltro]);

  // Totalizador: dias únicos (mesma data conta uma vez)
  const totalDiasUnicos = useMemo(() => {
    const set = new Set(feriadosFiltrados.map(f => f.data));
    return set.size;
  }, [feriadosFiltrados]);

  const handleDelete = async (id) => {
    if (!confirm('Excluir este feriado?')) return;
    try {
      await base44.entities.Feriado.delete(id);
      toast({ title: 'Feriado excluído' });
      loadData();
    } catch (e) {
      toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' });
    }
  };

  const limparFiltros = () => {
    setFiltroRegional('todas');
    setFiltroAlmox('todos');
    setFiltroUF('todas');
    setFiltroCidade('todas');
    setFiltroTipo('todos');
    setFiltroOcorrencia('todas');
    setBusca('');
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feriados</h1>
            <p className="text-sm text-slate-500">Dias descontados nos cálculos de dias úteis</p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Feriado
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4" /> Filtros
          <button onClick={limparFiltros} className="ml-auto text-xs font-normal text-blue-600 hover:underline">Limpar filtros</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div>
            <Label className="text-xs">Ano</Label>
            <Select value={String(ano)} onValueChange={v => setAno(parseInt(v, 10))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Regional</Label>
            <Select value={filtroRegional} onValueChange={v => { setFiltroRegional(v); setFiltroAlmox('todos'); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {regionais.map(r => <SelectItem key={r.id} value={r.id}>{r.sigla}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Almoxarifado</Label>
            <Select value={filtroAlmox} onValueChange={setFiltroAlmox}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {almoxParaFiltro.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">UF</Label>
            <Select value={filtroUF} onValueChange={v => { setFiltroUF(v); setFiltroCidade('todas'); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {ufsDisponiveis.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cidade</Label>
            <Select value={filtroCidade} onValueChange={setFiltroCidade}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {cidadesDisponiveis.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo de Feriado</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo de Ocorrência</Label>
            <Select value={filtroOcorrencia} onValueChange={setFiltroOcorrencia}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {Object.entries(OCORRENCIA_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar por nome, cidade ou UF..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
        ) : feriadosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
            Nenhum feriado encontrado para os filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold">Data</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Dia da Semana</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Nome</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Abrangência</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Ocorrência</th>
                  <th className="px-3 py-2.5 text-left font-semibold">UF</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Cidade</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Almoxarifado</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Ativo</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {feriadosFiltrados.map((f, idx) => {
                  const d = parseDateLocal(f.data);
                  const alm = f.almoxarifado_id ? almoxEnriquecidos.find(a => a.id === f.almoxarifado_id) : null;
                  return (
                    <tr key={f.id} className={`border-b border-slate-100 dark:border-slate-700/50 ${idx % 2 ? 'bg-slate-50/40 dark:bg-slate-700/20' : ''} hover:bg-blue-50/30 dark:hover:bg-blue-900/10`}>
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">{d ? format(d, 'dd/MM/yyyy') : '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap capitalize text-slate-600 dark:text-slate-400">{d ? format(d, 'EEEE', { locale: ptBR }) : '—'}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{f.nome}</td>
                      <td className="px-3 py-2"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLORS[f.tipo] || ''}`}>{TIPO_LABELS[f.tipo] || f.tipo}</span></td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{OCORRENCIA_LABELS[f.tipo_ocorrencia || 'feriado']}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{f.estado || (alm?.estado || '—')}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{f.cidade || (alm?.cidade || '—')}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{alm?.nome || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {f.ativo !== false
                          ? <span className="inline-flex w-2 h-2 rounded-full bg-green-500" title="Ativo" />
                          : <span className="inline-flex w-2 h-2 rounded-full bg-slate-300" title="Inativo" />}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <button onClick={() => { setEditing(f); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 ml-1" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Totalizadores */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-slate-600 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">{feriadosFiltrados.length}</strong> linha(s) exibida(s)
          </div>
          <div className="text-slate-600 dark:text-slate-300">
            Total de dias de feriado (datas únicas): <strong className="text-slate-900 dark:text-white">{totalDiasUnicos}</strong>
          </div>
        </div>
      </div>

      <FeriadoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        feriado={editing}
        almoxarifados={almoxEnriquecidos}
        onSaved={loadData}
      />
    </div>
  );
}