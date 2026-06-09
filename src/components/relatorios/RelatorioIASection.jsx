import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ThumbsUp, ThumbsDown, AlertTriangle, Lightbulb, Users, Award } from 'lucide-react';

const ListSection = ({ icon: Icon, title, items, color, bgColor }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bgColor }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <ul className="space-y-2">
      {(items || []).map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-bold shrink-0" style={{ color }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default function RelatorioIASection({ analise }) {
  if (!analise) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0000FF 0%, #ec4899 100%)' }}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Análise Executiva por IA</h2>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Especialista em Logística & RH</span>
      </div>

      {/* Sumário */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" /> Sumário Executivo
          </h3>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{analise.sumario_executivo}</p>
        </CardContent>
      </Card>

      {/* Destaques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListSection icon={ThumbsUp} title="Destaques Positivos" items={analise.destaques_positivos} color="#10b981" bgColor="#10b98115" />
        <ListSection icon={ThumbsDown} title="Destaques Negativos" items={analise.destaques_negativos} color="#ef4444" bgColor="#ef444415" />
      </div>

      {/* Atenção e Sugestões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListSection icon={AlertTriangle} title="Pontos de Atenção" items={analise.pontos_atencao} color="#f59e0b" bgColor="#f59e0b15" />
        <ListSection icon={Lightbulb} title="Sugestões de Melhoria" items={analise.sugestoes_melhorias} color="#0000FF" bgColor="#0000FF15" />
      </div>

      {/* Produtividade & RH */}
      <Card className="bg-white dark:bg-slate-800">
        <CardContent className="p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" /> Análise de Produtividade e Recursos Humanos
          </h3>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{analise.analise_produtividade_rh}</p>
        </CardContent>
      </Card>

      {/* Conclusão */}
      <Card className="border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #0A003C 0%, #0000FF 100%)' }}>
        <CardContent className="p-6">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" /> Conclusão Estratégica
          </h3>
          <p className="text-white/90 leading-relaxed whitespace-pre-line">{analise.conclusao_estrategica}</p>
        </CardContent>
      </Card>
    </div>
  );
}