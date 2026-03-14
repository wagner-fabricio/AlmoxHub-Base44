import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart2, PieChart, Map, TrendingUp, Users, Package, Truck, Clock, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Section = ({ title, icon: Icon, color, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-left">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className={`w-5 h-5 ${color}`} />
                {title}
              </CardTitle>
              {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const FormulaBox = ({ label, formula, description }) => (
  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
    {label && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{label}</p>}
    <code className="block text-sm font-mono text-blue-700 dark:text-blue-300 whitespace-pre-wrap">{formula}</code>
    {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
  </div>
);

const MetricRow = ({ name, type, source, notes }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
    <div className="flex-1">
      <span className="font-medium text-sm text-slate-900 dark:text-white">{name}</span>
      {notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notes}</p>}
    </div>
    <div className="flex gap-2 shrink-0">
      {type && <Badge variant="outline" className="text-xs">{type}</Badge>}
      {source && <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{source}</Badge>}
    </div>
  </div>
);

export default function AnalyticsSection() {
  return (
    <div className="space-y-6">

      {/* Visão Geral */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-blue-900 dark:text-blue-100 text-lg mb-2">Dashboard Analytics — Visão Geral</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
          O Dashboard é dividido em <strong>7 abas</strong>, cada uma com métricas, KPIs e gráficos específicos. 
          Todos os dados derivam da entidade <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">OrdemServico</code> combinada com dados de cadastro (Regionais, Almoxarifados, Pessoas, Instalações).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { tab: 'Geral', desc: 'KPIs globais e gráficos de distribuição' },
            { tab: 'Mapas', desc: 'Heatmap geográfico + mapa de instalações' },
            { tab: 'Torre de Controle', desc: 'Pendências críticas em tempo real' },
            { tab: 'Painel Recebimento', desc: 'Métricas de NF, conferência e problemas' },
            { tab: 'Painel Expedição', desc: 'Fluxo OTIF, SLA e volumetria' },
            { tab: 'Produtividade', desc: 'Ranking de líderes e atendentes' },
            { tab: 'Projetos', desc: 'Status e progresso de projetos' },
          ].map(({ tab, desc }) => (
            <div key={tab} className="bg-white dark:bg-slate-800 rounded-lg p-3">
              <p className="font-semibold text-xs text-blue-700 dark:text-blue-300">{tab}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros Globais */}
      <Section title="Sistema de Filtros Globais" icon={Filter} color="text-slate-600">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Os filtros são aplicados a <strong>todas as abas</strong> (exceto Recebimento e Expedição que forçam a categoria correspondente).
          As preferências de filtro são <strong>persistidas por usuário</strong> via <code className="px-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">base44.auth.updateMe({'{ filtros_preferidos: { Dashboard: ... } }'})</code>.
        </p>
        <div className="space-y-2">
          <MetricRow name="Regional" type="Select" source="OrdemServico.regional_id" notes="Filtra os almoxarifados disponíveis em cascata" />
          <MetricRow name="Almoxarifado" type="Select" source="OrdemServico.almoxarifado_id" notes="Cascata dependente da Regional selecionada" />
          <MetricRow name="Categoria" type="Select" source="OrdemServico.categoria_id" notes="Desabilitado nas abas Recebimento/Expedição (fixado na categoria da aba)" />
          <MetricRow name="Subcategoria" type="Select" source="OrdemServico.subcategorias_ids" notes="Filtra apenas subcategorias da categoria ativa" />
          <MetricRow name="Status" type="Select" source="OrdemServico.status" notes="elaboracao | execucao | concluido | cancelado" />
          <MetricRow name="Período" type="Select" source="OrdemServico.created_date" notes="7d / 30d / 90d / mês_atual / customizado / todo_período" />
        </div>
        <FormulaBox
          label="Lógica do filtro de período"
          formula={`if periodo == 'mes_atual':
  startOfMonth ≤ os.created_date ≤ endOfMonth
elif periodo == 'customizado':
  dataInicio ≤ os.created_date ≤ dataFim (23:59:59)
elif periodo in ['7','30','90']:
  os.created_date ≥ subDays(hoje, N)
else:  # 'all'
  sem filtro de data`}
        />
      </Section>

      {/* Aba Geral */}
      <Section title="Aba Geral — KPIs e Gráficos" icon={BarChart2} color="text-blue-600">
        <div className="space-y-4">

          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">KPIs Primários (Cards coloridos)</p>
            <div className="space-y-2">
              <MetricRow name="Total de OS" type="Contagem" source="filteredOrdens.length" notes="Quantidade de OS que passam por todos os filtros aplicados" />
              <MetricRow name="Em Execução" type="Contagem" source="filteredOrdens" notes="OS onde status === 'execucao'. Exibe delta % vs ontem." />
              <MetricRow name="Concluídas" type="Contagem" source="filteredOrdens" notes="OS onde status === 'concluido'. Exibe delta % vs ontem." />
              <MetricRow name="Progresso Médio" type="Média %" source="OrdemServico.progresso" notes="Média aritmética do campo progresso (0–100) de todas as OS filtradas" />
            </div>
            <FormulaBox
              label="Fórmula — Progresso Médio"
              formula={`avgProgress = Σ(os.progresso) / totalOS
Delta % = ((hoje - ontem) / ontem) × 100`}
              description="Compara com as OS criadas até ontem (created_date < início do dia de ontem)"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">KPIs Secundários</p>
            <div className="space-y-2">
              <MetricRow name="Taxa de Cumprimento (On-Time Rate)" type="Percentual" source="OrdemServico.prazo / data_conclusao" />
              <MetricRow name="Tempo Médio de Resolução" type="Dias" source="OrdemServico.data_inicial / data_conclusao" />
              <MetricRow name="Em Elaboração" type="Contagem" source="filteredOrdens" notes="OS onde status === 'elaboracao' — aguardando início" />
            </div>
            <FormulaBox
              label="Fórmula — Taxa de Cumprimento (On-Time Rate)"
              formula={`osComPrazo = filteredOrdens com prazo definido

onTimeCount = osComPrazo onde:
  (status == 'concluido' && data_conclusao ≤ prazo)
  OU
  (status != 'concluido' && prazo ≥ hoje)

onTimeRate = (onTimeCount / osComPrazo.length) × 100`}
              description="OS concluídas a tempo + OS em aberto com prazo ainda válido"
            />
            <FormulaBox
              label="Fórmula — Tempo Médio de Resolução"
              formula={`osConcluidas = filteredOrdens onde status == 'concluido' && data_conclusao existe

avgDays = Σ( |differenceInDays(data_conclusao, data_inicial || created_date)| ) / osConcluidas.length`}
              description="Usa data_inicial se disponível, senão usa created_date como ponto de partida"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gráficos</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium text-sm text-slate-900 dark:text-white mb-1">OS por Regional (BarChart empilhado)</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Agrupa OS filtradas por <code>regional_id</code>, com barras empilhadas por status (elaboracao, execucao, concluido, cancelado). Eixo X = sigla da regional. Apenas regionais com total {'>'} 0 são exibidas.</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium text-sm text-slate-900 dark:text-white mb-1">OS por Status (PieChart donut)</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Distribuição proporcional dos 4 status. Anel com <code>innerRadius=60, outerRadius=100</code>. Rótulos com nome e percentual inline. Apenas status com valor {'>'} 0.</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium text-sm text-slate-900 dark:text-white mb-1">OS por Categoria (BarChart horizontal)</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Layout <code>vertical</code> do Recharts (eixo Y = categoria, eixo X = total). Exibe todas categorias com pelo menos 1 OS.</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium text-sm text-slate-900 dark:text-white mb-1">Top 5 Almoxarifados (Progress bars)</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Ordenados por total de OS (desc). Barra proporcional ao maior valor: <code>width = (total / max) × 100%</code>. Posição 1=azul, 2=laranja, 3=cinza.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Aba Mapas */}
      <Section title="Aba Mapas — Heatmap e Instalações" icon={Map} color="text-orange-500">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mapa de Calor — Expedições (React Leaflet)</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Filtra OS da categoria Expedição e agrupa por instalação de <strong>origem</strong> ou <strong>destino</strong> (selecionável). 
              Cada instalação com coordenadas GPS é representada por um círculo proporcional ao valor selecionado.
            </p>
            <div className="space-y-2">
              <MetricRow name="Qtd OS" type="Critério" notes="value = osDestino.length para a instalação" />
              <MetricRow name="Valor Total" type="Critério" notes="value = Σ(os.itens_documento[].r_total)" />
              <MetricRow name="Peso Total" type="Critério" notes="value = Σ(os.volumes[].peso_bruto)" />
              <MetricRow name="Qtd Itens" type="Critério" notes="value = Σ(os.itens_documento[].quantidade)" />
            </div>
            <FormulaBox
              label="Fórmula — Raio do círculo"
              formula={`normalized = value / maxValue   // 0.0 a 1.0
radius = 5000 + normalized × (100000 - 5000)  // em metros

// Cor por intensidade normalizada:
> 0.7 → vermelho  (#dc2626)
> 0.4 → laranja   (#f97316)
> 0.2 → amarelo   (#eab308)
≤ 0.2 → verde     (#22c55e)`}
              description="maxValue é o maior valor entre todas as instalações exibidas"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mapa de Instalações e Almoxarifados</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Exibe markers customizados (divIcon SVG) para cada instalação/almoxarifado com coordenadas GPS. Filtrável por tipo via checkboxes.
            </p>
            <div className="space-y-2">
              <MetricRow name="Usinas" type="Marker verde" source="Instalacao.classificacao = 'Usina'" />
              <MetricRow name="Subestações" type="Marker azul" source="Instalacao.classificacao = 'Subestação'" />
              <MetricRow name="Outros" type="Marker cinza" source="Instalacao.classificacao = 'Outros'" />
              <MetricRow name="Almoxarifados" type="Marker roxo" source="Almoxarifado (entidade separada)" />
            </div>
          </div>
        </div>
      </Section>

      {/* Torre de Controle */}
      <Section title="Torre de Controle — KPIs Operacionais" icon={TrendingUp} color="text-red-600">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Foco em OS <strong>em andamento</strong> (elaboracao + execucao). Exibe pendências críticas, SLA de prazo e distribuição por almoxarifado.
        </p>
        <div className="space-y-2">
          <MetricRow name="OS Fora do Prazo" type="Contagem" source="OrdemServico.prazo" notes="OS com prazo < hoje e status ≠ concluido/cancelado. Usa helper isForaPrazo()." />
          <MetricRow name="OS No Prazo" type="Contagem" source="OrdemServico.prazo" notes="OS com prazo ≥ hoje ou status == concluido. Usa helper isNoPrazo()." />
          <MetricRow name="Itens NF Compra" type="Contagem" source="itens_documento + nfe_itens_conferencia" notes="Σ quantidade de itens de todos os tipos de OS filtradas" />
          <MetricRow name="Tempo Médio Regularização" type="Dias" source="OrdemServico.data_inicial + prazo" notes="Diferença média entre data_inicial e prazo para OS com ambos preenchidos" />
        </div>
        <FormulaBox
          label="Helpers de prazo (prazoHelpers.js)"
          formula={`isForaPrazo(os):
  os.prazo && new Date(os.prazo) < hoje
  && os.status ∉ ['concluido', 'cancelado']

isNoPrazo(os):
  !os.prazo 
  || new Date(os.prazo) >= hoje 
  || os.status == 'concluido'`}
        />
      </Section>

      {/* Painel Recebimento */}
      <Section title="Painel Recebimento — Métricas de NF e Conferência" icon={Package} color="text-purple-600">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Exclusivo para OS da categoria <strong>Recebimento</strong>. Métricas sobre notas fiscais, conferência de materiais e problemas identificados.
        </p>
        <div className="space-y-2">
          <MetricRow name="Total OS Recebimento" type="Contagem" source="OrdemServico.categoria_id = categoriaRecebimento.id" />
          <MetricRow name="OS com Problema" type="Contagem" source="OrdemServico.problema_recebimento = true" />
          <MetricRow name="Itens Conferidos" type="Contagem" source="nfe_itens_conferencia[].status_conferencia" notes="Itens com status = 'completo'" />
          <MetricRow name="Itens Divergentes" type="Contagem" source="nfe_itens_conferencia[].status_conferencia" notes="Itens com status ≠ 'completo' e ≠ 'pendente'" />
          <MetricRow name="Problemas por Tipo" type="Gráfico Barras" source="problemas_recebimento_ids + ProblemaRecebimento" notes="Conta ocorrências de cada problema em todas as OS de recebimento" />
        </div>
        <FormulaBox
          label="Taxa de Conformidade"
          formula={`itensCompletos = nfe_itens_conferencia filtrados por status == 'completo'
taxaConformidade = (itensCompletos / totalItens) × 100`}
        />
      </Section>

      {/* Painel Expedição */}
      <Section title="Painel Expedição — OTIF e SLA" icon={Truck} color="text-amber-600">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Exclusivo para OS da categoria <strong>Expedição</strong>. Inclui indicador OTIF, volumetria e análise de fluxo de separação.
        </p>
        <div className="space-y-2">
          <MetricRow name="OTIF" type="Percentual" source="OrdemServico.data_entrega + data_necessidade" notes="On Time In Full: OS entregues no prazo e completas" />
          <MetricRow name="Total Itens Expedidos" type="Contagem" source="osExpedicao[].itens_documento.length" />
          <MetricRow name="Valor Total Expedido" type="R$" source="osExpedicao[].itens_documento[].r_total" notes="Σ r_total de todos os itens das OS de expedição filtradas" />
          <MetricRow name="Tempo Médio Atendimento" type="Dias" source="OrdemServico.data_migo + data_reserva" notes="Apenas OS concluídas com ambas as datas preenchidas" />
        </div>
        <FormulaBox
          label="Fórmula — OTIF (On Time In Full)"
          formula={`osExpedicao = filteredOrdens com categoria == Expedição

osOnTime = osExpedicao onde:
  data_entrega ≤ data_necessidade

OTIF = (osOnTime.length / osExpedicao.length) × 100`}
          description="Considera apenas OS com data_necessidade e data_entrega preenchidas"
        />
        <FormulaBox
          label="Fórmula — Tempo Médio de Atendimento"
          formula={`osConcluidas = osExpedicao onde:
  status == 'concluido' && data_migo && data_reserva

tempoMedio = Σ(differenceInDays(data_migo, data_reserva)) / osConcluidas.length`}
          description="Mede o lead time entre a reserva do material e o MIGO de saída"
        />
      </Section>

      {/* Produtividade */}
      <Section title="Painel Produtividade — Ranking de Pessoas" icon={Users} color="text-emerald-600">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Análise de performance individual. Agrupa OS por <code>lider_id</code> e por <code>atendente_nome</code>, calculando taxa de conclusão e tempo médio.
        </p>

        <div className="space-y-2">
          <MetricRow name="Ranking de Líderes" type="BarChart horizontal" source="OrdemServico.lider_id → Pessoa" notes="Total OS, OS concluídas, progresso médio e OS atrasadas por líder" />
          <MetricRow name="Ranking de Atendentes" type="BarChart horizontal" source="OrdemServico.atendente_nome" notes="Agrupa por nome textual do atendente" />
          <MetricRow name="OSProductivityRanking" type="Cards" source="filteredOrdens + pessoas" notes="Top performers: líder com mais OS concluídas, menor tempo médio, maior taxa no prazo" />
        </div>

        <FormulaBox
          label="Métricas por Líder"
          formula={`grupo = filteredOrdens agrupadas por lider_id

taxaConclusao(lider) = osConcluidas / totalOS × 100

tempoMedio(lider) = Σ(|data_conclusao - data_inicial|) / osConcluidas
  (apenas OS com data_conclusao)

osAtrasadas(lider) = OS onde prazo < hoje && status ∉ ['concluido','cancelado']`}
        />
      </Section>

      {/* Customização */}
      <Section title="Personalização do Dashboard (DashboardCustomizer)" icon={BarChart2} color="text-slate-500">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          O usuário pode ocultar/exibir widgets individualmente. As preferências são salvas em <code className="px-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">user.dashboard_visible_widgets</code> (array de IDs de widgets).
        </p>
        <div className="space-y-2">
          {[
            { id: 'kpis', desc: 'Cards KPI primários (Total OS, Em Execução, Concluídas, Progresso)' },
            { id: 'insights', desc: 'Bloco de insights automáticos gerados pelo DashboardInsights' },
            { id: 'kpis-secondary', desc: 'KPIs secundários (Taxa Cumprimento, Tempo Resolução, Elaboração)' },
            { id: 'os-regional', desc: 'Gráfico de barras — OS por Regional' },
            { id: 'os-status', desc: 'Gráfico de rosca — OS por Status' },
            { id: 'os-categoria', desc: 'Gráfico de barras horizontal — OS por Categoria' },
            { id: 'top-almoxarifados', desc: 'Ranking Top 5 Almoxarifados' },
            { id: 'esforco-pessoa', desc: 'Ranking de Líderes (aba Produtividade)' },
          ].map(({ id, desc }) => (
            <MetricRow key={id} name={id} type="widget_id" notes={desc} />
          ))}
        </div>
        <FormulaBox
          label="Lógica de visibilidade"
          formula={`isWidgetVisible(widgetId):
  saved = user.dashboard_visible_widgets
  if !saved || !Array.isArray(saved):
    return true  // todos visíveis por padrão
  return saved.includes(widgetId)`}
          description="Se o array não existir (usuário novo), todos os widgets são exibidos"
        />
      </Section>

      {/* Paleta de cores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="flex gap-1">
              {['#0000FF','#FF6B00','#10B981','#A0B4D2','#0A003C','#EC4899'].map(c => (
                <div key={c} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            Paleta de Cores dos Gráficos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { color: '#0000FF', name: 'Azul Axia', uso: 'Status Execução, barras principais, KPI Total OS' },
              { color: '#FF6B00', name: 'Laranja Axia', uso: 'KPI Em Execução, 2º lugar ranking, valor/destaque' },
              { color: '#10B981', name: 'Verde Emerald', uso: 'Status Concluído, KPI Concluídas, taxa positiva' },
              { color: '#A0B4D2', name: 'Azul Claro', uso: 'KPI Progresso Médio, 3º lugar ranking' },
              { color: '#0A003C', name: 'Azul Escuro Axia', uso: '5º item da paleta de gráficos de pizza' },
              { color: '#EC4899', name: 'Rosa', uso: '6º item da paleta de gráficos de pizza' },
              { color: '#ef4444', name: 'Vermelho', uso: 'Status Cancelado, heatmap muito alto, alertas' },
              { color: '#64748b', name: 'Cinza Slate', uso: 'Status Elaboração, textos secundários' },
            ].map(({ color, name, uso }) => (
              <div key={color} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="w-6 h-6 rounded shrink-0 mt-0.5 border border-slate-200" style={{ backgroundColor: color }} />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{uso}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}