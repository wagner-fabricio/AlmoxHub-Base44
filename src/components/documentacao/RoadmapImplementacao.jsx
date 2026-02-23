import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  Paperclip, 
  Building, 
  DollarSign, 
  Clock, 
  Shield, 
  Smartphone,
  Lock,
  FileText,
  UserCheck,
  CheckCircle2,
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function RoadmapImplementacao() {
  const recursos = [
    {
      id: 'alertas_configuraveis',
      titulo: '✅ Alertas Configuráveis',
      descricao: 'IMPLEMENTADO - Entity, backend function, automation diária',
      icon: AlertCircle,
      prioridade: 'media',
      complexidade: 'media',
      estimativa: '3-5 dias',
      categoria: 'funcionalidades',
      status: 'implementado',
      dependencias: ['NotificationPreferences entity já existe'],
      stackTecnico: [
        'Nova entity: AlertaConfig',
        'Backend function: checkCustomAlerts',
        'React component: AlertConfigForm',
        'Automation: scheduled daily check'
      ],
      implementacao: [
        {
          etapa: 'Entity AlertaConfig',
          detalhes: [
            'user_id: string (quem configurou)',
            'tipo_alerta: enum (atraso_os, inatividade, prazo_proximo, etc)',
            'threshold_dias: number (ex: alertar 3 dias antes)',
            'threshold_percentual: number (ex: alertar quando progresso < 50%)',
            'destinatarios_ids: array (quem recebe)',
            'canal: enum (email, push, in-app)',
            'ativo: boolean'
          ]
        },
        {
          etapa: 'Backend Function',
          detalhes: [
            'checkCustomAlerts.js - roda diariamente via automation',
            'Buscar todas AlertaConfig ativas',
            'Para cada alerta, verificar condição',
            'Se condição atendida, criar Notificacao',
            'Enviar via canal configurado'
          ]
        },
        {
          etapa: 'Frontend Component',
          detalhes: [
            'AlertConfigPage.jsx - CRUD de alertas',
            'Filtros por tipo, status, destinatários',
            'Preview de alertas que seriam disparados',
            'Histórico de alertas enviados'
          ]
        },
        {
          etapa: 'Automation',
          detalhes: [
            'create_automation: scheduled, daily, 06:00',
            'function_name: checkCustomAlerts',
            'description: Verificar alertas customizados'
          ]
        }
      ],
      criteriosAceitacao: [
        'Usuário pode criar alerta personalizado',
        'Alerta dispara quando condição é atendida',
        'Destinatários recebem notificação',
        'Histórico de alertas é registrado',
        'Admin pode ver todos alertas do sistema'
      ]
    },
    {
      id: 'anexos_mensagens',
      titulo: '✅ Anexos em Mensagens',
      descricao: 'IMPLEMENTADO - Upload arquivos, preview imagens, 5 anexos/msg',
      icon: Paperclip,
      prioridade: 'alta',
      complexidade: 'media',
      estimativa: '2-3 dias',
      categoria: 'funcionalidades',
      status: 'implementado',
      dependencias: ['MensagemChat entity já existe', 'UploadFile integration disponível'],
      stackTecnico: [
        'Atualizar MensagemChat entity',
        'Upload de arquivos (base44.integrations.Core.UploadFile)',
        'Preview de imagens inline',
        'Download de arquivos'
      ],
      implementacao: [
        {
          etapa: 'Atualizar MensagemChat Entity',
          detalhes: [
            'anexos: array de { file_url, file_name, file_type, file_size }',
            'Limite: 5 anexos por mensagem',
            'Tamanho máximo: 10MB por arquivo'
          ]
        },
        {
          etapa: 'ChatArea Component',
          detalhes: [
            'Botão de anexar arquivo (input type="file")',
            'Preview de arquivos antes de enviar',
            'Indicador de upload (progress bar)',
            'Compressão de imagens (usar imageCompression utility)',
            'Validação de tipo e tamanho'
          ]
        },
        {
          etapa: 'MessageBubble Component',
          detalhes: [
            'Renderizar preview de imagens inline',
            'Lightbox para visualizar imagens',
            'Links de download para outros arquivos',
            'Ícones por tipo de arquivo (PDF, DOC, XLS, etc)'
          ]
        },
        {
          etapa: 'Security',
          detalhes: [
            'Validar extensões permitidas (.jpg, .png, .pdf, .docx, .xlsx)',
            'Scan de vírus (opcional, via backend function)',
            'Expiração de URLs após 30 dias (usar signed URLs)'
          ]
        }
      ],
      criteriosAceitacao: [
        'Usuário pode anexar até 5 arquivos por mensagem',
        'Imagens são exibidas inline com preview',
        'Outros arquivos têm link de download',
        'Compressão automática de imagens > 2MB',
        'Apenas extensões permitidas são aceitas',
        'Arquivos ficam disponíveis por 30 dias'
      ]
    },
    {
      id: 'fornecedores',
      titulo: '✅ Fornecedores',
      descricao: 'IMPLEMENTADO - CRUD completo, vinculação em OS',
      icon: Building,
      prioridade: 'media',
      complexidade: 'baixa',
      estimativa: '1-2 dias',
      categoria: 'cadastros',
      status: 'implementado',
      dependencias: [],
      stackTecnico: [
        'Nova entity: Fornecedor',
        'CRUD page: Fornecedores.jsx',
        'Vinculação em OrdemServico'
      ],
      implementacao: [
        {
          etapa: 'Entity Fornecedor',
          detalhes: [
            'razao_social: string (required)',
            'nome_fantasia: string',
            'cnpj: string (unique, required)',
            'inscricao_estadual: string',
            'endereco: object { logradouro, numero, complemento, bairro, cidade, estado, cep }',
            'contatos: array [{ nome, cargo, email, telefone }]',
            'categoria: enum (materiais, servicos, transporte, equipamentos)',
            'codigo_sap: string',
            'banco: object { banco, agencia, conta }',
            'observacoes: string',
            'ativo: boolean (default: true)',
            'data_cadastro: date',
            'anexos: array (contratos, certidões)'
          ]
        },
        {
          etapa: 'Page Fornecedores.jsx',
          detalhes: [
            'Lista com filtros (categoria, ativo/inativo, busca)',
            'Modal de criação/edição (FornecedorFormModal)',
            'Visualização de detalhes (FornecedorDetailModal)',
            'Upload de anexos (contratos, certidões)',
            'Soft-delete (marcar como inativo)',
            'Exportação para Excel/PDF'
          ]
        },
        {
          etapa: 'Vinculação em OS',
          detalhes: [
            'Adicionar campo fornecedor_id em OrdemServico',
            'Select de fornecedores no OSFormModal',
            'Exibir fornecedor no OSDetailModal',
            'Filtro por fornecedor em OSFilters'
          ]
        },
        {
          etapa: 'RLS (Row Level Security)',
          detalhes: [
            'Admin: full access',
            'Gestor: full access',
            'Líder: read only',
            'Almoxarife: read only'
          ]
        }
      ],
      criteriosAceitacao: [
        'Admin/Gestor pode criar/editar/deletar fornecedores',
        'CNPJ é validado e único',
        'Líder/Almoxarife pode visualizar fornecedores',
        'Fornecedor pode ser vinculado a OS',
        'Histórico de OS por fornecedor é visível',
        'Anexos (contratos) ficam salvos no fornecedor'
      ]
    },
    {
      id: 'centros_custo',
      titulo: '✅ Centros de Custo',
      descricao: 'IMPLEMENTADO - CRUD, vinculação OS, dashboard consumo',
      icon: DollarSign,
      prioridade: 'alta',
      complexidade: 'baixa',
      estimativa: '1-2 dias',
      categoria: 'cadastros',
      status: 'implementado',
      dependencias: [],
      stackTecnico: [
        'Nova entity: CentroCusto',
        'CRUD page: CentrosCusto.jsx',
        'Vinculação em OrdemServico'
      ],
      implementacao: [
        {
          etapa: 'Entity CentroCusto',
          detalhes: [
            'codigo: string (required, unique) - ex: CC-001',
            'nome: string (required)',
            'descricao: string',
            'tipo: enum (operacional, investimento, administrativo)',
            'regional_id: string (vinculado a Regional)',
            'gestor_id: string (vinculado a Pessoa)',
            'orcamento_anual: number',
            'gasto_acumulado: number (calculado)',
            'ativo: boolean (default: true)'
          ]
        },
        {
          etapa: 'Page CentrosCusto.jsx',
          detalhes: [
            'Lista com filtros (regional, tipo, gestor)',
            'Modal de criação/edição',
            'Dashboard de consumo (gasto vs orçamento)',
            'Gráfico de evolução mensal',
            'Lista de OS vinculadas ao CC'
          ]
        },
        {
          etapa: 'Vinculação em OS',
          detalhes: [
            'Adicionar campo centro_custo_id em OrdemServico',
            'Select de CCs no OSFormModal',
            'Validação: apenas CCs ativos e da mesma regional',
            'Exibir CC no OSDetailModal',
            'Filtro por CC em OSFilters'
          ]
        },
        {
          etapa: 'Dashboard Analytics',
          detalhes: [
            'Adicionar card "Consumo por Centro de Custo"',
            'Gráfico de barras: CC vs Gasto',
            'Alertas: CC acima de 80% do orçamento',
            'Exportação de relatório por CC'
          ]
        }
      ],
      criteriosAceitacao: [
        'Admin/Gestor pode criar CCs',
        'Código do CC é único',
        'OS pode ser vinculada a CC',
        'Dashboard mostra consumo por CC',
        'Alerta quando CC ultrapassa 80% orçamento',
        'Relatório de OS por CC é exportável'
      ]
    },
    {
      id: 'timeout_sessao',
      titulo: '✅ Timeout de Sessão',
      descricao: 'IMPLEMENTADO - 15min inatividade com modal de aviso',
      icon: Clock,
      prioridade: 'alta',
      complexidade: 'media',
      estimativa: '2-3 dias',
      categoria: 'seguranca',
      status: 'implementado',
      dependencias: ['Base44 não suporta timeout nativo'],
      stackTecnico: [
        'React hook: useIdleTimer',
        'localStorage para último acesso',
        'Modal de aviso antes do logout',
        'Backend function para invalidar tokens'
      ],
      implementacao: [
        {
          etapa: 'Hook useIdleTimer',
          detalhes: [
            'Criar hooks/useIdleTimer.js',
            'Monitorar eventos: mousemove, keypress, scroll, click',
            'Timeout configurável (default: 15min)',
            'Warning modal 2min antes do logout',
            'Auto logout após timeout'
          ]
        },
        {
          etapa: 'Layout Integration',
          detalhes: [
            'Importar useIdleTimer no Layout.js',
            'Mostrar modal de aviso 2min antes',
            'Botão "Continuar conectado" reseta timer',
            'Botão "Sair agora" faz logout imediato',
            'Salvar última atividade no localStorage'
          ]
        },
        {
          etapa: 'IdleWarningModal Component',
          detalhes: [
            'Modal não-dismissível (backdrop-static)',
            'Countdown de 2min até logout',
            'Botões: "Continuar Conectado" e "Sair"',
            'Design: ícone de relógio, texto explicativo'
          ]
        },
        {
          etapa: 'Configuration',
          detalhes: [
            'Admin pode configurar timeout (5, 10, 15, 30min)',
            'Armazenar em variável de ambiente ou entity Config',
            'Diferentes timeouts por role (admin = 30min, user = 15min)'
          ]
        }
      ],
      criteriosAceitacao: [
        'Após 15min de inatividade, modal de aviso aparece',
        'Countdown de 2min é exibido',
        'Qualquer atividade reseta o timer',
        'Após timeout, usuário é deslogado automaticamente',
        'Última atividade é registrada no localStorage',
        'Configuração por role funciona corretamente'
      ]
    },
    {
      id: 'headers_http_seguros',
      titulo: '✅ Headers HTTP Seguros',
      descricao: 'IMPLEMENTADO - CSP completo, HSTS, X-Frame-Options, Referrer-Policy',
      icon: Shield,
      prioridade: 'alta',
      complexidade: 'baixa',
      estimativa: '1 dia',
      categoria: 'seguranca',
      status: 'implementado',
      dependencias: ['Requer configuração no servidor Base44'],
      stackTecnico: [
        'CSP (Content Security Policy)',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Strict-Transport-Security',
        'Referrer-Policy'
      ],
      implementacao: [
        {
          etapa: 'CSP via Meta Tag (index.html)',
          detalhes: [
            '<meta http-equiv="Content-Security-Policy" content="...">',
            'default-src \'self\'',
            'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https:',
            'style-src \'self\' \'unsafe-inline\' https:',
            'img-src \'self\' data: https: blob:',
            'font-src \'self\' data: https:',
            'connect-src \'self\' https:',
            'frame-src \'self\' https:'
          ]
        },
        {
          etapa: 'Outros Headers (via index.html)',
          detalhes: [
            'X-Frame-Options: SAMEORIGIN',
            'X-Content-Type-Options: nosniff',
            'Referrer-Policy: strict-origin-when-cross-origin',
            'Permissions-Policy: geolocation=(self), microphone=()'
          ]
        },
        {
          etapa: 'Backend Functions Headers',
          detalhes: [
            'Adicionar headers em todas responses de functions',
            'Middleware comum para headers de segurança',
            'HSTS: Strict-Transport-Security (via Base44 infra)'
          ]
        },
        {
          etapa: 'Testing',
          detalhes: [
            'Testar com securityheaders.com',
            'Verificar score A ou superior',
            'Garantir que app funciona com CSP habilitado',
            'Ajustar CSP conforme necessário'
          ]
        }
      ],
      criteriosAceitacao: [
        'CSP habilitado em produção',
        'Score A em securityheaders.com',
        'Aplicação funciona sem erros de CSP',
        'X-Frame-Options protege contra clickjacking',
        'HSTS ativo (via infra Base44)',
        'Nenhum inline script/style viola CSP'
      ]
    },
    {
      id: 'touch_gestures',
      titulo: 'Touch Gestures Avançados',
      descricao: 'Swipe básico, falta gestures avançados',
      icon: Smartphone,
      prioridade: 'baixa',
      complexidade: 'media',
      estimativa: '2-3 dias',
      categoria: 'mobile',
      dependencias: ['EmFluxo page já existe'],
      stackTecnico: [
        'react-swipeable ou framer-motion',
        'Gestures: swipe, long-press, pinch-to-zoom',
        'Haptic feedback (vibration API)'
      ],
      implementacao: [
        {
          etapa: 'Instalar react-swipeable',
          detalhes: [
            'npm install react-swipeable',
            'Ou usar framer-motion gestures (já instalado)'
          ]
        },
        {
          etapa: 'Swipe Gestures',
          detalhes: [
            'Swipe right em OS card: abrir detail',
            'Swipe left em OS card: ações rápidas (editar, deletar)',
            'Swipe down: refresh page',
            'Swipe up no chat: scroll to bottom'
          ]
        },
        {
          etapa: 'Long Press',
          detalhes: [
            'Long press em OS card: selecionar para bulk update',
            'Long press em mensagem: menu de contexto (copiar, deletar)',
            'Haptic feedback ao long press'
          ]
        },
        {
          etapa: 'Pinch to Zoom',
          detalhes: [
            'Pinch em imagens: zoom in/out',
            'Double tap em imagem: toggle fullscreen',
            'Usar react-zoom-pan-pinch ou similar'
          ]
        },
        {
          etapa: 'Haptic Feedback',
          detalhes: [
            'Vibração curta ao completar ação',
            'Vibração dupla ao erro',
            'navigator.vibrate([50]) para feedback'
          ]
        }
      ],
      criteriosAceitacao: [
        'Swipe right/left funciona em cards',
        'Long press abre menu de contexto',
        'Pinch to zoom funciona em imagens',
        'Haptic feedback em ações importantes',
        'Gestures são suaves e responsivos (60fps)',
        'Funciona em iOS e Android'
      ]
    },
    {
      id: 'privacy_by_design',
      titulo: '✅ Privacy by Design',
      descricao: 'IMPLEMENTADO - 7 princípios documentados com evidências',
      icon: Lock,
      prioridade: 'alta',
      complexidade: 'baixa',
      estimativa: '2 dias',
      categoria: 'lgpd',
      status: 'implementado',
      dependencias: [],
      stackTecnico: [
        'Documentação em Markdown/PDF',
        'Seção na página de Documentação'
      ],
      implementacao: [
        {
          etapa: 'Documento Privacy by Design',
          detalhes: [
            'Princípio 1: Proativo, não reativo',
            'Princípio 2: Privacidade como padrão',
            'Princípio 3: Privacidade incorporada no design',
            'Princípio 4: Funcionalidade total (win-win)',
            'Princípio 5: Segurança de ponta a ponta',
            'Princípio 6: Visibilidade e transparência',
            'Princípio 7: Respeito pela privacidade do usuário'
          ]
        },
        {
          etapa: 'Evidências de Aplicação',
          detalhes: [
            'Minimização de dados: apenas campos necessários',
            'Criptografia: Base44 DB encrypted at rest',
            'RLS: políticas por role e ownership',
            'Soft-delete: recuperação em 30 dias',
            'Logs de auditoria: rastreabilidade completa',
            'Consentimento: (a implementar)',
            'Anonimização: (a implementar)'
          ]
        },
        {
          etapa: 'Seção na Documentação',
          detalhes: [
            'Adicionar tab "Privacy by Design" na Documentação',
            'Listar os 7 princípios com exemplos práticos',
            'Mapear cada princípio para funcionalidades do sistema',
            'Gerar PDF para compartilhar com DPO/jurídico'
          ]
        }
      ],
      criteriosAceitacao: [
        'Documento Privacy by Design criado',
        'Todos 7 princípios documentados',
        'Evidências de aplicação mapeadas',
        'Seção acessível na Documentação',
        'PDF exportável para DPO',
        'Aprovação do jurídico/DPO'
      ]
    },
    {
      id: 'ripd',
      titulo: '✅ RIPD - Relatório de Impacto',
      descricao: 'IMPLEMENTADO - Wizard 10 seções, geração PDF, versionamento',
      icon: FileText,
      prioridade: 'alta',
      complexidade: 'alta',
      estimativa: '5-7 dias',
      categoria: 'lgpd',
      status: 'implementado',
      dependencias: ['Requer envolvimento do DPO'],
      stackTecnico: [
        'Template RIPD (ANPD)',
        'Form wizard para preenchimento',
        'Geração de PDF com assinatura digital'
      ],
      implementacao: [
        {
          etapa: 'Estrutura do RIPD',
          detalhes: [
            '1. Identificação do controlador e DPO',
            '2. Descrição do tratamento de dados',
            '3. Finalidade e base legal',
            '4. Dados pessoais tratados (categorias)',
            '5. Titulares dos dados',
            '6. Riscos identificados',
            '7. Medidas de mitigação',
            '8. Análise de necessidade e proporcionalidade',
            '9. Transferências internacionais',
            '10. Conclusão e recomendações'
          ]
        },
        {
          etapa: 'Entity RIPD',
          detalhes: [
            'titulo: string',
            'versao: string',
            'data_elaboracao: date',
            'elaborado_por: string (DPO)',
            'status: enum (rascunho, em_revisao, aprovado)',
            'secoes: object (JSON com todas seções)',
            'riscos_identificados: array',
            'medidas_mitigacao: array',
            'anexos: array (evidências)',
            'aprovado_por: string',
            'data_aprovacao: date'
          ]
        },
        {
          etapa: 'Wizard de Preenchimento',
          detalhes: [
            'Multi-step form (10 etapas)',
            'Seção 1: Identificação (auto-preenchido)',
            'Seção 2-10: Forms específicos por seção',
            'Salvar progresso automaticamente',
            'Validação por etapa',
            'Preview final antes de gerar PDF'
          ]
        },
        {
          etapa: 'Geração de PDF',
          detalhes: [
            'Template profissional com logo Axia',
            'Índice automático',
            'Numeração de páginas',
            'Cabeçalho/rodapé com versão e data',
            'Assinatura digital (opcional)',
            'Exportar para revisão do DPO'
          ]
        }
      ],
      criteriosAceitacao: [
        'RIPD pode ser criado via wizard',
        'Todas 10 seções são preenchíveis',
        'Progresso é salvo automaticamente',
        'PDF é gerado conforme template ANPD',
        'DPO pode revisar e aprovar',
        'Histórico de versões é mantido',
        'RIPD aprovado é acessível apenas para admin/DPO'
      ]
    },
    {
      id: 'portal_titular',
      titulo: '✅ Portal do Titular',
      descricao: 'IMPLEMENTADO - Form público, prazo 15 dias, geração de dados',
      icon: UserCheck,
      prioridade: 'alta',
      complexidade: 'alta',
      estimativa: '7-10 dias',
      categoria: 'lgpd',
      status: 'implementado',
      dependencias: ['RIPD', 'Privacy by Design'],
      stackTecnico: [
        'Entity: SolicitacaoTitular',
        'Form público (sem login)',
        'Workflow de aprovação',
        'Geração automática de relatórios'
      ],
      implementacao: [
        {
          etapa: 'Entity SolicitacaoTitular',
          detalhes: [
            'protocolo: string (auto-gerado)',
            'tipo: enum (acesso, correcao, exclusao, portabilidade, oposicao)',
            'status: enum (pendente, em_analise, aprovada, rejeitada, concluida)',
            'titular_nome: string',
            'titular_email: string',
            'titular_cpf: string',
            'titular_telefone: string',
            'descricao: string (detalhes da solicitação)',
            'anexos: array (comprovantes de identidade)',
            'data_solicitacao: date',
            'data_resposta: date',
            'resposta: string',
            'dados_gerados: object (para portabilidade)',
            'aprovado_por: string (admin/DPO)',
            'prazo_legal: date (15 dias)'
          ]
        },
        {
          etapa: 'Form Público',
          detalhes: [
            'Página pública: /portal-titular (sem auth)',
            'Form: nome, email, CPF, telefone, tipo, descrição',
            'Upload de comprovante de identidade (RG/CNH)',
            'Captcha para evitar spam',
            'Envio cria SolicitacaoTitular',
            'Email de confirmação com protocolo',
            'Link de acompanhamento (public, via protocolo + email)'
          ]
        },
        {
          etapa: 'Dashboard Admin/DPO',
          detalhes: [
            'Lista de solicitações (filtros: tipo, status, prazo)',
            'Alerta: solicitações próximas do prazo legal (15 dias)',
            'Ações: aprovar, rejeitar, solicitar mais info',
            'Para tipo "acesso": gerar relatório de dados do titular',
            'Para tipo "exclusão": confirmar e executar soft-delete',
            'Para tipo "portabilidade": exportar dados em JSON/CSV',
            'Envio de resposta ao titular via email'
          ]
        },
        {
          etapa: 'Geração Automática de Dados',
          detalhes: [
            'Buscar todos dados do titular (via email ou CPF)',
            'Entidades: Pessoa, OrdemServico (created_by), Comentario, MensagemChat',
            'Gerar JSON estruturado com todos dados',
            'Opção de download em CSV',
            'Anonimizar dados sensíveis de terceiros',
            'Enviar via email ou disponibilizar download'
          ]
        }
      ],
      criteriosAceitacao: [
        'Titular pode fazer solicitação sem login',
        'Protocolo é gerado automaticamente',
        'Titular recebe confirmação via email',
        'Admin/DPO vê solicitações no dashboard',
        'Alerta de prazos legais (15 dias)',
        'Dados são gerados automaticamente (acesso/portabilidade)',
        'Exclusão executa soft-delete em todas entidades',
        'Titular é notificado da resposta',
        'Histórico de solicitações é mantido'
      ]
    },
    {
      id: 'consentimento_explicito',
      titulo: '✅ Consentimento Explícito',
      descricao: 'IMPLEMENTADO - Registro completo com IP e user-agent',
      icon: CheckCircle2,
      prioridade: 'media',
      complexidade: 'media',
      estimativa: '3-5 dias',
      categoria: 'lgpd',
      status: 'implementado',
      dependencias: [],
      stackTecnico: [
        'Entity: Consentimento',
        'Modal de aceite no primeiro login',
        'Atualização de termos e re-consentimento'
      ],
      implementacao: [
        {
          etapa: 'Entity Consentimento',
          detalhes: [
            'user_id: string',
            'finalidade: enum (uso_basico, notificacoes_push, email_marketing, compartilhamento_terceiros)',
            'versao_termos: string (ex: "v1.0")',
            'aceito: boolean',
            'data_consentimento: date',
            'ip_origem: string',
            'user_agent: string',
            'revogado: boolean (default: false)',
            'data_revogacao: date'
          ]
        },
        {
          etapa: 'Modal de Primeiro Login',
          detalhes: [
            'ConsentimentoModal.jsx - aparece no primeiro login',
            'Texto dos termos de uso e política de privacidade',
            'Checkboxes por finalidade (obrigatórias e opcionais)',
            'Uso básico: obrigatório (sistema não funciona sem)',
            'Notificações push: opcional',
            'Email marketing: opcional',
            'Botão "Aceito" desabilitado até marcar obrigatórios',
            'Salvar consentimentos em batch'
          ]
        },
        {
          etapa: 'Gestão de Consentimentos',
          detalhes: [
            'Página ConsentimentosPage.jsx (user settings)',
            'Lista de consentimentos atuais',
            'Botão "Revogar" por finalidade (exceto uso_basico)',
            'Histórico de consentimentos/revogações',
            'Re-consentimento ao atualizar termos'
          ]
        },
        {
          etapa: 'Versionamento de Termos',
          detalhes: [
            'Entity TermosUso { versao, conteudo, data_vigencia }',
            'Ao atualizar termos, incrementar versão',
            'Notificar usuários sobre nova versão',
            'Forçar re-consentimento no próximo login',
            'Modal: "Nossos termos foram atualizados, revise e aceite"'
          ]
        }
      ],
      criteriosAceitacao: [
        'Modal de consentimento aparece no primeiro login',
        'Usuário não pode usar sistema sem aceitar termos obrigatórios',
        'Consentimentos opcionais podem ser negados',
        'Usuário pode revogar consentimentos a qualquer momento',
        'Histórico de consentimentos é registrado com IP e timestamp',
        'Atualização de termos força re-consentimento',
        'Sistema respeita revogações (ex: não envia push se revogado)'
      ]
    },
    {
      id: 'anonimizacao',
      titulo: '✅ Anonimização de Dados',
      descricao: 'IMPLEMENTADO - Backend function com masking, hashing, generalização',
      icon: Database,
      prioridade: 'media',
      complexidade: 'alta',
      estimativa: '5-7 dias',
      categoria: 'lgpd',
      status: 'implementado',
      dependencias: ['Portal do Titular'],
      stackTecnico: [
        'Backend function: anonimizarDados',
        'Automation: scheduled monthly',
        'Técnicas: masking, hashing, generalization'
      ],
      implementacao: [
        {
          etapa: 'Critérios de Anonimização',
          detalhes: [
            'Dados de pessoas inativas há > 5 anos',
            'OS concluídas há > 7 anos (prazo legal)',
            'Comentários de usuários deletados',
            'Mensagens de conversas arquivadas há > 2 anos',
            'Exclusão solicitada via Portal do Titular'
          ]
        },
        {
          etapa: 'Técnicas de Anonimização',
          detalhes: [
            'Masking: nome → "Usuário Anônimo #12345"',
            'Email: email@domain.com → "anonimo_12345@anonimo.com"',
            'CPF/CNPJ: substituir por hash SHA-256',
            'Telefone: remover completamente',
            'Endereço: manter apenas cidade/estado (generalização)',
            'IP address: remover últimos 2 octetos'
          ]
        },
        {
          etapa: 'Backend Function anonimizarDados',
          detalhes: [
            'Recebe: entity_type, entity_id',
            'Identifica campos PII (nome, email, cpf, telefone, endereço)',
            'Aplica técnica apropriada por campo',
            'Atualiza entidade com dados anonimizados',
            'Registra em AuditLog: "anonimizacao"',
            'Retorna: { success, fields_anonymized }'
          ]
        },
        {
          etapa: 'Automation Scheduled',
          detalhes: [
            'Roda mensalmente (1º dia do mês)',
            'Busca entidades que atendem critérios',
            'Para cada entidade, chama anonimizarDados',
            'Gera relatório mensal de anonimizações',
            'Envia relatório para DPO/admin'
          ]
        },
        {
          etapa: 'Testes de Irreversibilidade',
          detalhes: [
            'Testar que dados anonimizados não permitem re-identificação',
            'Verificar que hashes não colidem',
            'Garantir que generalização mantém utilidade estatística',
            'Compliance: LGPD Art. 12 (anonimização efetiva)'
          ]
        }
      ],
      criteriosAceitacao: [
        'Dados de pessoas inativas > 5 anos são anonimizados',
        'OS concluídas > 7 anos são anonimizadas',
        'Exclusão via Portal do Titular executa anonimização',
        'Dados anonimizados não permitem re-identificação',
        'Relatório mensal de anonimizações é gerado',
        'DPO recebe notificação mensal',
        'Processo é auditável (AuditLog)',
        'Dados estatísticos permanecem utilizáveis'
      ]
    }
  ];

  const [expandedId, setExpandedId] = useState(null);

  const getPrioridadeBadge = (prioridade) => {
    switch (prioridade) {
      case 'alta':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Alta Prioridade</Badge>;
      case 'media':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Média Prioridade</Badge>;
      case 'baixa':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Baixa Prioridade</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  const getComplexidadeBadge = (complexidade) => {
    switch (complexidade) {
      case 'alta':
        return <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">Alta Complexidade</Badge>;
      case 'media':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">Média Complexidade</Badge>;
      case 'baixa':
        return <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">Baixa Complexidade</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const categorias = {
    funcionalidades: recursos.filter(r => r.categoria === 'funcionalidades'),
    cadastros: recursos.filter(r => r.categoria === 'cadastros'),
    seguranca: recursos.filter(r => r.categoria === 'seguranca'),
    mobile: recursos.filter(r => r.categoria === 'mobile'),
    lgpd: recursos.filter(r => r.categoria === 'lgpd')
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="visao_geral">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="visao_geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="funcionalidades">Funcionalidades</TabsTrigger>
          <TabsTrigger value="cadastros">Cadastros</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="lgpd">LGPD</TabsTrigger>
        </TabsList>

        <TabsContent value="visao_geral" className="space-y-6 mt-6">
          {/* Resumo Executivo */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardHeader>
              <CardTitle>Resumo Executivo - Roadmap de Implementação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{recursos.length}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Recursos Totais</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{recursos.filter(r => r.status === 'implementado').length}</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">✅ Implementados</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{recursos.filter(r => !r.status || r.status !== 'implementado').length}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Pendentes</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{Math.round((recursos.filter(r => r.status === 'implementado').length / recursos.length) * 100)}%</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Completude</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Distribuição por Categoria</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Funcionalidades</span>
                    <span className="text-sm font-medium">{categorias.funcionalidades.length} itens</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cadastros</span>
                    <span className="text-sm font-medium">{categorias.cadastros.length} itens</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Segurança</span>
                    <span className="text-sm font-medium">{categorias.seguranca.length} itens</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Mobile</span>
                    <span className="text-sm font-medium">{categorias.mobile.length} itens</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">LGPD</span>
                    <span className="text-sm font-medium">{categorias.lgpd.length} itens</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista Resumida */}
          <Card>
            <CardHeader>
              <CardTitle>Todos os Recursos (Visão Rápida)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recursos.map(recurso => {
                  const Icon = recurso.icon;
                  return (
                    <div key={recurso.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">{recurso.titulo}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{recurso.descricao}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPrioridadeBadge(recurso.prioridade)}
                        {getComplexidadeBadge(recurso.complexidade)}
                        <Badge variant="outline">{recurso.estimativa}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tabs por Categoria */}
        {Object.entries(categorias).map(([categoria, items]) => (
          <TabsContent key={categoria} value={categoria} className="space-y-4 mt-6">
            {items.map(recurso => {
              const Icon = recurso.icon;
              const isExpanded = expandedId === recurso.id;
              
              return (
                <Card key={recurso.id}>
                  <Collapsible open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : recurso.id)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{recurso.titulo}</CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{recurso.descricao}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {getPrioridadeBadge(recurso.prioridade)}
                              {getComplexidadeBadge(recurso.complexidade)}
                              <Badge variant="outline" className="gap-1">
                                <Clock className="w-3 h-3" />
                                {recurso.estimativa}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>
                    
                    <CollapsibleContent>
                      <CardContent className="space-y-6 pt-0">
                        {/* Dependências */}
                        {recurso.dependencias && recurso.dependencias.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Dependências</h4>
                            <ul className="space-y-1">
                              {recurso.dependencias.map((dep, idx) => (
                                <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                  {dep}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Stack Técnico */}
                        <div>
                          <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Stack Técnico</h4>
                          <div className="flex flex-wrap gap-2">
                            {recurso.stackTecnico.map((tech, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Implementação */}
                        <div>
                          <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Etapas de Implementação</h4>
                          <div className="space-y-4">
                            {recurso.implementacao.map((etapa, idx) => (
                              <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                <h5 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                  </div>
                                  {etapa.etapa}
                                </h5>
                                <ul className="space-y-1.5 ml-8">
                                  {etapa.detalhes.map((detalhe, detIdx) => (
                                    <li key={detIdx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                      <span className="text-blue-600 mt-1">→</span>
                                      <span className="flex-1">{detalhe}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Critérios de Aceitação */}
                        <div>
                          <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Critérios de Aceitação</h4>
                          <ul className="space-y-2">
                            {recurso.criteriosAceitacao.map((criterio, idx) => (
                              <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span>{criterio}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}