import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Cloud, Zap, Layers, Lock, Globe } from 'lucide-react';

export default function ArquiteturaSection() {
  return (
    <div className="space-y-6">
      {/* Visão Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Visão Geral do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            O <strong>AlmoxHub</strong> é uma plataforma web moderna para gestão integrada de almoxarifados, 
            ordens de serviço, expedição, recebimento e logística da Axia Energia. Construído sobre a 
            plataforma Base44 (BaaS), oferece gestão de operações em tempo real com rastreabilidade completa.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Tipo</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">Aplicação Web SPA (Single Page Application)</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Ambiente</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">Cloud (Base44 Platform)</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Classificação</h4>
              <p className="text-sm text-green-700 dark:text-green-300">Dados Pessoais e Operacionais (LGPD)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arquitetura Técnica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-purple-600" />
            Arquitetura de 3 Camadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Camada 1: Frontend */}
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  1. Camada de Apresentação (Frontend)
                </h3>
              </div>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <p><strong>Framework:</strong> React 18 + Vite</p>
                <p><strong>UI Library:</strong> shadcn/ui + Radix UI + Tailwind CSS</p>
                <p><strong>State Management:</strong> React Query (@tanstack/react-query) + React Context</p>
                <p><strong>Roteamento:</strong> React Router DOM v6</p>
                <p><strong>Visualização de Dados:</strong> Recharts + React Leaflet (mapas)</p>
                <p><strong>Responsividade:</strong> Mobile-first design com detecção automática</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>React 18</Badge>
                  <Badge>Tailwind CSS</Badge>
                  <Badge>React Query</Badge>
                  <Badge>Framer Motion</Badge>
                  <Badge>Recharts</Badge>
                </div>
              </div>
            </div>

            {/* Camada 2: Backend */}
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  2. Camada de Lógica de Negócio (Backend)
                </h3>
              </div>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <p><strong>Runtime:</strong> Deno (Edge Functions)</p>
                <p><strong>SDK:</strong> @base44/sdk v0.8.6</p>
                <p><strong>Padrão:</strong> Serverless Functions (HTTP Handlers)</p>
                <p><strong>Principais Funções:</strong></p>
                <ul className="list-disc ml-5 space-y-1 mt-2">
                  <li>parseNFeXML - Extração de dados de NFe</li>
                  <li>enviarAlertas - Sistema de notificações</li>
                  <li>registrarAuditLog - Logs de auditoria</li>
                  <li>notificationService - Notificações push</li>
                  <li>checkDeadlines - Verificação de prazos</li>
                  <li>checkRateLimit - Rate limiting de login</li>
                  <li>anonimizarDados - Anonimização LGPD</li>
                  <li>exportBackupCritico - Backup semanal</li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>Deno</Badge>
                  <Badge>Serverless</Badge>
                  <Badge>Base44 SDK</Badge>
                  <Badge>Edge Functions</Badge>
                </div>
              </div>
            </div>

            {/* Camada 3: Dados */}
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  3. Camada de Dados (Persistência)
                </h3>
              </div>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <p><strong>Banco de Dados:</strong> Base44 Managed Database (NoSQL)</p>
                <p><strong>Entidades Principais (20+):</strong></p>
                <ul className="list-disc ml-5 space-y-1 mt-2">
                  <li>OrdemServico - Core do sistema</li>
                  <li>Pessoa, Regional, Almoxarifado, Instalacao - Cadastros</li>
                  <li>Categoria, Subcategoria, Projeto - Organização</li>
                  <li>Comentario, Notificacao - Comunicação</li>
                  <li>Conversa, MensagemChat - Mensagens internas</li>
                  <li>AuditLog - Rastreabilidade</li>
                  <li>OrdemSaida, Transportadora, VeiculoAxia - Logística</li>
                  <li>CentroCusto, Fornecedor - Gestão financeira</li>
                  <li>RIPD, SolicitacaoTitular, Consentimento - LGPD</li>
                  <li>LoginAttempt - Segurança</li>
                </ul>
                <p className="mt-3"><strong>Recursos:</strong></p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>✅ Criptografia em repouso (padrão indústria)</li>
                  <li>✅ Row Level Security (RLS) configurado</li>
                  <li>✅ Soft-delete com recuperação (30 dias)</li>
                  <li>✅ Real-time subscriptions (base44.entities.subscribe)</li>
                  <li>✅ Controle de versão (histórico de alterações)</li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>NoSQL</Badge>
                  <Badge>Criptografado</Badge>
                  <Badge>RLS</Badge>
                  <Badge>Real-time</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Princípios de Design */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            Princípios de Design e Arquitetura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">🔒 Security First</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                RLS em todas entidades, sanitização de inputs (DOMPurify), logs de auditoria, autenticação via Base44 Auth.
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">📱 Mobile-First</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Design responsivo, detecção automática de mobile, páginas otimizadas (EmFluxo mobile).
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">🧩 Component-Driven</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Componentes reutilizáveis, separação de concerns, componentes de UI shadcn/ui.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">⚡ Performance</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                React Query para cache, lazy loading, virtualização de listas, image compression.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">🔄 Real-time</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Subscriptions em entidades críticas, notificações push, mensagens em tempo real.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">📊 Data-Driven</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Dashboard com insights, torre de controle, analytics, logs de auditoria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Dados e Interações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
                1️⃣ Autenticação e Inicialização
              </h4>
              <ol className="list-decimal ml-5 space-y-1 text-sm text-blue-800 dark:text-blue-300">
                <li>Usuário acessa via Base44 Auth (SSO disponível)</li>
                <li>Layout.js verifica base44.auth.me()</li>
                <li>Busca registro em Pessoa (status_aprovacao, user_id)</li>
                <li>Redireciona: NewUserSetup → PendingApproval → App</li>
                <li>Carrega regional, almoxarifados, foto de perfil</li>
              </ol>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
                2️⃣ Operações CRUD em Entidades
              </h4>
              <ol className="list-decimal ml-5 space-y-1 text-sm text-purple-800 dark:text-purple-300">
                <li>Frontend: base44.entities.EntityName.list/create/update/delete</li>
                <li>Base44 valida RLS (Row Level Security)</li>
                <li>Backend functions podem usar asServiceRole para operações admin</li>
                <li>React Query gerencia cache e revalidação</li>
                <li>Real-time: base44.entities.subscribe() para updates</li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3">
                3️⃣ Processamento de Negócio (Backend Functions)
              </h4>
              <ol className="list-decimal ml-5 space-y-1 text-sm text-green-800 dark:text-green-300">
                <li>Frontend: base44.functions.invoke('functionName', params)</li>
                <li>Deno function recebe req, cria base44 client</li>
                <li>Valida autenticação: base44.auth.me()</li>
                <li>Executa lógica (ex: parseNFeXML, enviarAlertas)</li>
                <li>Retorna Response.json() ou erro</li>
              </ol>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-3">
                4️⃣ Notificações e Comunicação
              </h4>
              <ol className="list-decimal ml-5 space-y-1 text-sm text-amber-800 dark:text-amber-300">
                <li>Cria entidade Notificacao (destinatario_id, tipo, mensagem)</li>
                <li>NotificationBell (componente) puxa notificações em real-time</li>
                <li>Push notifications via PushSubscription + sendPushNotification</li>
                <li>Mensagens internas via Conversa + MensagemChat</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}