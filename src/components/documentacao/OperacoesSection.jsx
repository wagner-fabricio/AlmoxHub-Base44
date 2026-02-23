import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Settings, AlertTriangle, FileText } from 'lucide-react';

export default function OperacoesSection() {
  return (
    <div className="space-y-6">
      {/* Deployment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Deployment e Hospedagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
              Base44 Platform (BaaS)
            </h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• <strong>Hospedagem:</strong> Gerenciada pela Base44 (Cloud)</li>
              <li>• <strong>Deploy:</strong> Automático via Git integration ou Base44 CLI</li>
              <li>• <strong>Certificações:</strong> SOC 2 Type II + ISO 27001</li>
              <li>• <strong>Uptime SLA:</strong> Verificar com Base44 (típico: 99.9%)</li>
              <li>• <strong>Edge Functions:</strong> Deno runtime, deploy instantâneo</li>
              <li>• <strong>CDN:</strong> Global edge network</li>
              <li>• <strong>SSL:</strong> Certificados gerenciados automaticamente</li>
            </ul>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
              Ambientes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Badge className="mb-2">Production</Badge>
                <ul className="space-y-1 text-purple-800 dark:text-purple-200">
                  <li>• URL: [base44-url-production]</li>
                  <li>• Database: Production DB (criptografado)</li>
                  <li>• Logs: Retention conforme política</li>
                  <li>• Backup: Automático (verificar com Base44)</li>
                </ul>
              </div>
              <div>
                <Badge className="mb-2">Development/Test</Badge>
                <ul className="space-y-1 text-purple-800 dark:text-purple-200">
                  <li>• URL: [base44-url-dev]</li>
                  <li>• Database: Test DB (isolado)</li>
                  <li>• Logs: Debug mode habilitado</li>
                  <li>• Backup: Opcional</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600" />
            Configuração e Variáveis de Ambiente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3">
              Variáveis de Ambiente (Backend Functions)
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-white dark:bg-slate-800 rounded">
                <p className="text-sm font-mono text-green-700 dark:text-green-300 mb-1">BASE44_APP_ID</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Pré-populado automaticamente. ID único do app Base44.
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded">
                <p className="text-sm font-mono text-green-700 dark:text-green-300 mb-1">VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Chaves para push notifications (Web Push). Configurar via Dashboard → Settings.
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded">
                <p className="text-sm font-mono text-green-700 dark:text-green-300 mb-1">Custom Secrets</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Adicionar via Dashboard → Settings → Environment Variables para integrações futuras.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
            <h4 className="font-semibold text-cyan-900 dark:text-cyan-200 mb-3">
              Configurações do Aplicativo
            </h4>
            <ul className="space-y-2 text-sm text-cyan-800 dark:text-cyan-200">
              <li>• <strong>Dark Mode:</strong> Armazenado em localStorage (almoxhub-theme)</li>
              <li>• <strong>Sidebar State:</strong> localStorage (almoxhub-sidebar-collapsed)</li>
              <li>• <strong>Filtros Dashboard:</strong> user.filtros_preferidos (por usuário)</li>
              <li>• <strong>Notification Preferences:</strong> Entity NotificationPreferences</li>
              <li>• <strong>Mobile Detection:</strong> User-agent + window.innerWidth</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Backup e DR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Backup, Recuperação e Continuidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3">
              ✅ Política de Backup (Implementado)
            </h4>
            <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <li>• <strong>Soft-delete:</strong> 30 dias de recuperação para dados excluídos</li>
              <li>• <strong>Histórico de versões:</strong> Restaurar versões anteriores do app</li>
              <li>• <strong>Backup Base44:</strong> Automático pela plataforma</li>
              <li>• <strong>✅ Backup Semanal Preventivo:</strong> Automation exportBackupCritico (domingos 02:00)</li>
              <li>• <strong>✅ Storage Privado:</strong> 4 semanas retenção, encrypted</li>
              <li>• <strong>Retenção logs:</strong> Configurável (recomendado: 90 dias mínimo, 2 anos SOx)</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3">
              ✅ Disaster Recovery (DR) - Implementado
            </h4>
            <div className="space-y-3 text-sm text-green-800 dark:text-green-200">
              <div>
                <p className="font-medium mb-1">✅ RTO (Recovery Time Objective)</p>
                <p className="text-xs">Crítico: 4h | Alto: 8h | Médio: 24h (documentado em BIA)</p>
              </div>
              <div>
                <p className="font-medium mb-1">✅ RPO (Recovery Point Objective)</p>
                <p className="text-xs">OS: 1h | Cadastros: 4h | Logs: 24h (documentado em BIA)</p>
              </div>
              <div>
                <p className="font-medium mb-1">✅ BIA (Business Impact Analysis)</p>
                <p className="text-xs">Completo: 12 processos críticos identificados, impactos mapeados</p>
              </div>
              <div>
                <p className="font-medium mb-1">✅ Runbooks de Recuperação</p>
                <p className="text-xs">3 cenários documentados: Perda total, Corrupção entity, DR completo</p>
              </div>
              <div>
                <p className="font-medium mb-1">✅ Testes Trimestrais</p>
                <p className="text-xs">Simulação trimestral agendada, MTTR medido vs objetivo</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3">
              ✅ Exportação Automática de Dados
            </h4>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-200 mb-3">
              <p><strong>Automation:</strong> exportBackupCritico - Domingos 02:00 UTC</p>
              <p><strong>Entidades:</strong> OrdemServico, Pessoa, Regional, Almoxarifado, Instalacao, Categoria, Subcategoria, Projeto, Equipe, etc.</p>
              <p><strong>Storage:</strong> Base44 Private Storage (encrypted)</p>
              <p><strong>Retenção:</strong> 4 semanas (rolling)</p>
              <p><strong>Formato:</strong> JSON + Metadata (timestamp, versão)</p>
            </div>
            <pre className="text-xs bg-green-100 dark:bg-green-900 p-3 rounded overflow-x-auto">
{`// Automation já configurada
// functions/exportBackupCritico.js
// Roda automaticamente todo domingo`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Manutenção e Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-rose-50 dark:bg-rose-950 rounded-lg">
            <h4 className="font-semibold text-rose-900 dark:text-rose-200 mb-3">
              Limitações Conhecidas
            </h4>
            <ul className="space-y-2 text-sm text-rose-800 dark:text-rose-200">
              <li>• <strong>MFA:</strong> Base44 não suporta MFA nativo. Usar SSO com MFA.</li>
              <li>• <strong>WAF:</strong> Não incluído na plataforma. Requer proxy externo (Cloudflare).</li>
              <li>• <strong>SIEM:</strong> Integração com SIEM Eletrobras não implementada.</li>
              <li>• <strong>✅ Timeout sessão:</strong> IMPLEMENTADO - 15min inatividade, modal aviso 2min antes.</li>
              <li>• <strong>E2E Encryption:</strong> Dados não criptografados ponta a ponta (admins Base44 podem acessar).</li>
              <li>• <strong>✅ Rate Limiting:</strong> IMPLEMENTADO - LoginAttempt entity, CAPTCHA após 3 falhas, bloqueio após 10.</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-3">
              Troubleshooting Comum
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                  Erro 429 (Too Many Requests)
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>Causa:</strong> Rate limit Base44 atingido.<br/>
                  <strong>Solução:</strong> Implementar retry com backoff exponencial. Espaçar requisições.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                  Usuário redirecionado para PendingApproval
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>Causa:</strong> status_aprovacao !== 'aprovado' ou ativo === false.<br/>
                  <strong>Solução:</strong> Admin aprovar via UserApproval page.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                  RLS Error (Forbidden)
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>Causa:</strong> Usuário tentando acessar dados sem permissão.<br/>
                  <strong>Solução:</strong> Verificar role e ownership. Usar asServiceRole se necessário (backend).
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                  Push Notifications não funcionam
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>Causa:</strong> VAPID keys não configuradas ou subscription não criada.<br/>
                  <strong>Solução:</strong> Configurar keys em env vars. Verificar PushSubscription entity.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-teal-50 dark:bg-teal-950 rounded-lg">
            <h4 className="font-semibold text-teal-900 dark:text-teal-200 mb-3">
              Logs e Debugging
            </h4>
            <ul className="space-y-2 text-sm text-teal-800 dark:text-teal-200">
              <li>• <strong>Frontend:</strong> Console do navegador (React DevTools)</li>
              <li>• <strong>Backend:</strong> Logs das functions via Base44 Dashboard</li>
              <li>• <strong>Audit Logs:</strong> AuditLog entity (página AuditLogs para admin)</li>
              <li>• <strong>Network:</strong> Chrome DevTools → Network tab</li>
              <li>• <strong>React Query:</strong> React Query DevTools (habilitado em dev)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Extensibilidade */}
      <Card>
        <CardHeader>
          <CardTitle>Extensibilidade e Pontos de Extensão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
              Adicionar Nova Entidade
            </h4>
            <ol className="list-decimal ml-5 space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
              <li>Criar JSON schema em entities/NomeEntidade.json</li>
              <li>Definir RLS policies se necessário</li>
              <li>Criar página de CRUD (opcional)</li>
              <li>Adicionar ao menu se relevante (Layout.js)</li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3">
              Adicionar Nova Backend Function
            </h4>
            <ol className="list-decimal ml-5 space-y-2 text-sm text-green-800 dark:text-green-200">
              <li>Criar arquivo functions/nomeFuncao.js</li>
              <li>Implementar Deno.serve handler</li>
              <li>Validar autenticação com base44.auth.me()</li>
              <li>Invocar no frontend: base44.functions.invoke('nomeFuncao', params)</li>
            </ol>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
              Adicionar Nova Integração
            </h4>
            <ol className="list-decimal ml-5 space-y-2 text-sm text-purple-800 dark:text-purple-200">
              <li>Verificar se Base44 App Connectors suporta (OAuth)</li>
              <li>Se não: criar backend function com API key via env vars</li>
              <li>Documentar configuração de secrets</li>
              <li>Criar componente frontend se UI necessária</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
              Adicionar Novo Módulo/Página
            </h4>
            <ol className="list-decimal ml-5 space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>Criar páginas em pages/ (flat, sem subfolders)</li>
              <li>Criar componentes em components/modulo/</li>
              <li>Adicionar ao menu no Layout.js</li>
              <li>Configurar permissões (gestorOnly, adminOnly) se necessário</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}