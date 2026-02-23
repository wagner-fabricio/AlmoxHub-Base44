import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Users, MapPin, Warehouse, MessageSquare, Package, Truck, Shield, Bell } from 'lucide-react';

export default function RecursosSection() {
  const recursos = [
    {
      modulo: 'Gestão de Ordens de Serviço',
      icon: ClipboardList,
      color: 'blue',
      descricao: 'Core do sistema - criação, acompanhamento e execução de OS',
      funcionalidades: [
        'Criação de OS com múltiplas categorias (Expedição, Recebimento, Manutenção, etc)',
        'Subcategorias dinâmicas (campos extras por subcategoria)',
        'Atribuição de líder, executores e outros envolvidos',
        'Workflow de status: Elaboração → Execução → Concluído/Cancelado',
        'Barra de progresso manual (0-100%)',
        'Gestão de prazos com alertas automáticos',
        'Prioridades: baixa, média, alta, urgente',
        'Anexos e imagens (upload via Base44)',
        'Comentários e menções (@pessoa)',
        'Histórico de alterações (audit log)',
        'Visualizações: Lista, Kanban, Kanban Expedição, Kanban Recebimento',
        'Filtros avançados: regional, almoxarifado, categoria, status, período'
      ],
      permissoes: {
        admin: 'Criar, editar, excluir qualquer OS. Acesso a todas regionais.',
        gestor: 'Criar, editar, excluir OS da sua regional. Aprovar OS.',
        lider: 'Criar, editar OS onde é líder. Atribuir executores.',
        almoxarife: 'Executar OS atribuídas. Atualizar progresso.',
        user: 'Visualizar OS onde está envolvido. Comentar.'
      }
    },
    {
      modulo: 'Expedição (Saída de Materiais)',
      icon: Truck,
      color: 'orange',
      descricao: 'Gestão completa do processo de expedição e separação de materiais',
      funcionalidades: [
        'Criação de OS de expedição com dados de reserva (num_reserva, data_reserva, usuário)',
        'Cadastro de itens de documento (código, descrição, quantidade, valor)',
        'Gestão de volumes (dimensões, peso, m³)',
        'Detalhamento de expedição (múltiplas expedições por OS)',
        'Modal de transporte: Terrestre, Aéreo, Marítimo, Misto',
        'Responsável transporte: Transportadora, Arrematante, Empreiteira, etc',
        'Dados de transportadora (CNPJ, razão social, conhecimento, valor frete)',
        'Dados de veículo (placa, estado, tipo, carroceria, tara)',
        'Dados de motorista (CPF, nome, RG)',
        'Uso de seguro (checkbox)',
        'Aproveitamento de carona (checkbox)',
        'Workflow de separação: Pendente → Em Separação → Separado → Embalando → Aguardando Transporte → Em Rota → Entregue',
        'Picking WMS (separação de itens por localização)',
        'Geração de Ordem de Saída (PDF)',
        'Relatórios: Separação, Conferência'
      ],
      permissoes: {
        admin: 'Acesso total',
        gestor: 'Gerenciar expedições da regional',
        lider: 'Criar e acompanhar expedições',
        almoxarife: 'Executar separação e picking',
        user: 'Visualizar expedições relacionadas'
      }
    },
    {
      modulo: 'Recebimento (Entrada de Materiais)',
      icon: Package,
      color: 'green',
      descricao: 'Processo automatizado de recebimento com importação de NFe',
      funcionalidades: [
        'Importação de XML de NFe (parseNFeXML function)',
        'Extração automática: número, série, data emissão, chave de acesso',
        'Dados do emissor: razão social, CNPJ, IE, endereço completo',
        'Dados do destinatário: razão social, CNPJ, IE, endereço',
        'Dados do transportador: razão social, CNPJ, tipo frete, volumes, peso',
        'Itens de conferência extraídos do XML',
        'Fluxo de recebimento em 4 etapas:',
        '  1. XML importado',
        '  2. Conferência manual (quantidade esperada vs recebida)',
        '  3. Validação de divergências',
        '  4. Armazenagem (definir endereço por item)',
        'Status de conferência: pendente, parcial, completo, excedente',
        'Registro de problemas de recebimento (ProblemaRecebimento entity)',
        'Campos MIGO, V360, doc referência',
        'Resumo de pendências e ações de acompanhamento',
        'Data de recebimento e solução de problemas',
        'Anexos específicos de problemas'
      ],
      permissoes: {
        admin: 'Acesso total',
        gestor: 'Validar recebimentos e divergências',
        lider: 'Acompanhar recebimentos',
        almoxarife: 'Executar conferência e armazenagem',
        user: 'Visualizar recebimentos'
      }
    },
    {
      modulo: 'Dashboard e Analytics',
      icon: ClipboardList,
      color: 'purple',
      descricao: 'Visão executiva com KPIs, gráficos e insights',
      funcionalidades: [
        '3 abas: Geral, Mapas, Torre de Controle',
        'KPIs principais: Total OS, Em Execução, Concluídas, Progresso Médio',
        'Comparação com ontem (variação percentual)',
        'Taxa de cumprimento de prazos',
        'Tempo médio de resolução',
        'Gráficos: OS por regional (stacked bars), OS por categoria, OS por status (pie chart)',
        'Top 5 almoxarifados por volume',
        'Esforço por pessoa (OS atribuídas)',
        'Mapas: Instalações e Almoxarifados (Leaflet)',
        'Heatmap de expedições (por origem/destino)',
        'Torre de Controle: Volumetrias (itens, valores, tempo médio)',
        'Resultados mensais: OS, Itens, Valores (no prazo vs fora do prazo)',
        'Problemas de recebimento por regional',
        'Filtros persistidos por usuário (filtros_preferidos)',
        'Insights automáticos (DashboardInsights component)',
        '✨ Exportação de PDF profissional (KPIs, gráficos, tabelas)',
        '✨ Configuração de seções para exportar (KPIs, Gráficos)',
        '✨ Orientação configurável (retrato/paisagem)',
        '✨ Dashboard customizável (show/hide widgets)',
        '✨ 8 widgets disponíveis: KPIs, Insights, KPIs Secundários, Esforço, Regionais, Status, Categorias, Almoxarifados',
        '✨ Persistência de configuração por usuário (dashboard_visible_widgets)',
        '✨ Botão resetar para configuração padrão'
      ],
      permissoes: {
        admin: 'Acesso total incluindo Torre de Controle',
        gestor: 'Dashboard completo da regional',
        lider: 'Dashboard filtrado por projetos/equipe',
        almoxarife: 'Dashboard básico',
        user: 'Dashboard pessoal (Em Fluxo)'
      }
    },
    {
      modulo: 'Gestão de Pessoas',
      icon: Users,
      color: 'pink',
      descricao: 'Cadastro e aprovação de usuários do sistema',
      funcionalidades: [
        'Cadastro: matrícula, nome, email, funcao, funcoes[] (gestor/lider/almoxarife)',
        'Vínculo com User (user_id)',
        'Regional e Almoxarifados vinculados',
        'Foto de perfil (upload)',
        'Status de aprovação: pendente → aprovado/rejeitado',
        'Fluxo de onboarding: NewUserSetup → PendingApproval → App',
        'Aprovação por admin (UserApproval page)',
        'Visualização de perfil completo (modal)',
        'Filtro por regional, almoxarifado, função',
        'Exportação de dados'
      ],
      permissoes: {
        admin: 'Aprovar/rejeitar usuários. CRUD completo.',
        gestor: 'Visualizar equipe da regional',
        user: 'Editar próprio perfil'
      }
    },
    {
      modulo: 'Mensagens Internas',
      icon: MessageSquare,
      color: 'cyan',
      descricao: 'Chat em tempo real entre usuários',
      funcionalidades: [
        'Conversas privadas 1:1',
        'Grupos com múltiplos participantes',
        'Criação de grupo: nome, descrição, avatar',
        'Permissões: admin (criador) vs membro',
        'Mensagens com formatação (RichTextEditor)',
        'Menções (@pessoa)',
        'Citação de mensagens (reply)',
        'Edição e exclusão de mensagens',
        'Status: enviada, editada, excluída',
        'Contador de não lidas por conversa',
        'Favoritar conversas',
        'Última mensagem visível na lista',
        'Real-time via base44.entities.subscribe()',
        'Mobile: ChatMobileSimple component'
      ],
      permissoes: {
        todos: 'Criar conversas, enviar mensagens, participar de grupos'
      }
    },
    {
      modulo: 'Notificações',
      icon: Bell,
      color: 'yellow',
      descricao: 'Sistema de notificações in-app e push',
      funcionalidades: [
        'Tipos: menção, atribuição, mudança de status',
        'Notificações in-app (NotificationBell component)',
        'Push notifications (PushSubscription + service worker)',
        'Preferências de notificação por usuário (NotificationPreferences)',
        'Configurações: OS assignment, status change, mentions, deadlines, messages',
        'Ativar/desativar push por dispositivo',
        'Contagem de não lidas',
        'Marcar como lida',
        'Navegação para contexto (OS, comentário)',
        'Mobile: NotificationsMobile page'
      ],
      permissoes: {
        todos: 'Gerenciar próprias notificações e preferências'
      }
    },
    {
      modulo: 'Cadastros (Regionais, Almoxarifados, Instalações)',
      icon: MapPin,
      color: 'teal',
      descricao: 'Gestão de estrutura organizacional',
      funcionalidades: [
        'Regionais: sigla, descrição, gerência (GLOA/GLAO), gestor',
        'Almoxarifados: nome, tipo, endereço, coordenadas, regional vinculada',
        'Instalações: classificação (Usina/Subestação/Almoxarifado/Outros), coordenadas, CNPJ, IE',
        'Vinculação hierárquica: Regional → Almoxarifado → Instalação',
        'Visualização em mapas (Dashboard)',
        'Filtros e busca',
        'Status ativo/inativo'
      ],
      permissoes: {
        admin: 'CRUD completo (RLS configurado)',
        gestor: 'Visualizar',
        user: 'Visualizar'
      }
    },
    {
      modulo: 'Categorias e Subcategorias',
      icon: ClipboardList,
      color: 'indigo',
      descricao: 'Organização de tipos de OS',
      funcionalidades: [
        'Categorias: nome, descrição, ícone (Lucide), cor',
        'Subcategorias: nome, descrição, categoria_id, campos_extras[]',
        'Campos extras dinâmicos por subcategoria',
        'Principais categorias: Expedição, Recebimento, Manutenção, Compra',
        'Status ativa/inativa',
        'Ordenação alfabética no formulário de OS'
      ],
      permissoes: {
        admin: 'CRUD completo',
        gestor: 'Visualizar',
        user: 'Visualizar'
      }
    },
    {
      modulo: 'Projetos/Tags',
      icon: ClipboardList,
      color: 'rose',
      descricao: 'Agrupamento de OS por projetos',
      funcionalidades: [
        'Nome, descrição, cor',
        'Líder e outros envolvidos',
        'Vínculo com múltiplas OS (projetos_ids[])',
        'Visualização Gantt (ProjetosGantt)',
        'Lista de OS por projeto',
        'Status ativo/inativo'
      ],
      permissoes: {
        admin: 'CRUD completo',
        gestor: 'Gerenciar projetos da regional',
        lider: 'Gerenciar próprios projetos',
        user: 'Visualizar projetos'
      }
    },
    {
      modulo: 'Auditoria e Logs',
      icon: Shield,
      color: 'slate',
      descricao: 'Rastreabilidade completa de ações',
      funcionalidades: [
        'AuditLog entity: action, entity_type, entity_id, user_id, timestamp',
        'Detalhes em JSON (dados alterados)',
        'IP address e user agent',
        'Registro automático via backend functions',
        'Página de consulta (AuditLogs) apenas para admin',
        'Filtros: usuário, ação, entidade, data',
        'Exportação de logs',
        'Retenção configurável'
      ],
      permissoes: {
        admin: 'Visualizar e consultar logs',
        outros: 'Sem acesso'
      }
    },
    {
      modulo: 'DR/BCP - Disaster Recovery',
      icon: Shield,
      color: 'red',
      descricao: 'Continuidade de negócio e recuperação de desastres',
      funcionalidades: [
        '✅ BIA - Business Impact Analysis documentado',
        'Processos críticos identificados com RTO/RPO',
        'RTO: 4h (crítico), 8h (alto), 24h (médio)',
        'RPO: 1h (OS), 4h (cadastros), 24h (logs)',
        '✅ Backup Semanal Automático',
        'exportBackupCritico function (domingos 02:00 UTC)',
        'Entities: OrdemServico, Pessoa, Regional, Almoxarifado, etc',
        'Storage privado encrypted (retenção 4 semanas)',
        '✅ Runbooks de Recuperação',
        '3 cenários: Perda total, Corrupção entity, DR completo',
        'Procedimentos passo-a-passo documentados',
        'Checklist de validação pós-restore',
        'Contatos de emergência 24/7',
        '✅ Testes Periódicos',
        'Simulação trimestral de restore',
        'Medição de MTTR real vs objetivo',
        'Documentação de lições aprendidas'
      ],
      permissoes: {
        admin: 'Executar backups e restores, gerenciar DR',
        outros: 'Sem acesso'
      }
    },
    {
      modulo: 'LGPD e Privacidade',
      icon: Shield,
      color: 'emerald',
      descricao: 'Conformidade total com LGPD - Portal do Titular, RIPD e Anonimização',
      funcionalidades: [
        '✅ Portal do Titular público (sem login)',
        'Solicitações: acesso, correção, exclusão, portabilidade, oposição',
        'Protocolo automático LGPD-timestamp-random',
        'Prazo legal de 15 dias (alerta automático)',
        'Upload de comprovante de identidade',
        'Email de confirmação ao titular',
        'Tracking de solicitação (protocolo + email)',
        '✅ Dashboard de Gestão (Admin/DPO)',
        'Aprovar/rejeitar solicitações',
        'Geração automática de dados do titular (acesso/portabilidade)',
        'Resposta automática por email',
        'Alertas de prazos próximos (5 dias)',
        '✅ RIPD - Relatório de Impacto',
        'Wizard 10 seções conforme ANPD',
        'Identificação, tratamento, finalidade, riscos, mitigação',
        'Versionamento e aprovação pelo DPO',
        'Geração de PDF profissional',
        '✅ Anonimização de Dados',
        'Backend function anonimizarDados',
        'Técnicas: masking, hashing SHA-256, generalização',
        'Registro em AuditLog',
        'Irreversibilidade garantida',
        '✅ Consentimento Explícito',
        'Modal no primeiro login',
        'Gestão de consentimentos (aceitar/revogar)',
        'Registro com IP e user-agent',
        'Versionamento de termos'
      ],
      permissoes: {
        publico: 'Portal do Titular (sem autenticação)',
        admin: 'Gestão de solicitações, RIPD, anonimização',
        dpo: 'Aprovar RIPD, gerenciar solicitações',
        user: 'Gerenciar próprios consentimentos'
      }
    },
    {
      modulo: 'Em Fluxo (Mobile)',
      icon: ClipboardList,
      color: 'lime',
      descricao: 'Dashboard personalizado mobile-first',
      funcionalidades: [
        'Detecção automática de mobile (redirecionamento)',
        'Visão das minhas OS',
        'Filtros: status, prioridade, projeto',
        'Insights personalizados',
        'Meu desempenho (MeuDesempenhoMobile)',
        'Acesso rápido: Perfil, Notificações',
        'Cards de OS otimizados para touch',
        'Aba Materiais (MaterialesTab)'
      ],
      permissoes: {
        todos: 'Acesso ao próprio fluxo'
      }
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200',
      cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
      teal: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
      rose: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
      slate: 'bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200',
      lime: 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Módulos e Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            O AlmoxHub é estruturado em {recursos.length} módulos principais, cada um com funcionalidades 
            específicas e controle de permissões baseado em roles.
          </p>
        </CardContent>
      </Card>

      {recursos.map((recurso, index) => {
        const Icon = recurso.icon;
        return (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(recurso.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{recurso.modulo}</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {recurso.descricao}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Funcionalidades */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  📋 Funcionalidades
                </h4>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {recurso.funcionalidades.map((func, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                      <span>{func}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Permissões */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  🔐 Permissões por Role
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(recurso.permissoes).map(([role, descricao]) => (
                    <div key={role} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <Badge className="mb-2">{role}</Badge>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}