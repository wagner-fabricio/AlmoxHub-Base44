import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, X, FileText, Loader2 } from 'lucide-react';

const statusLabels = {
  elaboracao: 'Em Elaboração',
  execucao: 'Em Execução',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
};

export default function RelatorioFilters({
  filters,
  setFilters,
  regionais,
  almoxarifados,
  categorias,
  subcategorias,
  onGerar,
  loading
}) {
  const update = (patch) => setFilters({ ...filters, ...patch });

  const regionalSel = Array.isArray(filters.regional) ? filters.regional : [];
  const almoxSel = Array.isArray(filters.almoxarifado) ? filters.almoxarifado : [];
  const categoriaSel = Array.isArray(filters.categoria) ? filters.categoria : [];
  const subcatSel = Array.isArray(filters.subcategoria) ? filters.subcategoria : [];
  const statusSel = Array.isArray(filters.status) ? filters.status : [];

  const almoxOpts = almoxarifados
    .filter(a => regionalSel.length === 0 || regionalSel.includes(a.regional_id))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const subcatOpts = subcategorias
    .filter(s => categoriaSel.length === 0 || categoriaSel.includes(s.categoria_id))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const limparTudo = () => setFilters({
    regional: [], almoxarifado: [], categoria: [], subcategoria: [],
    status: [], periodo: 'all', dataInicio: '', dataFim: '', orientacao: filters.orientacao || 'retrato'
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
        {/* Regional */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-between w-full h-9 rounded-md border border-input bg-white dark:bg-slate-800 px-3 text-sm">
              <span className={`truncate ${regionalSel.length === 0 ? 'text-slate-500' : ''}`}>
                {regionalSel.length === 0 ? 'Todas Regionais' : regionalSel.length === 1 ? regionais.find(r => r.id === regionalSel[0])?.sigla : `${regionalSel.length} regionais`}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50 ml-2 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 max-h-80 overflow-y-auto" align="start">
            <div className="space-y-1">
              {[...regionais].sort((a, b) => a.sigla.localeCompare(b.sigla)).map(r => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-slate-50">
                  <Checkbox
                    checked={regionalSel.includes(r.id)}
                    onCheckedChange={() => {
                      const next = regionalSel.includes(r.id) ? regionalSel.filter(s => s !== r.id) : [...regionalSel, r.id];
                      const validAlmox = almoxarifados.filter(a => next.length === 0 || next.includes(a.regional_id)).map(a => a.id);
                      update({ regional: next, almoxarifado: almoxSel.filter(a => validAlmox.includes(a)) });
                    }}
                  />
                  <span className="text-sm">{r.sigla}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Almoxarifado */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-between w-full h-9 rounded-md border border-input bg-white dark:bg-slate-800 px-3 text-sm">
              <span className={`truncate ${almoxSel.length === 0 ? 'text-slate-500' : ''}`}>
                {almoxSel.length === 0 ? 'Todos Almoxarifados' : almoxSel.length === 1 ? almoxOpts.find(a => a.id === almoxSel[0])?.nome : `${almoxSel.length} almoxarifados`}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50 ml-2 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2 max-h-80 overflow-y-auto" align="start">
            <div className="space-y-1">
              {almoxOpts.map(a => (
                <label key={a.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-slate-50">
                  <Checkbox
                    checked={almoxSel.includes(a.id)}
                    onCheckedChange={() => {
                      const next = almoxSel.includes(a.id) ? almoxSel.filter(s => s !== a.id) : [...almoxSel, a.id];
                      update({ almoxarifado: next });
                    }}
                  />
                  <span className="text-sm">{a.nome}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Categoria */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-between w-full h-9 rounded-md border border-input bg-white dark:bg-slate-800 px-3 text-sm">
              <span className={`truncate ${categoriaSel.length === 0 ? 'text-slate-500' : ''}`}>
                {categoriaSel.length === 0 ? 'Todas Categorias' : categoriaSel.length === 1 ? categorias.find(c => c.id === categoriaSel[0])?.nome : `${categoriaSel.length} categorias`}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50 ml-2 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 max-h-80 overflow-y-auto" align="start">
            <div className="space-y-1">
              {[...categorias].sort((a, b) => a.nome.localeCompare(b.nome)).map(c => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-slate-50">
                  <Checkbox
                    checked={categoriaSel.includes(c.id)}
                    onCheckedChange={() => {
                      const next = categoriaSel.includes(c.id) ? categoriaSel.filter(s => s !== c.id) : [...categoriaSel, c.id];
                      update({ categoria: next, subcategoria: [] });
                    }}
                  />
                  <span className="text-sm">{c.nome}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Subcategoria */}
        <Popover>
          <PopoverTrigger asChild>
            <button disabled={categoriaSel.length === 0} className="flex items-center justify-between w-full h-9 rounded-md border border-input bg-white dark:bg-slate-800 px-3 text-sm disabled:opacity-50">
              <span className={`truncate ${subcatSel.length === 0 ? 'text-slate-500' : ''}`}>
                {subcatSel.length === 0 ? 'Todas Subcategorias' : `${subcatSel.length} subcategorias`}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50 ml-2 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 max-h-80 overflow-y-auto" align="start">
            <div className="space-y-1">
              {subcatOpts.length === 0 ? (
                <p className="text-xs text-slate-400 px-2 py-1.5">Nenhuma subcategoria</p>
              ) : subcatOpts.map(s => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-slate-50">
                  <Checkbox
                    checked={subcatSel.includes(s.id)}
                    onCheckedChange={() => {
                      const next = subcatSel.includes(s.id) ? subcatSel.filter(x => x !== s.id) : [...subcatSel, s.id];
                      update({ subcategoria: next });
                    }}
                  />
                  <span className="text-sm">{s.nome}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Status */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-between w-full h-9 rounded-md border border-input bg-white dark:bg-slate-800 px-3 text-sm">
              <span className={`truncate ${statusSel.length === 0 ? 'text-slate-500' : ''}`}>
                {statusSel.length === 0 ? 'Todos Status' : statusSel.length === 1 ? statusLabels[statusSel[0]] : `${statusSel.length} status`}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50 ml-2 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2" align="start">
            <div className="space-y-1">
              {Object.entries(statusLabels).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-slate-50">
                  <Checkbox
                    checked={statusSel.includes(key)}
                    onCheckedChange={() => {
                      const next = statusSel.includes(key) ? statusSel.filter(s => s !== key) : [...statusSel, key];
                      update({ status: next });
                    }}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Período */}
        <div className="flex gap-2">
          <Select value={filters.periodo} onValueChange={(v) => update({ periodo: v })}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="mes_atual">Mês atual</SelectItem>
              <SelectItem value="customizado">Customizado</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={limparTudo} className="text-slate-500 hover:text-slate-700" title="Limpar filtros">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {filters.periodo === 'customizado' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Data Início</label>
            <Input type="date" value={filters.dataInicio} onChange={(e) => update({ dataInicio: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Data Fim</label>
            <Input type="date" value={filters.dataFim} onChange={(e) => update({ dataFim: e.target.value })} />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Orientação:</span>
          <div className="flex gap-2">
            <button
              onClick={() => update({ orientacao: 'retrato' })}
              className={`px-3 py-1.5 text-sm rounded-md border ${filters.orientacao === 'retrato' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'border-slate-200 text-slate-600'}`}
            >Retrato</button>
            <button
              onClick={() => update({ orientacao: 'paisagem' })}
              className={`px-3 py-1.5 text-sm rounded-md border ${filters.orientacao === 'paisagem' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'border-slate-200 text-slate-600'}`}
            >Paisagem</button>
          </div>
        </div>
        <Button
          onClick={onGerar}
          disabled={loading}
          className="text-white font-semibold px-6 py-2.5 h-auto"
          style={{ backgroundColor: '#0000FF' }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando relatório com IA...</>
          ) : (
            <><FileText className="w-4 h-4 mr-2" /> Gerar Relatório</>
          )}
        </Button>
      </div>
    </div>
  );
}