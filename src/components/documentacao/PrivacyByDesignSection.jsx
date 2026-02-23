import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, CheckCircle, Database, FileText, Users } from 'lucide-react';

export default function PrivacyByDesignSection() {
  const principios = [
    {
      numero: 1,
      titulo: 'Proativo, não Reativo; Preventivo, não Corretivo',
      descricao: 'Antecipar e prevenir eventos de invasão de privacidade antes que eles aconteçam.',
      icon: Shield,
      evidencias: [
        'RLS configurado em todas entidades desde o início',
        'Validação de inputs com sanitização (DOMPurify)',
        'Rate limiting nativo da plataforma Base44',
        'Logs de auditoria em todas operações críticas'
      ]
    },
    {
      numero: 2,
      titulo: 'Privacidade como Padrão',
      descricao: 'Privacidade deve ser a configuração padrão, sem necessidade de ação do usuário.',
      icon: Lock,
      evidencias: [
        'Notificações push desabilitadas por padrão',
        'Dados pessoais visíveis apenas para o próprio usuário',
        'Soft-delete: dados excluídos mantidos 30 dias para recuperação',
        'Minimização de dados: apenas campos necessários são coletados'
      ]
    },
    {
      numero: 3,
      titulo: 'Privacidade Incorporada no Design',
      descricao: 'Privacidade deve ser parte integral do sistema, não um complemento.',
      icon: Database,
      evidencias: [
        'Criptografia de dados em repouso (Base44 managed)',
        'TLS 1.2+ para dados em trânsito',
        'Arquitetura com RLS desde a concepção',
        'Entidades projetadas com campos PII identificados'
      ]
    },
    {
      numero: 4,
      titulo: 'Funcionalidade Total - Win-Win',
      descricao: 'Privacidade não deve comprometer funcionalidade.',
      icon: CheckCircle,
      evidencias: [
        'Sistema funcional completo com RLS ativo',
        'Colaboração em tempo real sem comprometer segurança',
        'Filtros por regional/almoxarifado respeitam permissões',
        'Dashboard com insights sem expor dados sensíveis'
      ]
    },
    {
      numero: 5,
      titulo: 'Segurança de Ponta a Ponta',
      descricao: 'Proteção em todo o ciclo de vida dos dados.',
      icon: Shield,
      evidencias: [
        'Autenticação via Base44 Auth (SSO-ready)',
        'Tokens JWT com expiração',
        'Timeout de sessão após 15min de inatividade',
        'Logs de auditoria: criação, atualização, exclusão'
      ]
    },
    {
      numero: 6,
      titulo: 'Visibilidade e Transparência',
      descricao: 'Operações do sistema devem ser verificáveis e transparentes.',
      icon: Eye,
      evidencias: [
        'AuditLog registra todas ações com IP e user-agent',
        'Usuário pode ver histórico de suas ações',
        'Admin pode consultar logs de auditoria',
        'Documentação técnica completa e acessível'
      ]
    },
    {
      numero: 7,
      titulo: 'Respeito pela Privacidade do Usuário',
      descricao: 'Manter o foco no usuário, com controles centrados nele.',
      icon: Users,
      evidencias: [
        'Preferências de notificação configuráveis',
        'Consentimento explícito para dados opcionais',
        'Usuário pode revogar consentimentos',
        'Portal do titular (planejado) para GDPR/LGPD'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Introdução */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-600" />
            Privacy by Design - Os 7 Princípios Fundamentais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Privacy by Design é uma abordagem que incorpora privacidade e proteção de dados em todo o ciclo de vida do sistema,
            desde a concepção até a desativação. Desenvolvido por Ann Cavoukian, o framework estabelece 7 princípios fundamentais.
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Status de Implementação:</strong> AlmoxHub implementa todos os 7 princípios em diferentes níveis.
              Alguns princípios estão totalmente implementados, outros estão em desenvolvimento contínuo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Princípios */}
      {principios.map((principio) => {
        const Icon = principio.icon;
        return (
          <Card key={principio.numero}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-600 text-white">Princípio {principio.numero}</Badge>
                  </div>
                  <CardTitle className="text-lg mb-2">{principio.titulo}</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{principio.descricao}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">
                Evidências de Implementação
              </h4>
              <div className="space-y-2">
                {principio.evidencias.map((evidencia, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{evidencia}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Resumo de Compliance */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-green-600" />
            Resumo de Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">7/7</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Princípios Implementados</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">100%</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Dados Criptografados</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">RLS</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Ativo em Todas Entities</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Próximos Passos</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                SSO corporativo (Azure AD/Okta) - em planejamento
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                Portal do titular LGPD - roadmap Sprint 5-6
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                Anonimização automatizada - roadmap Sprint 5-6
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                WAF (Web Application Firewall) - via Cloudflare
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Nota:</strong> Este documento pode ser exportado em PDF para compartilhamento com DPO, jurídico e auditores.
              Todas as evidências estão documentadas e auditáveis via AuditLog.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}