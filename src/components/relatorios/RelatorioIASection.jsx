import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ThumbsUp, ThumbsDown, AlertTriangle, Lightbulb, Users, Award, Cog, FolderKanban } from 'lucide-react';

const ListSection = ({ icon: Icon, title, items, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4" style={{ color }} />
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <ul className="space-y-2">
      {(items || []).map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold shrink-0" style={{ color }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const TextBlock = ({ icon: Icon, title, text, iconColor }) => (
  <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
    <CardContent className="p-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-base tracking-tight">
        <Icon className="w-4 h-4" style={{ color: iconColor }} /> {title}
      </h3>
      <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line text-sm">{text}</p>
    </CardContent>
  </Card>
);

export default function RelatorioIASection({ analise }) {
  if (!analise) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Análise Executiva</h2>

      {/* Sumário */}
      <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700 shadow-none">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-base tracking-tight">
            <Award className="w-4 h-4 text-slate-700 dark:text-slate-300" /> Sumário Executivo
          </h3>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line text-sm">{analise.sumario_executivo}</p>
        </CardContent>
      </Card>

      {/* Destaques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListSection icon={ThumbsUp} title="Destaques Positivos" items={analise.destaques_positivos} color="#10b981" />
        <ListSection icon={ThumbsDown} title="Destaques Negativos" items={analise.destaques_negativos} color="#ef4444" />
      </div>

      {/* Atenção e Sugestões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListSection icon={AlertTriangle} title="Pontos de Atenção" items={analise.pontos_atencao} color="#f59e0b" />
        <ListSection icon={Lightbulb} title="Sugestões de Melhoria" items={analise.sugestoes_melhorias} color="#0000FF" />
      </div>

      {/* Recomendações de Engenharia de Produção */}
      {analise.recomendacoes_engenharia_producao && (
        <ListSection icon={Cog} title="Recomendações de Engenharia de Produção" items={analise.recomendacoes_engenharia_producao} color="#6366f1" />
      )}

      {/* Análise de Projetos */}
      {analise.analise_projetos && (
        <TextBlock icon={FolderKanban} title="Análise de Projetos" text={analise.analise_projetos} iconColor="#0000FF" />
      )}

      {/* Produtividade */}
      <TextBlock icon={Users} title="Análise de Produtividade" text={analise.analise_produtividade_rh} iconColor="#6366f1" />

      {/* Conclusão */}
      <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <CardContent className="p-6">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-base tracking-tight">
            <Sparkles className="w-4 h-4 text-amber-300" /> Conclusão Estratégica
          </h3>
          <p className="text-white/90 leading-relaxed whitespace-pre-line text-sm">{analise.conclusao_estrategica}</p>
        </CardContent>
      </Card>
    </div>
  );
}