import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function PlanoMelhoriasSeg() {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const melhorias = [
    {
      id: 'rate-limiting',
      categoria: 'Autenticação',
      titulo: 'Rate Limiting Ampliado + CAPTCHA',
      prioridade: 'alta',
      complexidade: 'média',
      tempo: '3-5 dias',
      status: 'planejado',
      descricao: 'Implementar rate limiting aprimorado com CAPTCHA após 3 tentativas de login falhadas para prevenir ataques de força bruta.',
      motivacao: [
        'Proteção contra ataques de força bruta',
        'Conformidade com GRIF-002/2024',
        'Reduzir carga em tentativas maliciosas',
        'Experiência do usuário mantida (apenas após falhas)'
      ],
      requisitos: [
        'Sistema de tracking de tentativas de login por IP e email',
        'Integração com serviço CAPTCHA (Google reCAPTCHA v3)',
        'Backend function para validação',
        'Timeout progressivo: 1min → 5min → 15min → CAPTCHA',
        'Whitelist de IPs confiáveis (opcional)'
      ],
      implementacao: {
        etapas: [
          {
            nome: '1. Entity LoginAttempt',
            detalhes: [
              'Criar entity para rastrear tentativas',
              'Campos: email, ip_address, timestamp, sucesso (bool), user_agent',
              'TTL de 24h (cleanup automático)'
            ]
          },
          {
            nome: '2. Backend Function - checkRateLimit',
            detalhes: [
              'Verificar últimas tentativas (últimos 15min)',
              'Lógica: 3+ falhas = exigir CAPTCHA',
              'Retornar: {allowed: bool, requiresCaptcha: bool, remainingAttempts: number}'
            ]
          },
          {
            nome: '3. Frontend - Login Flow',
            detalhes: [
              'Adicionar reCAPTCHA v3 invisível',
              'Após 3 falhas, mostrar reCAPTCHA v2 checkbox',
              'Validar token no backend antes de permitir login',
              'Mensagem clara: "Detectamos múltiplas tentativas. Complete o CAPTCHA."'
            ]
          },
          {
            nome: '4. Automação de Limpeza',
            detalhes: [
              'Scheduled automation diária',
              'Deletar LoginAttempt > 24h',
              'Log de estatísticas (tentativas bloqueadas)'
            ]
          }
        ],
        stack: [
          'Entity: LoginAttempt',
          'Package: react-google-recaptcha (^3.1.0)',
          'Backend: checkRateLimit function',
          'Secrets: RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY',
          'Automation: cleanupLoginAttempts (daily)'
        ],
        testes: [
          'Tentar login 3x com senha errada → deve exigir CAPTCHA',
          'Completar CAPTCHA → deve permitir nova tentativa',
          'Login bem-sucedido → deve resetar contador',
          'Diferentes IPs → contadores independentes',
          'TTL de 24h → registros antigos deletados'
        ]
      },
      riscos: [
        'CAPTCHA pode impactar UX - mitigar com reCAPTCHA v3 invisível primeiro',
        'Whitelist de IPs pode ser complexa - implementar apenas se solicitado',
        'Rate limit muito agressivo pode bloquear usuários legítimos - ajustar thresholds'
      ],
      metricas: [
        'Número de CAPTCHAs exibidos/dia',
        'Taxa de sucesso após CAPTCHA',
        'Tentativas bloqueadas por IP',
        'Falsos positivos (usuários legítimos bloqueados)'
      ]
    },
    {
      id: 'headers-seguros',
      categoria: 'Infraestrutura',
      titulo: 'Headers HTTP Seguros Completos',
      prioridade: 'alta',
      complexidade: 'baixa',
      tempo: '1-2 dias',
      status: 'planejado',
      descricao: 'Implementar headers de segurança HTTP completos: CSP rigoroso, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.',
      motivacao: [
        'Proteção contra XSS, clickjacking, MIME sniffing',
        'Conformidade com OWASP Top 10',
        'Auditoria de segurança (GRIF-002/2024)',
        'Melhoria no score de segurança (Mozilla Observatory)'
      ],
      requisitos: [
        'Configuração de headers no nível de aplicação',
        'CSP que permita recursos necessários (Base44, Lucide, etc)',
        'HSTS com max-age adequado',
        'Testes de compatibilidade com navegadores'
      ],
      implementacao: {
        etapas: [
          {
            nome: '1. Atualizar index.html com Meta Tags',
            detalhes: [
              'Content-Security-Policy completo',
              'X-Frame-Options: DENY',
              'X-Content-Type-Options: nosniff',
              'Referrer-Policy: strict-origin-when-cross-origin',
              'Permissions-Policy (desabilitar recursos não usados)'
            ]
          },
          {
            nome: '2. Configurar CSP Detalhado',
            detalhes: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' (necessário para React)",
              "style-src 'self' 'unsafe-inline' (necessário para Tailwind)",
              "img-src 'self' data: https: (permitir imagens externas)",
              "connect-src 'self' https://*.supabase.co (Base44 API)",
              "font-src 'self' data:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ]
          },
          {
            nome: '3. HSTS Configuration',
            detalhes: [
              'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
              'Garantir que app funciona 100% em HTTPS antes de ativar',
              'Considerar preload list do Google (opcional, irreversível)'
            ]
          },
          {
            nome: '4. Documentar Headers',
            detalhes: [
              'Adicionar à documentação de segurança',
              'Justificar cada diretiva CSP',
              'Processo de atualização quando adicionar novos recursos'
            ]
          }
        ],
        stack: [
          'index.html (meta tags)',
          'Documentação: SegurancaSection',
          'Testing: Mozilla Observatory, securityheaders.com'
        ],
        testes: [
          'Verificar headers com DevTools → Network',
          'Testar app em diferentes navegadores (Chrome, Firefox, Safari, Edge)',
          'Validar no Mozilla Observatory (score A)',
          'Validar no securityheaders.com',
          'Garantir que não quebra funcionalidades (upload, mapas, etc)'
        ]
      },
      riscos: [
        'CSP muito restritivo pode quebrar funcionalidades - testar extensivamente',
        "unsafe-inline necessário para Tailwind - aceitar ou migrar para CSS extraído",
        'HSTS irreversível se preload - ativar preload apenas em produção estável'
      ],
      metricas: [
        'Score Mozilla Observatory (meta: A)',
        'Score securityheaders.com (meta: A)',
        'Violações CSP reportadas (via report-uri)'
      ]
    },
    {
      id: 'backup-testado',
      categoria: 'DR/BCP',
      titulo: 'Plano DR + Backup Testado',
      prioridade: 'média',
      complexidade: 'alta',
      tempo: '7-10 dias',
      status: 'planejado',
      descricao: 'Documentar Plano de Disaster Recovery completo com BIA, RTO/RPO, procedimentos de backup e testes de restauração.',
      motivacao: [
        'Continuidade de negócio em caso de desastre',
        'Conformidade com GRIF-002/2024 e ISO 27001',
        'Reduzir MTTR (Mean Time To Recovery)',
        'Proteção contra perda de dados críticos'
      ],
      requisitos: [
        'BIA - Business Impact Analysis documentado',
        'Definição de RTO (Recovery Time Objective)',
        'Definição de RPO (Recovery Point Objective)',
        'Procedimentos automatizados de backup',
        'Testes periódicos de restauração',
        'Runbook de recuperação de desastres'
      ],
      implementacao: {
        etapas: [
          {
            nome: '1. Business Impact Analysis (BIA)',
            detalhes: [
              'Identificar processos críticos do AlmoxHub',
              'Categorizar por criticidade: Crítico (< 4h), Alto (< 24h), Médio (< 72h)',
              'Listar dependências: Base44, Supabase, DNS, etc',
              'Estimar impacto financeiro de downtime por hora',
              'Identificar stakeholders chave'
            ]
          },
          {
            nome: '2. Definir RTO/RPO por Entity',
            detalhes: [
              'OrdemServico: RTO 4h, RPO 1h (crítico)',
              'Pessoa, Regional, Almoxarifado: RTO 8h, RPO 4h (alto)',
              'Comentarios, Mensagens: RTO 24h, RPO 4h (médio)',
              'AuditLog: RTO 48h, RPO 24h (baixo)',
              'Documentar em tabela estruturada'
            ]
          },
          {
            nome: '3. Estratégia de Backup',
            detalhes: [
              'Base44 possui backup automático (confirmar SLA)',
              'Exportação preventiva semanal de entidades críticas',
              'Backend function: exportBackupCritico',
              'Armazenar em storage separado (não apenas Base44)',
              'Versionamento: manter últimas 4 semanas',
              'Encryption at rest (AES-256)'
            ]
          },
          {
            nome: '4. Procedimentos de Restauração',
            detalhes: [
              'Runbook passo-a-passo por cenário:',
              '  - Perda total de dados (restore full)',
              '  - Corrupção de entity específica (restore parcial)',
              '  - Disaster recovery (novo ambiente)',
              'Scripts de automação para restore',
              'Contatos de emergência (Base44 support, DBA)',
              'Checklist de validação pós-restore'
            ]
          },
          {
            nome: '5. Testes Periódicos',
            detalhes: [
              'Teste trimestral de restauração (simulação)',
              'Ambiente de staging para testes',
              'Documentar resultados e MTTR real',
              'Ajustar procedimentos conforme aprendizados',
              'Automation mensal de export preventivo'
            ]
          },
          {
            nome: '6. Documentação',
            detalhes: [
              'Criar página PlanoDR na documentação',
              'Tabelas: BIA, RTO/RPO, Contacts',
              'Diagramas de fluxo de recuperação',
              'Acessível a admin e gestores'
            ]
          }
        ],
        stack: [
          'Backend: exportBackupCritico function',
          'Package: xlsx para export estruturado',
          'Storage: Base44 private files ou S3',
          'Automation: backup semanal + teste trimestral',
          'Docs: components/documentacao/PlanoDRSection'
        ],
        testes: [
          'Executar export completo → validar arquivo',
          'Simular restore em staging → medir tempo',
          'Verificar integridade dos dados restaurados',
          'Testar restore de entity específica',
          'Documentar MTTR real vs objetivo'
        ]
      },
      riscos: [
        'RTO muito agressivo pode ser inatingível - definir realista',
        'Testes de DR podem impactar produção - usar staging',
        'Custo de armazenamento de backups - otimizar retenção',
        'Dependência da Base44 para restore - ter plano B'
      ],
      metricas: [
        'MTTR (Mean Time To Recovery) em testes',
        'RPO real (tempo desde último backup)',
        'Taxa de sucesso de testes de restore',
        'Tamanho dos backups por semana',
        'Tempo de execução do backup'
      ]
    },
    {
      id: 'privacy-by-design-doc',
      categoria: 'LGPD',
      titulo: 'Privacy by Design - Documentação Completa',
      prioridade: 'média',
      complexidade: 'baixa',
      tempo: '2-3 dias',
      status: 'implementado',
      descricao: 'Documentar os 7 princípios de Privacy by Design e bases legais de tratamento de dados conforme LGPD.',
      motivacao: [
        'Demonstrar conformidade proativa com LGPD',
        'Facilitar auditorias e fiscalizações',
        'Base para RIPD e relatórios à ANPD',
        'Transparência com titulares de dados'
      ],
      requisitos: [
        'Documentação dos 7 princípios de Privacy by Design',
        'Mapeamento de bases legais por entidade',
        'Inventário de dados pessoais tratados',
        'Finalidades de tratamento documentadas',
        'Medidas de segurança por princípio'
      ],
      implementacao: {
        etapas: [
          {
            nome: '1. Documentar 7 Princípios',
            detalhes: [
              'Proativo e preventivo (não reativo)',
              'Privacidade como padrão (default)',
              'Privacidade incorporada no design',
              'Funcionalidade total (soma positiva)',
              'Segurança end-to-end',
              'Visibilidade e transparência',
              'Respeito pela privacidade do usuário',
              'Evidências de implementação por princípio'
            ]
          },
          {
            nome: '2. Mapear Bases Legais',
            detalhes: [
              'Pessoa: execução de contrato (trabalhista)',
              'OrdemServico: execução de contrato',
              'Consentimento: notificações push (opcional)',
              'Obrigação legal: AuditLog (transparência)',
              'Interesse legítimo: analytics (se aplicável)',
              'Tabela: Entity → Base Legal → Finalidade'
            ]
          },
          {
            nome: '3. Inventário de Dados',
            detalhes: [
              'Dados pessoais: nome, email, CPF, matrícula',
              'Dados sensíveis: nenhum coletado (confirmar)',
              'Dados de crianças: não aplicável',
              'Dados de terceiros: fornecedores, transportadoras',
              'Fluxo de dados: coleta → armazenamento → descarte'
            ]
          },
          {
            nome: '4. Criar Seção na Documentação',
            detalhes: [
              'PrivacyByDesignSection component',
              'Cards por princípio com evidências',
              'Tabela de bases legais',
              'Diagrama de fluxo de dados (opcional)',
              'Link para Portal do Titular'
            ]
          }
        ],
        stack: [
          'Component: PrivacyByDesignSection',
          'Docs integrados na aba Segurança',
          'Referências: LGPD Art. 7º, 10º, 11º'
        ],
        testes: [
          'Revisar com DPO (se houver)',
          'Validar com jurídico',
          'Garantir que bases legais são sólidas',
          'Verificar se todos dados têm finalidade clara'
        ]
      },
      riscos: [
        'Base legal inadequada pode gerar não-conformidade - validar com jurídico',
        'Dados sensíveis não identificados - auditoria completa necessária',
        'Documentação desatualizada - processo de revisão periódica'
      ],
      metricas: [
        'Cobertura: % entities com base legal documentada',
        'Auditorias LGPD aprovadas',
        'Solicitações de titular atendidas no prazo'
      ]
    }
  ];

  const getPrioridadeBadge = (prioridade) => {
    const badges = {
      alta: <Badge className="bg-red-500">Alta</Badge>,
      média: <Badge className="bg-yellow-500">Média</Badge>,
      baixa: <Badge className="bg-green-500">Baixa</Badge>
    };
    return badges[prioridade];
  };

  const getComplexidadeBadge = (complexidade) => {
    const badges = {
      alta: <Badge variant="outline" className="border-red-500 text-red-600">Alta</Badge>,
      média: <Badge variant="outline" className="border-yellow-500 text-yellow-600">Média</Badge>,
      baixa: <Badge variant="outline" className="border-green-500 text-green-600">Baixa</Badge>
    };
    return badges[complexidade];
  };

  const getStatusBadge = (status) => {
    const badges = {
      implementado: <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Implementado</Badge>,
      planejado: <Badge className="bg-blue-600"><Clock className="w-3 h-3 mr-1" /> Planejado</Badge>
    };
    return badges[status];
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong>Plano de Melhorias de Segurança</strong> - Implementação estruturada de recomendações GRIF-002/2024 e boas práticas de mercado.
        </AlertDescription>
      </Alert>

      {/* Resumo Executivo */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{melhorias.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Melhorias Planejadas</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {melhorias.filter(m => m.status === 'implementado').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Implementadas</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {melhorias.filter(m => m.prioridade === 'alta').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Alta Prioridade</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">13-20</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Dias (Total)</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg">
            <h4 className="font-semibold mb-2">Ordem de Implementação Sugerida</h4>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span><strong>Privacy by Design</strong> - Documentação (2-3 dias) ✅ Implementado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span><strong>Headers Seguros</strong> - Quick win, alta prioridade (1-2 dias)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span><strong>Rate Limiting + CAPTCHA</strong> - Segurança autenticação (3-5 dias)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span><strong>Plano DR + Backup</strong> - Continuidade de negócio (7-10 dias)</span>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento de Melhorias */}
      {melhorias.map((melhoria) => (
        <Card key={melhoria.id} className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl">{melhoria.titulo}</CardTitle>
                  {getStatusBadge(melhoria.status)}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{melhoria.descricao}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Prioridade:</span>
                {getPrioridadeBadge(melhoria.prioridade)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Complexidade:</span>
                {getComplexidadeBadge(melhoria.complexidade)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Tempo:</span>
                <Badge variant="outline">{melhoria.tempo}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Categoria:</span>
                <Badge variant="outline">{melhoria.categoria}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs defaultValue="motivacao" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="motivacao">Motivação</TabsTrigger>
                <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
                <TabsTrigger value="implementacao">Implementação</TabsTrigger>
                <TabsTrigger value="riscos">Riscos</TabsTrigger>
                <TabsTrigger value="metricas">Métricas</TabsTrigger>
              </TabsList>

              <TabsContent value="motivacao" className="space-y-3">
                <h4 className="font-semibold">Por que implementar?</h4>
                <ul className="space-y-2">
                  {melhoria.motivacao.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="requisitos" className="space-y-3">
                <h4 className="font-semibold">Requisitos Técnicos</h4>
                <ul className="space-y-2">
                  {melhoria.requisitos.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="implementacao" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Etapas de Implementação</h4>
                  {melhoria.implementacao.etapas.map((etapa, idx) => (
                    <Collapsible key={idx} open={expandedItems[`${melhoria.id}-${idx}`]} onOpenChange={() => toggleItem(`${melhoria.id}-${idx}`)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-3 mb-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <span className="font-medium text-left">{etapa.nome}</span>
                          {expandedItems[`${melhoria.id}-${idx}`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4 mb-4">
                        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          {etapa.detalhes.map((detalhe, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2">
                              <span className="text-purple-600">→</span>
                              <span>{detalhe}</span>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Stack Técnico</h4>
                  <div className="flex flex-wrap gap-2">
                    {melhoria.implementacao.stack.map((tech, idx) => (
                      <Badge key={idx} variant="outline" className="bg-white dark:bg-slate-800">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Critérios de Aceitação (Testes)</h4>
                  <ul className="space-y-1 text-sm">
                    {melhoria.implementacao.testes.map((teste, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{teste}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="riscos" className="space-y-3">
                <h4 className="font-semibold">Riscos e Mitigação</h4>
                <div className="space-y-3">
                  {melhoria.riscos.map((risco, idx) => (
                    <Alert key={idx} className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-sm">{risco}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="metricas" className="space-y-3">
                <h4 className="font-semibold">Métricas de Sucesso</h4>
                <ul className="space-y-2">
                  {melhoria.metricas.map((metrica, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-600 font-bold">📊</span>
                      <span>{metrica}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}

      {/* Timeline */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <CardTitle>Timeline Sugerida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative pl-8 pb-4 border-l-2 border-blue-500">
              <div className="absolute -left-2 top-0 w-4 h-4 bg-green-500 rounded-full" />
              <h4 className="font-semibold text-green-700 dark:text-green-300">✅ Concluído</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Privacy by Design - Documentação (2-3 dias)</p>
            </div>

            <div className="relative pl-8 pb-4 border-l-2 border-blue-500">
              <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full" />
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">Semana 1-2</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Headers HTTP Seguros (1-2 dias)</p>
            </div>

            <div className="relative pl-8 pb-4 border-l-2 border-blue-500">
              <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full" />
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">Semana 2-3</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Rate Limiting + CAPTCHA (3-5 dias)</p>
            </div>

            <div className="relative pl-8 border-l-2 border-dashed border-blue-300">
              <div className="absolute -left-2 top-0 w-4 h-4 bg-purple-500 rounded-full" />
              <h4 className="font-semibold text-purple-700 dark:text-purple-300">Semana 4-5</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Plano DR + Backup Testado (7-10 dias)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}