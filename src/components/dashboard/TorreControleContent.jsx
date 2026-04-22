import React, { useState } from 'react';
import TorreControleTab from './TorreControleTab';
import KanbanExecucao from './KanbanExecucao';
import ExportTorreControleButton from './ExportTorreControleButton';
import BurndownBurnupChart from './BurndownBurnupChart';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

const INDICADORES = [
  // ── Seção Volumetrias ──────────────────────────────────────────────────────
  {
    secao: 'Volumetrias',
    itens: [
      {
        num: 1, sigla: 'Nº de Itens', titulo: 'Total de Itens Movimentados',
        desc: 'Soma de todos os itens presentes nas OS filtradas, incluindo itens de documentos de expedição (itens_documento) e itens conferidos em recebimento (nfe_itens_conferencia).',
        formula: 'Nº Itens = Σ(itens_documento.length) + Σ(nfe_itens_conferencia.length)',
        exemplo: '10 OS com 5 itens cada → 50 itens'
      },
      {
        num: 2, sigla: 'Valor Total', titulo: 'Valor Total dos Materiais',
        desc: 'Soma do valor monetário de todos os materiais nas OS filtradas, considerando tanto expedição (r_total por item) quanto recebimento (valor_total por item conferido).',
        formula: 'Valor = Σ(itens_documento.r_total) + Σ(nfe_itens_conferencia.valor_total)',
        exemplo: 'R$ 150k em expedição + R$ 80k em recebimento = R$ 230k'
      },
      {
        num: 3, sigla: 'Tempo Médio Previsto', titulo: 'Ciclo Médio de Regularização',
        desc: 'Tempo médio em dias entre a data de início (data_inicial) e o prazo (prazo) das OS que possuem ambas as datas preenchidas.',
        formula: 'TMR = Média(prazo − data_inicial) em dias',
        exemplo: 'OS A: 5d, OS B: 7d, OS C: 3d → TMR = 5 dias'
      },
      {
        num: 4, sigla: 'Total de OS', titulo: 'Quantidade Total de Ordens de Serviço',
        desc: 'Contagem simples de todas as OS retornadas após aplicação dos filtros de regional, almoxarifado, categoria, status e período.',
        formula: 'Total OS = COUNT(filteredOrdens)',
        exemplo: 'Filtro 30 dias, regional NE → 142 OS'
      },
    ]
  },
  // ── Resultados Mensais - OS ────────────────────────────────────────────────
  {
    secao: 'Resultados Mensais — Ordens de Serviço',
    itens: [
      {
        num: 5, sigla: 'No Prazo (OS)', titulo: 'OS Dentro do Prazo',
        desc: 'OS consideradas "no prazo": pendentes com prazo futuro, ou concluídas antes/na data do prazo.',
        formula: 'No Prazo = OS com status ≠ concluído E prazo ≥ hoje, OU status = concluído E data_conclusao ≤ prazo',
        exemplo: '80 de 100 OS no prazo → 80%'
      },
      {
        num: 6, sigla: 'Fora do Prazo (OS)', titulo: 'OS Fora do Prazo',
        desc: 'OS que ultrapassaram a data de prazo sem conclusão, ou foram concluídas após o prazo estabelecido.',
        formula: 'Fora do Prazo = OS com prazo < hoje E status ≠ concluído, OU status = concluído E data_conclusao > prazo',
        exemplo: '20 de 100 OS fora do prazo → 20%'
      },
      {
        num: 7, sigla: 'Gráfico de Barras — Qtd OS', titulo: 'Total de OS por Prazo — Ano Corrente',
        desc: 'Barras empilhadas mensais mostrando a quantidade de OS No Prazo (verde) e Fora do Prazo (vermelho) em cada mês do ano corrente. O percentual exibido dentro de cada segmento representa a proporção daquele status em relação ao total do mês.',
        formula: '% No Prazo (mês) = (OS No Prazo no mês / Total OS no mês) × 100',
        exemplo: 'Março: 30 No Prazo e 10 Fora do Prazo → barra mostra 75% / 25%'
      },
      {
        num: 8, sigla: 'Rosca — Resumo Anual OS', titulo: 'Percentual Anual de Cumprimento de Prazo',
        desc: 'Gráfico de rosca exibindo a proporção acumulada no ano entre OS No Prazo e Fora do Prazo, considerando apenas OS criadas no ano corrente.',
        formula: '% Anual No Prazo = (Total No Prazo no ano / Total OS no ano) × 100',
        exemplo: '320 No Prazo e 80 Fora de 400 → 80% no centro da rosca'
      },
    ]
  },
  // ── Evolução Mensal — Valores ──────────────────────────────────────────────
  {
    secao: 'Evolução Mensal — Valores por Prazo',
    itens: [
      {
        num: 9, sigla: 'Gráfico de Barras — Valores', titulo: 'Valor Total de Materiais por Prazo — Ano Corrente',
        desc: 'Mesmo conceito do gráfico de OS, porém agora a altura de cada segmento representa o valor monetário total dos materiais (R$) das OS agrupadas naquele mês e classificadas por prazo.',
        formula: 'Valor No Prazo (mês) = Σ(itens_documento.r_total + nfe_itens_conferencia.valor_total) das OS No Prazo criadas no mês',
        exemplo: 'Fev: R$ 200k No Prazo + R$ 50k Fora do Prazo → barra mostra 80% / 20%'
      },
      {
        num: 10, sigla: 'Rosca — Resumo Anual Valores', titulo: 'Distribuição Anual do Valor por Prazo',
        desc: 'Rosca mostrando qual fatia do valor total anual movimentado corresponde a OS entregues no prazo e qual corresponde a OS fora do prazo.',
        formula: '% Valor No Prazo = (R$ No Prazo no ano / R$ Total no ano) × 100',
        exemplo: 'R$ 1,6M No Prazo de R$ 2M total → 80% no centro da rosca'
      },
    ]
  },
  // ── Evolução Mensal — Peso ─────────────────────────────────────────────────
  {
    secao: 'Evolução Mensal — Peso por Prazo',
    itens: [
      {
        num: 11, sigla: 'Gráfico de Barras — Peso', titulo: 'Peso Total de Materiais por Prazo — Ano Corrente',
        desc: 'Barras empilhadas mensais onde a altura representa o peso bruto total (kg) dos volumes registrados nas OS, segmentado entre No Prazo e Fora do Prazo.',
        formula: 'Peso No Prazo (mês) = Σ(volumes.peso_bruto) das OS No Prazo criadas no mês',
        exemplo: 'Jan: 5.000 kg No Prazo + 1.000 kg Fora do Prazo → 83% / 17%'
      },
      {
        num: 12, sigla: 'Rosca — Resumo Anual Peso', titulo: 'Distribuição Anual do Peso por Prazo',
        desc: 'Gráfico de rosca acumulando o peso bruto anual total e mostrando a proporção No Prazo vs. Fora do Prazo.',
        formula: '% Peso No Prazo = (kg No Prazo no ano / kg Total no ano) × 100',
        exemplo: '40t No Prazo de 50t total → 80% no centro da rosca'
      },
    ]
  },
  // ── Kanban de Execução ─────────────────────────────────────────────────────
  {
    secao: 'Kanban de Execução',
    itens: [
      {
        num: 13, sigla: 'Kanban', titulo: 'Quadro Kanban de OS em Execução',
        desc: 'Visão Kanban das OS com status "execução", agrupadas por categoria. Cada card exibe o código da OS, progresso (%), prazo e lider responsável. OS próximas ao vencimento são destacadas em amarelo; OS vencidas em vermelho.',
        formula: 'Exibição: OS com status = "execucao", ordenadas por prazo crescente dentro de cada coluna',
        exemplo: 'Coluna "Expedição" com 3 OS, uma delas destacada em vermelho por estar vencida há 2 dias'
      },
    ]
  },
  // ── Burndown & Burnup ──────────────────────────────────────────────────────
  {
    secao: 'Velocidade & Progresso (Burndown / Burnup)',
    itens: [
      {
        num: 14, sigla: 'Burndown', titulo: 'Gráfico de Burndown — OS Restantes',
        desc: 'Mostra a evolução real da quantidade de OS ainda abertas (não concluídas) ao longo do tempo, comparada com a linha ideal de conclusão linear. O eixo Y representa o número de OS abertas; o eixo X as datas dentro do período filtrado.',
        formula: 'OS Abertas (dia) = Total de OS − OS com data_conclusao ≤ dia; Ideal = Total × (1 − (dia − início) / duração)',
        exemplo: 'Início com 100 OS abertas; no dia 15 o ideal seria 50, mas o real é 70 → atraso visível'
      },
      {
        num: 15, sigla: 'Burnup', titulo: 'Gráfico de Burnup — OS Concluídas',
        desc: 'Mostra a evolução acumulada de OS concluídas ao longo do tempo (linha real) versus o escopo total de OS (linha de meta). Quando a linha real toca a linha de meta, todas as OS foram concluídas.',
        formula: 'OS Concluídas (dia) = COUNT(OS com data_conclusao ≤ dia); Meta = Total de OS (linha horizontal)',
        exemplo: 'Meta: 100 OS. Dia 20: 60 concluídas → linha real abaixo da meta → ritmo insuficiente'
      },
    ]
  },
];

