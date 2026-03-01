import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Code, Workflow, CheckSquare, Settings, Shield, GitBranch, Lock, Wrench, Database } from 'lucide-react';
import ArquiteturaSection from '@/components/documentacao/ArquiteturaSection';
import RecursosSection from '@/components/documentacao/RecursosSection';
import StatusRecursosSection from '@/components/documentacao/StatusRecursosSection';
import ImplementacaoSection from '@/components/documentacao/ImplementacaoSection';
import OperacoesSection from '@/components/documentacao/OperacoesSection';
import SegurancaSection from '@/components/documentacao/SegurancaSection';
import RoadmapImplementacao from '@/components/documentacao/RoadmapImplementacao';
import PrivacyByDesignSection from '@/components/documentacao/PrivacyByDesignSection';
import PlanoMelhoriasSeg from '@/components/documentacao/PlanoMelhoriasSeg';
import PlanoDRSection from '@/components/documentacao/PlanoDRSection';
import ExportDocumentacaoButton from '@/components/documentacao/ExportDocumentacaoButton';

const TABS = [
  { id: 'arquitetura', label: 'Arquitetura', icon: Code },
  { id: 'recursos', label: 'Recursos', icon: Workflow },
  { id: 'status', label: 'Status', icon: CheckSquare },
  { id: 'implementacao', label: 'Implementação', icon: GitBranch },
  { id: 'operacoes', label: 'Operações', icon: Settings },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
  { id: 'roadmap', label: 'Roadmap', icon: Database },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'melhorias', label: 'Melhorias', icon: Wrench },
  { id: 'dr', label: 'DR/BCP', icon: Shield },
];

export default function Documentacao() {
  const [activeTab, setActiveTab] = useState('arquitetura');

  const renderContent = () => {
    switch (activeTab) {
      case 'arquitetura': return <ArquiteturaSection />;
      case 'recursos': return <RecursosSection />;
      case 'status': return <StatusRecursosSection />;
      case 'implementacao': return <ImplementacaoSection />;
      case 'operacoes': return <OperacoesSection />;
      case 'seguranca': return <SegurancaSection />;
      case 'roadmap': return <RoadmapImplementacao />;
      case 'privacy': return <PrivacyByDesignSection />;
      case 'melhorias': return <PlanoMelhoriasSeg />;
      case 'dr': return <PlanoDRSection />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-purple-600 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                  Documentação Técnica
                </h1>
                <p className="text-blue-200 text-sm mt-0.5">
                  AlmoxHub · Single Source of Truth
                </p>
              </div>
            </div>
            <ExportDocumentacaoButton />
          </div>

          {/* Version info */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
              <span className="text-blue-200">Versão</span> 1.0.0
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
              <span className="text-blue-200">Atualizado</span> Fevereiro 2026
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-400/30 backdrop-blur-sm rounded-lg text-green-100 text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block"></span>
              Em Produção
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Tab Navigation - scrollable */}
        <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 pt-4 pb-2">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-max min-w-full">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                    activeTab === id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

          <TabsContent value="arquitetura" className="mt-6">
            <ArquiteturaSection />
          </TabsContent>

          <TabsContent value="recursos" className="mt-6">
            <RecursosSection />
          </TabsContent>

          <TabsContent value="status" className="mt-6">
            <StatusRecursosSection />
          </TabsContent>

          <TabsContent value="implementacao" className="mt-6">
            <ImplementacaoSection />
          </TabsContent>

          <TabsContent value="operacoes" className="mt-6">
            <OperacoesSection />
          </TabsContent>

          <TabsContent value="seguranca" className="mt-6">
            <SegurancaSection />
          </TabsContent>

          <TabsContent value="roadmap" className="mt-6">
            <RoadmapImplementacao />
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <PrivacyByDesignSection />
          </TabsContent>

          <TabsContent value="melhorias" className="mt-6">
            <PlanoMelhoriasSeg />
          </TabsContent>

          <TabsContent value="dr" className="mt-6">
            <PlanoDRSection />
          </TabsContent>
          </Tabs>
          </div>
          </div>
          );
          }