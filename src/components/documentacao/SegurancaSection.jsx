import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function SegurancaSection() {
  return (
    <div className="space-y-6">
      {/* Auditoria GRIF-002 Summary */}
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Conformidade GRIF-002/2024 - Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="text-3xl font-bold text-green-600">94%</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">Conformidade Geral</p>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="text-3xl font-bold text-green-600">BAIXO</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">Risco Geral</p>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">90d</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Plano de Ação</p>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Principais Descobertas</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span><strong>Criptografia:</strong> DB e trânsito criptografados (padrão indústria)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span><strong>Certificações:</strong> Base44 possui SOC 2 Type II + ISO 27001</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span><strong>SSO:</strong> Disponível (pendente implementação)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span><strong>RLS:</strong> Implementado em entidades sensíveis</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span><strong>Logs de Auditoria:</strong> AuditLog entity registra todas ações críticas</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <span><strong>MFA:</strong> Base44 não suporta MFA nativo (usar SSO com MFA)</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <span><strong>WAF:</strong> Não disponível na plataforma (necessário Cloudflare)</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <span><strong>SIEM:</strong> Integração com SIEM Eletrobras não implementada</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span><strong>LGPD:</strong> Conformidade completa - RIPD, Portal do Titular, Anonimização</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span><strong>Timeout Sessão:</strong> 15 minutos de inatividade com aviso de 2 minutos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span><strong>Delegação de Permissões:</strong> Sistema implementado com controle de vigência</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Controles Implementados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Controles de Segurança Implementados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3">
                🔐 Autenticação e Autorização
              </h4>
              <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                <li>• Base44 Auth (gerenciada)</li>
                <li>• Senhas mascaradas na digitação</li>
                <li>• Apenas usuários autorizados acessam</li>
                <li>• Aprovação de novos usuários (admin)</li>
                <li>• RBAC implementado (5 roles)</li>
                <li>• RLS em entidades sensíveis</li>
                <li>• Logout disponível</li>
                <li>• Timeout 15min com aviso 2min</li>
                <li>• Delegação de permissões temporária</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
                🔒 Criptografia
              </h4>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>• DB criptografado em repouso</li>
                <li>• TLS 1.2+ para trânsito</li>
                <li>• SSL em toda aplicação web</li>
                <li>• Certificados gerenciados (Base44)</li>
                <li>• Algoritmos fortes (padrão indústria)</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
                🛡️ Proteção de Dados
              </h4>
              <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                <li>• Sanitização de inputs (DOMPurify)</li>
                <li>• SecureInput component</li>
                <li>• Validação server-side</li>
                <li>• Queries parametrizadas</li>
                <li>• Soft-delete (recuperação 30 dias)</li>
                <li>• Histórico de versões</li>
                <li>• Modal de consentimento LGPD</li>
                <li>• Registro de consentimentos</li>
                <li>• Portal do Titular LGPD</li>
                <li>• Anonimização de dados</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-3">
                📊 Rastreabilidade
              </h4>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <li>• AuditLog entity (ações críticas)</li>
                <li>• Logs de autenticação</li>
                <li>• Logs de alteração de dados</li>
                <li>• IP address e user-agent</li>
                <li>• created_by em todas entidades</li>
                <li>• Página de consulta (admin only)</li>
              </ul>
            </div>

            <div className="p-4 bg-teal-50 dark:bg-teal-950 rounded-lg">
              <h4 className="font-semibold text-teal-900 dark:text-teal-200 mb-3">
                ⚡ Rate Limiting e DDoS
              </h4>
              <ul className="space-y-1 text-sm text-teal-800 dark:text-teal-200">
                <li>• Rate limiting Base44 (por usuário)</li>
                <li>• Erro 429 com retry logic</li>
                <li>• Captcha em funções críticas (parcial)</li>
              </ul>
            </div>

            <div className="p-4 bg-pink-50 dark:bg-pink-950 rounded-lg">
              <h4 className="font-semibold text-pink-900 dark:text-pink-200 mb-3">
                📱 Segurança Web
              </h4>
              <ul className="space-y-1 text-sm text-pink-800 dark:text-pink-200">
                <li>• Cookies seguros (HttpOnly/Secure)</li>
                <li>• Validações server-side</li>
                <li>• Compatível com navegadores atuais</li>
                <li>• Headers HTTP (parcialmente seguros)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lacunas Críticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Lacunas Críticas e Plano de Ação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-red-600 text-white">Alta Prioridade</Badge>
              <span className="text-sm text-red-700 dark:text-red-300">30 dias</span>
            </div>
            <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">MFA via SSO:</span>
                <span>Integrar Azure AD/Okta com MFA obrigatório</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">WAF Externo:</span>
                <span>Cloudflare/AWS WAF com regras OWASP Top 10</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">Backup Testado:</span>
                <span>Validar estratégia além de 30 dias soft-delete</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">Rate Limiting Ampliado:</span>
                <span>CAPTCHA após 3 tentativas de login</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-yellow-600 text-white">Média Prioridade</Badge>
              <span className="text-sm text-yellow-700 dark:text-yellow-300">60 dias</span>
            </div>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">Integração SIEM:</span>
                <span>Webhook para envio de logs ao SIEM Eletrobras</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">SAST/DAST:</span>
                <span>Snyk/SonarQube no CI/CD</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">✅ Timeout Sessão:</span>
                <span><strong>IMPLEMENTADO</strong> - 15 minutos de inatividade com aviso</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">Headers Seguros:</span>
                <span>CSP, HSTS, X-Frame-Options completos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">Plano DR:</span>
                <span>BIA + RTO/RPO documentados</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-blue-600 text-white">Conformidade LGPD</Badge>
              <span className="text-sm text-blue-700 dark:text-blue-300">90 dias</span>
            </div>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">✅ RIPD:</span>
                <span><strong>IMPLEMENTADO</strong> - Wizard 10 seções, geração PDF, versionamento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">✅ Portal do Titular:</span>
                <span><strong>IMPLEMENTADO</strong> - Form público, prazo 15 dias, geração de dados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">Privacy by Design:</span>
                <span>Documentar princípios e bases legais</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[200px]">✅ Consentimento:</span>
                <span><strong>IMPLEMENTADO</strong> - Registro completo com IP e user-agent</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Boas Práticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            Boas Práticas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
                Para Desenvolvedores
              </h4>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>✓ Sempre validar inputs no servidor</li>
                <li>✓ Usar queries parametrizadas (nunca string concat)</li>
                <li>✓ Sanitizar HTML com DOMPurify antes de renderizar</li>
                <li>✓ Verificar autenticação em backend functions</li>
                <li>✓ Usar asServiceRole apenas quando necessário</li>
                <li>✓ Nunca expor secrets no frontend</li>
                <li>✓ Registrar ações críticas em AuditLog</li>
                <li>✓ Implementar error handling adequado</li>
                <li>✓ Revisar RLS policies antes de produção</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
                Para Administradores
              </h4>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>✓ Aprovar apenas usuários verificados</li>
                <li>✓ Aplicar princípio do menor privilégio</li>
                <li>✓ Revisar logs de auditoria semanalmente</li>
                <li>✓ Executar backups e testes de restore</li>
                <li>✓ Manter dependências atualizadas</li>
                <li>✓ Monitorar alertas de segurança</li>
                <li>✓ Implementar rotação de chaves (90 dias)</li>
                <li>✓ Realizar pentests periódicos</li>
                <li>✓ Documentar incidentes de segurança</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Roadmap */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle>Roadmap de Conformidade (30/60/90 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                Sprint 1-2 (30 dias) - CRÍTICO
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">SSO Corporativo</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Integrar Base44 SSO com Azure AD/Okta. MFA obrigatório no provedor.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">WAF Cloudflare</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Configurar WAF com regras OWASP Top 10, DDoS protection, rate limiting.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">Backup + DR</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Validar política com Base44. Testar restore. Documentar runbook.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">Rate Limiting++</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    CAPTCHA após 3 tentativas. Notificações de login suspeito.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                Sprint 3-4 (60 dias) - ALTA
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">SIEM Eletrobras</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Webhook para logs de segurança. Integração completa e testada.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">SAST/DAST</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Pipeline CI/CD com Snyk/SonarQube. Gates de segurança.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">✅ Timeout 15min</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>IMPLEMENTADO</strong> - Sistema detecta inatividade e avisa 2min antes do logout.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">Headers HTTP</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    CSP, HSTS, X-Frame-Options via WAF. Score A+ em securityheaders.com.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Sprint 5-6 (90 dias) - CONFORMIDADE
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">✅ RIPD + DPO</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>IMPLEMENTADO</strong> - Entity completa, wizard 10 seções, PDF profissional.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">✅ Portal Titular</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>IMPLEMENTADO</strong> - Form público, gestão admin, geração automática de dados.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">✅ Anonimização</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>IMPLEMENTADO</strong> - Backend function, masking/hashing/generalização.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">Pentest</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Contratar pentest externo. Plano de correção para findings.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">Rotação Chaves</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Política de rotação a cada 90 dias. Automação via secrets manager.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}