import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, AlertTriangle, Database, FileText, Phone } from 'lucide-react';

export default function PlanoDRSection() {
  const bia = [
    {
      processo: 'Gestão de Ordens de Serviço',
      criticidade: 'Crítico',
      rto: '4 horas',
      rpo: '1 hora',
      impacto: 'Paralisação completa das operações de almoxarifado',
      dependencias: 'Base44, Supabase, DNS'
    },
    {
      processo: 'Gestão de Pessoas e Permissões',
      criticidade: 'Alto',
      rto: '8 horas',
      rpo: '4 horas',
      impacto: 'Impedimento de acesso ao sistema',
      dependencias: 'Base44 Auth, Entity Pessoa'
    },
    {
      processo: 'Expedição e Recebimento',
      criticidade: 'Crítico',
      rto: '4 horas',
      rpo: '2 horas',
      impacto: 'Atraso em logística e inventário',
      dependencias: 'Transportadoras, NFe Parser, Storage'
    },
    {
      processo: 'Mensagens Internas',
      criticidade: 'Médio',
      rto: '24 horas',
      rpo: '4 horas',
      impacto: 'Redução na comunicação interna',
      dependencias: 'Real-time subscriptions'
    },
    {
      processo: 'Dashboard e Analytics',
      criticidade: 'Médio',
      rto: '12 horas',
      rpo: '24 horas',
      impacto: 'Falta de visibilidade gerencial',
      dependencias: 'Queries agregadas'
    },
    {
      processo: 'Auditoria e Logs',
      criticidade: 'Baixo',
      rto: '48 horas',
      rpo: '24 horas',
      impacto: 'Perda de rastreabilidade temporária',
      dependencias: 'AuditLog entity'
    }
  ];

  const procedimentosRecuperacao = [
    {
      cenario: 'Perda Total de Dados',
      etapas: [
        '1. Acionar DBA e suporte Base44 imediatamente',
        '2. Verificar último backup disponível (semanal)',
        '3. Provisionar novo ambiente se necessário',
        '4. Executar restore completo do backup',
        '5. Validar integridade: contar registros, testar queries',
        '6. Notificar stakeholders do status',
        '7. Realizar smoke tests em funcionalidades críticas',
        '8. Liberar acesso gradual (admin → gestores → usuários)'
      ],
      tempo_estimado: '6-8 horas',
      responsavel: 'Admin + DBA'
    },
    {
      cenario: 'Corrupção de Entity Específica',
      etapas: [
        '1. Identificar entity afetada e escopo da corrupção',
        '2. Isolar entity (pausar writes se possível)',
        '3. Extrair dados do backup semanal',
        '4. Filtrar apenas registros da entity afetada',
        '5. Comparar backup vs dados corrompidos',
        '6. Executar restore parcial via bulkCreate',
        '7. Validar integridade dos dados restaurados',
        '8. Documentar incidente e causa raiz'
      ],
      tempo_estimado: '2-4 horas',
      responsavel: 'Admin'
    },
    {
      cenario: 'Disaster Recovery (Novo Ambiente)',
      etapas: [
        '1. Provisionar novo projeto Base44',
        '2. Configurar DNS e domínio',
        '3. Recriar entities a partir dos schemas',
        '4. Importar backup via exportBackupCritico',
        '5. Configurar secrets e environment variables',
        '6. Deploy de backend functions',
        '7. Configurar automations e scheduled tasks',
        '8. Testes extensivos antes de go-live',
        '9. Migrar DNS para novo ambiente',
        '10. Monitorar primeiras 24h intensivamente'
      ],
      tempo_estimado: '12-24 horas',
      responsavel: 'Admin + DevOps'
    }
  ];

  const contatosEmergencia = [
    { nome: 'Suporte Base44', contato: 'support@base44.com', disponibilidade: '24/7' },
    { nome: 'Admin Principal', contato: 'admin@axienergia.com', disponibilidade: 'On-call' },
    { nome: 'DPO/LGPD', contato: 'dpo@axienergia.com', disponibilidade: 'Comercial' },
    { nome: 'Gestor TI', contato: 'ti@axienergia.com', disponibilidade: 'Comercial' }
  ];

  return (
    <div className="space-y-6">
      <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription>
          <strong>Plano de Disaster Recovery (DR)</strong> - Procedimentos para continuidade de negócio em caso de desastre ou perda de dados.
        </AlertDescription>
      </Alert>

      {/* RTO/RPO Summary */}
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
        <CardHeader>
          <CardTitle>Objetivos de Recuperação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold">RTO - Recovery Time Objective</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Tempo máximo aceitável para restaurar o serviço após um incidente
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Processos Críticos:</span>
                  <Badge className="bg-red-600">4 horas</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Processos de Alto Impacto:</span>
                  <Badge className="bg-orange-600">8 horas</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Processos de Médio Impacto:</span>
                  <Badge className="bg-yellow-600">24 horas</Badge>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold">RPO - Recovery Point Objective</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Quantidade máxima de dados que pode ser perdida (janela de perda aceitável)
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Ordens de Serviço:</span>
                  <Badge className="bg-red-600">1 hora</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cadastros Base:</span>
                  <Badge className="bg-orange-600">4 horas</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Logs e Auditoria:</span>
                  <Badge className="bg-yellow-600">24 horas</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BIA - Business Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>BIA - Análise de Impacto no Negócio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="p-3 text-left">Processo</th>
                  <th className="p-3 text-left">Criticidade</th>
                  <th className="p-3 text-left">RTO</th>
                  <th className="p-3 text-left">RPO</th>
                  <th className="p-3 text-left">Impacto</th>
                  <th className="p-3 text-left">Dependências</th>
                </tr>
              </thead>
              <tbody>
                {bia.map((item, idx) => (
                  <tr key={idx} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-3 font-medium">{item.processo}</td>
                    <td className="p-3">
                      <Badge className={
                        item.criticidade === 'Crítico' ? 'bg-red-600' :
                        item.criticidade === 'Alto' ? 'bg-orange-600' :
                        item.criticidade === 'Médio' ? 'bg-yellow-600' : 'bg-green-600'
                      }>
                        {item.criticidade}
                      </Badge>
                    </td>
                    <td className="p-3">{item.rto}</td>
                    <td className="p-3">{item.rpo}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{item.impacto}</td>
                    <td className="p-3 text-xs text-slate-500">{item.dependencias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Estratégia de Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Estratégia de Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Backup Automático Base44
            </h4>
            <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <li>• Base44 realiza backups contínuos do banco de dados</li>
              <li>• Retenção: 7 dias (point-in-time recovery)</li>
              <li>• Restore via suporte Base44</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Backup Preventivo Semanal
            </h4>
            <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <li>• <strong>Backend Function:</strong> exportBackupCritico</li>
              <li>• <strong>Frequência:</strong> Semanal (domingos às 02:00 UTC)</li>
              <li>• <strong>Entities:</strong> OrdemServico, Pessoa, Regional, Almoxarifado, Instalacao, Categoria, Subcategoria, Projeto</li>
              <li>• <strong>Formato:</strong> JSON estruturado</li>
              <li>• <strong>Armazenamento:</strong> Base44 Private Storage (encrypted at rest)</li>
              <li>• <strong>Retenção:</strong> 4 semanas (últimos 4 backups)</li>
              <li>• <strong>Versionamento:</strong> backup-critico-YYYY-MM-DD.json</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Automation Configurada</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Scheduled automation executando <code>exportBackupCritico</code> semanalmente.
              Em caso de falha, notificação enviada para admin.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Procedimentos de Recuperação */}
      <Card>
        <CardHeader>
          <CardTitle>Procedimentos de Recuperação (Runbooks)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {procedimentosRecuperacao.map((proc, idx) => (
            <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">{proc.cenario}</h4>
                <div className="flex gap-2">
                  <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> {proc.tempo_estimado}</Badge>
                  <Badge variant="outline">{proc.responsavel}</Badge>
                </div>
              </div>
              <ol className="space-y-2 text-sm">
                {proc.etapas.map((etapa, eIdx) => (
                  <li key={eIdx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-semibold min-w-[20px]">{eIdx + 1}.</span>
                    <span className="text-slate-700 dark:text-slate-300">{etapa}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contatos de Emergência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contatos de Emergência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contatosEmergencia.map((contato, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-semibold">{contato.nome}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{contato.contato}</p>
                <Badge className="mt-2" variant="outline">{contato.disponibilidade}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Pós-Restore */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader>
          <CardTitle>Checklist de Validação Pós-Restore</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Contar registros de entities críticas (OrdemServico, Pessoa, Regional, Almoxarifado)</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Testar login com usuário admin e usuário regular</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Criar OS de teste e validar workflow completo</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Validar dashboard (KPIs, gráficos, mapas)</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Testar mensagens internas e notificações</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Verificar backend functions (testar 2-3 críticas)</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Validar permissões (RLS funcionando corretamente)</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Verificar integridade referencial (IDs, relacionamentos)</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Documentar MTTR real e comparar com RTO</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              <span className="text-sm">Comunicar stakeholders sobre conclusão do restore</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testes Periódicos */}
      <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <strong>Testes Trimestrais Obrigatórios:</strong> Executar simulação de restore em ambiente de staging para validar procedimentos e medir MTTR real. Próximo teste agendado: Maio 2026.
        </AlertDescription>
      </Alert>
    </div>
  );
}