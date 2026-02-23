import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Code, Workflow, CheckSquare, Settings, Shield } from 'lucide-react';
import ArquiteturaSection from '@/components/documentacao/ArquiteturaSection';
import RecursosSection from '@/components/documentacao/RecursosSection';
import StatusRecursosSection from '@/components/documentacao/StatusRecursosSection';
import ImplementacaoSection from '@/components/documentacao/ImplementacaoSection';
import OperacoesSection from '@/components/documentacao/OperacoesSection';
import SegurancaSection from '@/components/documentacao/SegurancaSection';
import RoadmapImplementacao from '@/components/documentacao/RoadmapImplementacao';
import PrivacyByDesignSection from '@/components/documentacao/PrivacyByDesignSection';
import PlanoMelhoriasSeg from '@/components/documentacao/PlanoMelhoriasSeg';

export default function Documentacao() {
  const [activeTab, setActiveTab] = useState('arquitetura');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Documentação Técnica - AlmoxHub
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Single Source of Truth para desenvolvedores e stakeholders técnicos
            </p>
          </div>
        </div>

        {/* Version Badge */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">Versão:</span>
                  <span className="ml-2 text-slate-700 dark:text-slate-300">1.0.0</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">Última atualização:</span>
                  <span className="ml-2 text-slate-700 dark:text-slate-300">Fevereiro 2026</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">Status:</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                    Em Produção
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl">
            <TabsTrigger value="arquitetura" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Arquitetura</span>
            </TabsTrigger>
            <TabsTrigger value="recursos" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              <span className="hidden sm:inline">Recursos</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="implementacao" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Implementação</span>
            </TabsTrigger>
            <TabsTrigger value="operacoes" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Operações</span>
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              <span className="hidden sm:inline">Roadmap</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            </TabsList>

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
          </Tabs>
          </div>
          </div>
          );
          }