function HelpModalTorreControle({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            Guia de Indicadores — Torre de Controle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8 text-sm">
          {INDICADORES.map(({ secao, itens }) => (
            <div key={secao}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-blue-500 shrink-0" />
                {secao}
              </h2>
              <div className="space-y-3">
                {itens.map(item => (
                  <div key={item.num} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold shrink-0">{item.num}</span>
                      <span className="text-blue-700 dark:text-blue-400">{item.sigla}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-normal">— {item.titulo}</span>
                    </h3>
                    <p className="text-slate-500 text-xs mb-2">{item.desc}</p>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-700 dark:text-slate-300 mb-2">{item.formula}</div>
                    <p className="text-xs text-slate-400 italic">Exemplo: {item.exemplo}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TorreControleContent({
  filteredOrdens,
  tempoMedioRegularizacaoCompra,
  numItensNFCompra,
  pessoas = [],
  categorias = [],
  regionais = [],
  almoxarifados = [],
  filters = {}
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowHelp(true)} className="gap-2">
          <HelpCircle className="w-4 h-4 text-blue-500" />
          Entender os indicadores
        </Button>
        <ExportTorreControleButton
          filteredOrdens={filteredOrdens}
          pessoas={pessoas}
          categorias={categorias}
          regionais={regionais}
          almoxarifados={almoxarifados}
        />
      </div>
      <HelpModalTorreControle open={showHelp} onClose={() => setShowHelp(false)} />
      <TorreControleTab 
        filteredOrdens={filteredOrdens}
        tempoMedioRegularizacaoCompra={tempoMedioRegularizacaoCompra}
        numItensNFCompra={numItensNFCompra}
      />
      <KanbanExecucao ordens={filteredOrdens} />
      <BurndownBurnupChart filteredOrdens={filteredOrdens} filters={filters} />
    </div>
  );
}