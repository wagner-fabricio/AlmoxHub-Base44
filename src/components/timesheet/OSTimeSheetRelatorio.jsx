import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatarTempo } from './TimeSheetButton';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PERIODOS = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Esta semana', value: 'semana' },
  { label: 'Este mês', value: 'mes' },
  { label: 'Mês passado', value: 'mes_passado' },
  { label: 'Todos', value: 'todos' },
];

export default function OSTimeSheetRelatorio({ pessoas, categorias }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ periodo: 'mes', pessoa_id: '', os_id: '' });
  const [pesquisaOS, setPesquisaOS] = useState('');

  useEffect(() => {
    carregarEntries();
  }, [filtro.periodo]);

  const carregarEntries = async () => {
    setLoading(true);
    try {
      const agora = new Date();
      let dataInicio = null;

      if (filtro.periodo === 'hoje') {
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();
      } else if (filtro.periodo === 'semana') {
        const d = new Date(agora);
        d.setDate(d.getDate() - 7);
        dataInicio = d.toISOString();
      } else if (filtro.periodo === 'mes') {
        dataInicio = startOfMonth(agora).toISOString();
      } else if (filtro.periodo === 'mes_passado') {
        const mesPassado = subMonths(agora, 1);
        dataInicio = startOfMonth(mesPassado).toISOString();
      }

      // Buscar entradas fechadas
      const data = await base44.entities.TimeSheetEntry.filter({ status: 'closed' }, '-inicio', 500);
      let filtered = data || [];

      if (dataInicio) {
        filtered = filtered.filter(e => e.inicio >= dataInicio);
        if (filtro.periodo === 'mes_passado') {
          const mesPassado = subMonths(new Date(), 1);
          const fimMes = endOfMonth(mesPassado).toISOString();
          filtered = filtered.filter(e => e.inicio <= fimMes);
        }
      }

      setEntries(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtros locais (pessoa, OS)
  const entriesFiltradas = entries.filter(e => {
    if (filtro.pessoa_id && e.pessoa_id !== filtro.pessoa_id) return false;
    if (pesquisaOS && !e.os_codigo?.toLowerCase().includes(pesquisaOS.toLowerCase())) return false;
    return true;
  });

  // Consolidar por OS
  const porOS = {};
  for (const e of entriesFiltradas) {
    if (!porOS[e.os_id]) {
      porOS[e.os_id] = { os_id: e.os_id, os_codigo: e.os_codigo, total_minutos: 0, sessoes: 0, pessoas: new Set() };
    }
    porOS[e.os_id].total_minutos += e.duracao_minutos || 0;
    porOS[e.os_id].sessoes += 1;
    porOS[e.os_id].pessoas.add(e.pessoa_nome);
  }

  const listaOS = Object.values(porOS).sort((a, b) => b.total_minutos - a.total_minutos);
  const totalGeral = entriesFiltradas.reduce((s, e) => s + (e.duracao_minutos || 0), 0);

  const pessoasFiltro = [...new Set(entries.map(e => e.pessoa_id))]
    .map(id => ({ id, nome: entries.find(e => e.pessoa_id === id)?.pessoa_nome || id }));

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filtro.periodo} onValueChange={v => setFiltro(f => ({ ...f, periodo: v }))}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIODOS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filtro.pessoa_id} onValueChange={v => setFiltro(f => ({ ...f, pessoa_id: v === '_todos' ? '' : v }))}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Todas as pessoas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_todos">Todas as pessoas</SelectItem>
            {pessoasFiltro.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder="Filtrar por código OS..."
          value={pesquisaOS}
          onChange={e => setPesquisaOS(e.target.value)}
          className="h-8 px-3 text-xs border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />

        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Total: <strong className="text-slate-900 dark:text-white">{formatarTempo(totalGeral)}</strong></span>
          <span className="text-slate-400">|</span>
          <span>{listaOS.length} OS · {entriesFiltradas.length} sessões</span>
        </div>
      </div>

      {/* Tabela consolidada por OS */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : listaOS.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum registro encontrado para o período selecionado</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">OS</th>
                <th className="text-center p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Sessões</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Pessoas envolvidas</th>
                <th className="text-right p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Tempo total</th>
              </tr>
            </thead>
            <tbody>
              {listaOS.map(item => (
                <tr key={item.os_id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="p-3 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{item.os_codigo || item.os_id}</td>
                  <td className="p-3 text-center text-slate-600 dark:text-slate-400">{item.sessoes}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {[...item.pessoas].map(nome => (
                        <span key={nome} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs">
                          {nome.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-900 dark:text-white">{formatarTempo(item.total_minutos)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-700/50 border-t-2 border-slate-200 dark:border-slate-600">
              <tr>
                <td colSpan={3} className="p-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Total geral:</td>
                <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">{formatarTempo(totalGeral)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Detalhe por sessão */}
      {entriesFiltradas.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-2">
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            Ver sessões individuais ({entriesFiltradas.length})
          </summary>
          <div className="mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">OS</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Pessoa (início)</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Início</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Fim</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Pausado por</th>
                  <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-300">Duração</th>
                  <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {entriesFiltradas.map(e => (
                  <tr key={e.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="p-3 font-mono">{e.os_codigo || e.os_id}</td>
                    <td className="p-3">{e.pessoa_nome}</td>
                    <td className="p-3 text-slate-500">{e.inicio ? format(new Date(e.inicio), 'dd/MM HH:mm', { locale: ptBR }) : '-'}</td>
                    <td className="p-3 text-slate-500">{e.fim ? format(new Date(e.fim), 'dd/MM HH:mm', { locale: ptBR }) : '-'}</td>
                    <td className="p-3">{e.pessoa_nome_pausa || '-'}</td>
                    <td className="p-3 text-right font-medium">{formatarTempo(e.duracao_minutos)}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        e.tipo_encerramento === 'auto_fim_expediente' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        e.tipo_encerramento === 'stop' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        e.tipo_encerramento === 'auto_edicao' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {e.tipo_encerramento === 'auto_fim_expediente' ? 'Auto 18h' :
                         e.tipo_encerramento === 'stop' ? 'Stop' :
                         e.tipo_encerramento === 'auto_edicao' ? 'Edição' : 'Pause'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}