import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

export default function StatusRecursosSection() {
  const recursos = [
    {
      categoria: 'Core - Ordens de Serviço',
      itens: [
        { nome: 'Criação e edição de OS', status: 'implementado', obs: 'Modal completo com todos campos' },
        { nome: 'Workflow de status', status: 'implementado', obs: 'Elaboração → Execução → Concluído/Cancelado' },
        { nome: 'Atribuição de líder e executores', status: 'implementado', obs: 'Multi-select de pessoas' },
        { nome: 'Gestão de prazos', status: 'implementado', obs: 'Data inicial, prazo, data conclusão' },
        { nome: 'Anexos e imagens', status: 'implementado', obs: 'Upload via Base44, galeria de visualização' },
        { nome: 'Comentários e menções', status: 'implementado', obs: '@menções com notificações' },
        { nome: 'Histórico de alterações', status: 'implementado', obs: 'AuditLog registra todas mudanças' },
        { nome: 'Filtros avançados', status: 'implementado', obs: 'Regional, almox, categoria, status, período' },
        { nome: 'Visualização Kanban', status: 'implementado', obs: 'Drag & drop entre colunas de status' },
        { nome: 'Kanban de Expedição', status: 'implementado', obs: 'Workflow específico de separação' },
        { nome: 'Kanban de Recebimento', status: 'implementado', obs: 'Workflow específico de conferência' },
        { nome: 'Bulk update', status: 'implementado', obs: 'Atualização em lote de OS selecionadas' },
        { nome: 'Exportação de dados', status: 'implementado', obs: 'Export PDF/Excel avançado com seleção de campos' },
        { nome: 'Templates de OS', status: 'nao_implementado', obs: 'Criar OS a partir de templates pré-definidos' },
        { nome: 'Recorrência de OS', status: 'nao_implementado', obs: 'OS automáticas periódicas' }
      ]
    },
    {
      categoria: 'Expedição',
      itens: [
        { nome: 'Dados de reserva', status: 'implementado', obs: 'num_reserva, data, usuário, órgão' },
        { nome: 'Itens de documento', status: 'implementado', obs: 'Código, descrição, qtd, valor, saldo' },
        { nome: 'Gestão de volumes', status: 'implementado', obs: 'Dimensões, peso, m³, ID volume' },
        { nome: 'Detalhamento de expedição', status: 'implementado', obs: 'Múltiplas expedições, modal, responsável transporte' },
        { nome: 'Dados de transportadora', status: 'implementado', obs: 'CNPJ, razão, conhecimento, valor frete, cadastro' },
        { nome: 'Dados de veículo', status: 'implementado', obs: 'Placa, estado, tipo, carroceria, frota Axia' },
        { nome: 'Dados de motorista', status: 'implementado', obs: 'CPF, nome, RG, motorista Axia' },
        { nome: 'Workflow de separação', status: 'implementado', obs: '7 status: pendente → entregue' },
        { nome: 'Picking WMS', status: 'implementado', obs: 'Separação por endereço/localização' },
        { nome: 'Ordem de Saída (PDF)', status: 'implementado', obs: 'Geração de documento para portaria' },
        { nome: 'Relatório de Separação', status: 'implementado', obs: 'Checklist de materiais separados' },
        { nome: 'Relatório de Conferência', status: 'implementado', obs: 'Validação de itens vs documento' },
        { nome: 'Integração com sistema de etiquetas', status: 'nao_implementado', obs: 'Impressão de etiquetas de volume' },
        { nome: 'Rastreamento de transporte', status: 'nao_implementado', obs: 'Integração com transportadoras para tracking' },
        { nome: 'Agendamento de coleta', status: 'nao_implementado', obs: 'Agendar data/hora de retirada' }
      ]
    },
    {
      categoria: 'Recebimento',
      itens: [
        { nome: 'Importação de XML NFe', status: 'implementado', obs: 'parseNFeXML function extrai todos dados' },
        { nome: 'Dados da NFe', status: 'implementado', obs: 'Número, série, data, chave, natureza operação' },
        { nome: 'Dados emissor/destinatário', status: 'implementado', obs: 'Razão, CNPJ, IE, endereço completo' },
        { nome: 'Dados transportador', status: 'implementado', obs: 'Razão, CNPJ, tipo frete, volumes, peso' },
        { nome: 'Itens de conferência', status: 'implementado', obs: 'Extração automática do XML' },
        { nome: 'Fluxo de recebimento 4 etapas', status: 'implementado', obs: 'XML → Conf → Validação → Armazenagem' },
        { nome: 'Conferência manual', status: 'implementado', obs: 'Quantidade esperada vs recebida' },
        { nome: 'Status de conferência', status: 'implementado', obs: 'Pendente, parcial, completo, excedente' },
        { nome: 'Endereçamento', status: 'implementado', obs: 'Definir localização por item' },
        { nome: 'Registro de problemas', status: 'implementado', obs: 'ProblemaRecebimento entity, múltiplos problemas' },
        { nome: 'Campos MIGO/V360', status: 'implementado', obs: 'Integração com SAP (campos digitáveis)' },
        { nome: 'Anexos de problemas', status: 'implementado', obs: 'Fotos de avarias, divergências' },
        { nome: 'Validação automática XML vs Pedido', status: 'parcial', obs: 'Extração XML ok, falta validação contra pedido' },
        { nome: 'Impressão de etiquetas de entrada', status: 'nao_implementado', obs: 'Etiquetas com código de barras' },
        { nome: 'Integração automática MIGO', status: 'nao_implementado', obs: 'Envio automático para SAP' }
      ]
    },
    {
      categoria: 'Dashboard e Analytics',
      itens: [
        { nome: 'KPIs principais', status: 'implementado', obs: 'Total, execução, concluídas, progresso' },
        { nome: 'Comparação temporal', status: 'implementado', obs: 'Variação vs ontem' },
        { nome: 'Gráficos de OS', status: 'implementado', obs: 'Por regional, categoria, status' },
        { nome: 'Mapas de instalações', status: 'implementado', obs: 'Leaflet com markers e filtros' },
        { nome: 'Heatmap de expedições', status: 'implementado', obs: 'Por origem/destino, critérios configuráveis' },
        { nome: 'Torre de Controle', status: 'implementado', obs: 'Volumetrias e resultados mensais' },
        { nome: 'Insights automáticos', status: 'implementado', obs: 'DashboardInsights component com alertas' },
        { nome: 'Esforço por pessoa', status: 'implementado', obs: 'Gráfico de OS por pessoa' },
        { nome: 'Filtros persistidos', status: 'implementado', obs: 'Salvos em user.filtros_preferidos' },
        { nome: 'Exportação de dashboards', status: 'implementado', obs: 'PDF profissional com KPIs, gráficos e tabelas' },
        { nome: 'Dashboard customizável', status: 'implementado', obs: 'Show/hide widgets, 8 widgets disponíveis' },
        { nome: 'Widgets configuráveis', status: 'implementado', obs: 'KPIs, Insights, Gráficos, persistência por usuário' },
        { nome: 'Orientação PDF', status: 'implementado', obs: 'Retrato ou paisagem configurável' },
        { nome: 'Seções de exportação', status: 'implementado', obs: 'Escolher KPIs, Gráficos, Mapas, Torre' },
        { nome: 'Alertas configuráveis', status: 'implementado', obs: 'CRUD de alertas, backend function, automation diária' }
      ]
    },
    {
      categoria: 'Pessoas e Permissões',
      itens: [
        { nome: 'Cadastro de pessoa', status: 'implementado', obs: 'Matrícula, nome, email, funções, foto' },
        { nome: 'Aprovação de usuários', status: 'implementado', obs: 'Flow: NewUserSetup → PendingApproval → Aprovado' },
        { nome: 'Múltiplas funções', status: 'implementado', obs: 'Array: gestor, lider, almoxarife' },
        { nome: 'Foto de perfil', status: 'implementado', obs: 'Upload e visualização' },
        { nome: 'Vínculo regional/almoxarifado', status: 'implementado', obs: 'Multi-select de almoxarifados' },
        { nome: 'RLS (Row Level Security)', status: 'implementado', obs: 'Configurado em todas entidades sensíveis' },
        { nome: 'Página de aprovação', status: 'implementado', obs: 'UserApproval para admin' },
        { nome: 'Perfil completo', status: 'implementado', obs: 'Modal com todas informações' },
        { nome: 'Edição de perfil', status: 'implementado', obs: 'Usuário pode editar próprios dados' },
        { nome: 'Gestão de equipes', status: 'implementado', obs: 'CRUD de equipes, membros, líder, regionais, almoxarifados' },
        { nome: 'Delegação de permissões', status: 'implementado', obs: 'Gestor delega temporariamente funções, com data início/fim, auto-expiração' },
        { nome: 'SSO corporativo', status: 'nao_implementado', obs: 'Integração com Azure AD/Okta pendente' }
      ]
    },
    {
      categoria: 'Mensagens e Notificações',
      itens: [
        { nome: 'Conversas 1:1', status: 'implementado', obs: 'Chat privado entre dois usuários' },
        { nome: 'Grupos', status: 'implementado', obs: 'Múltiplos participantes, nome, avatar' },
        { nome: 'RichTextEditor', status: 'implementado', obs: 'Formatação de mensagens' },
        { nome: 'Menções @pessoa', status: 'implementado', obs: 'MentionInput component' },
        { nome: 'Citação de mensagens', status: 'implementado', obs: 'Reply to message' },
        { nome: 'Edição/exclusão', status: 'implementado', obs: 'Soft-delete, marcação de editada' },
        { nome: 'Real-time', status: 'implementado', obs: 'Subscribe em MensagemChat' },
        { nome: 'Contador não lidas', status: 'implementado', obs: 'Por conversa' },
        { nome: 'Notificações in-app', status: 'implementado', obs: 'NotificationBell component' },
        { nome: 'Push notifications', status: 'implementado', obs: 'PushSubscription + service worker' },
        { nome: 'Preferências de notificação', status: 'implementado', obs: 'NotificationPreferences entity' },
        { nome: 'Mobile chat', status: 'implementado', obs: 'ChatMobileSimple component' },
        { nome: 'Anexos em mensagens', status: 'implementado', obs: 'Upload, preview de imagens, download de arquivos' },
        { nome: 'Chamadas de voz/vídeo', status: 'nao_implementado', obs: 'WebRTC para comunicação' },
        { nome: 'Tradução automática', status: 'nao_implementado', obs: 'Mensagens em múltiplos idiomas' }
      ]
    },
    {
      categoria: 'Cadastros Base',
      itens: [
        { nome: 'Regionais', status: 'implementado', obs: 'CRUD completo, sigla, gerência, gestor' },
        { nome: 'Almoxarifados', status: 'implementado', obs: 'CRUD, coordenadas, tipo, status' },
        { nome: 'Instalações', status: 'implementado', obs: 'CRUD, classificação, coordenadas, CNPJ' },
        { nome: 'Categorias', status: 'implementado', obs: 'CRUD, ícone, cor' },
        { nome: 'Subcategorias', status: 'implementado', obs: 'CRUD, campos extras dinâmicos' },
        { nome: 'Projetos', status: 'implementado', obs: 'CRUD, líder, envolvidos, cor' },
        { nome: 'Transportadoras', status: 'implementado', obs: 'CRUD, CNPJ, código SAP' },
        { nome: 'Veículos Axia', status: 'implementado', obs: 'CRUD, placa, tipo, carroceria' },
        { nome: 'Problemas Recebimento', status: 'implementado', obs: 'CRUD, descrição, gravidade (admin only)' },
        { nome: 'Fornecedores', status: 'implementado', obs: 'CRUD completo, categoria, contatos, endereço' },
        { nome: 'Centros de Custo', status: 'implementado', obs: 'CRUD, orçamento, consumo, alertas' }
      ]
    },
    {
      categoria: 'Segurança e Auditoria',
      itens: [
        { nome: 'Autenticação Base44', status: 'implementado', obs: 'base44.auth.me()' },
        { nome: 'RLS em entidades', status: 'implementado', obs: 'Políticas por role e ownership' },
        { nome: 'Sanitização de inputs', status: 'implementado', obs: 'DOMPurify + SecureInput' },
        { nome: 'AuditLog', status: 'implementado', obs: 'Entity + função registrarAuditLog' },
        { nome: 'Logs de consulta', status: 'implementado', obs: 'Página AuditLogs (admin)' },
        { nome: 'Rate limiting', status: 'implementado', obs: 'Base44 nativo (429)' },
        { nome: 'Criptografia DB', status: 'implementado', obs: 'Base44 managed (padrão indústria)' },
        { nome: 'Criptografia em trânsito', status: 'implementado', obs: 'TLS 1.2+' },
        { nome: 'SSO', status: 'nao_implementado', obs: 'Integração pendente (Base44 suporta)' },
        { nome: 'MFA', status: 'nao_implementado', obs: 'Base44 não suporta MFA nativo' },
        { nome: 'WAF', status: 'nao_implementado', obs: 'Necessário proxy externo (Cloudflare)' },
        { nome: 'SIEM Eletrobras', status: 'nao_implementado', obs: 'Integração de logs pendente' },
        { nome: 'Timeout de sessão', status: 'implementado', obs: '15min inatividade, modal de aviso 2min antes' },
        { nome: 'Headers HTTP seguros', status: 'implementado', obs: 'CSP completo, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy' },
        { nome: 'Rate Limiting', status: 'implementado', obs: 'Entity LoginAttempt, 3 falhas = CAPTCHA, 10 falhas = bloqueio 15min' },
        { nome: 'CAPTCHA anti-bot', status: 'implementado', obs: 'Google reCAPTCHA v2 após 3 tentativas falhadas' },
        { nome: 'Plano DR/BCP', status: 'implementado', obs: 'BIA documentado, RTO/RPO definidos, backup semanal automático' },
        { nome: 'Backup testado', status: 'implementado', obs: 'exportBackupCritico function, storage privado, testes trimestrais' }
      ]
    },
    {
      categoria: 'Integrações',
      itens: [
        { nome: 'Parser XML NFe', status: 'implementado', obs: 'parseNFeXML function completa' },
        { nome: 'Sistema de alertas', status: 'implementado', obs: 'enviarAlertas function + estratégias' },
        { nome: 'Notificações push', status: 'implementado', obs: 'sendPushNotification function' },
        { nome: 'Compressão de imagens', status: 'implementado', obs: 'imageCompression utility' },
        { nome: 'Geração de PDF', status: 'implementado', obs: 'jsPDF (Ordem de Saída)' },
        { nome: 'Mapas Leaflet', status: 'implementado', obs: 'react-leaflet' },
        { nome: 'Excel export', status: 'implementado', obs: 'Exportação Excel com campos configuráveis' },
        { nome: 'SAP MIGO', status: 'nao_implementado', obs: 'Integração automática pendente' },
        { nome: 'SAP pedidos', status: 'nao_implementado', obs: 'Buscar pedidos de compra' },
        { nome: 'Email via Resend', status: 'nao_implementado', obs: 'Base44 Core.SendEmail disponível' },
        { nome: 'Assinatura digital', status: 'nao_implementado', obs: 'Assinar documentos eletronicamente' }
      ]
    },
    {
      categoria: 'Mobile',
      itens: [
        { nome: 'Detecção automática', status: 'implementado', obs: 'Redireciona para EmFluxo' },
        { nome: 'Em Fluxo page', status: 'implementado', obs: 'Dashboard mobile otimizado' },
        { nome: 'Meu Perfil Mobile', status: 'implementado', obs: 'MeuPerfilMobile page' },
        { nome: 'Notificações Mobile', status: 'implementado', obs: 'NotificationsMobile page' },
        { nome: 'Chat Mobile', status: 'implementado', obs: 'ChatMobileSimple component' },
        { nome: 'OS Detail Mobile', status: 'implementado', obs: 'OSMobileDetail component' },
        { nome: 'Projeto Detail Mobile', status: 'implementado', obs: 'ProjetoMobileDetail component' },
        { nome: 'Touch gestures', status: 'implementado', obs: 'Swipe, long-press, haptic feedback implementados' },
        { nome: 'Offline mode', status: 'nao_implementado', obs: 'Service worker para cache offline' },
        { nome: 'App nativo (PWA)', status: 'nao_implementado', obs: 'Manifest e instalação PWA' }
      ]
    },
    {
      categoria: 'LGPD e Privacidade',
      itens: [
        { nome: 'Coleta de dados minimizada', status: 'implementado', obs: 'Apenas campos necessários' },
        { nome: 'Criptografia de dados', status: 'implementado', obs: 'DB criptografado (Base44)' },
        { nome: 'Logs de auditoria', status: 'implementado', obs: 'AuditLog com IP e user-agent' },
        { nome: 'Soft-delete', status: 'implementado', obs: 'is_deleted flag, recuperação 30 dias' },
        { nome: 'Privacy by Design', status: 'implementado', obs: 'Documentação completa com 7 princípios e evidências' },
        { nome: 'RIPD', status: 'implementado', obs: 'Entity com wizard 10 seções, geração PDF, versionamento' },
        { nome: 'Portal do titular', status: 'implementado', obs: 'Form público, tracking, geração automática de dados, prazo 15 dias' },
        { nome: 'Gestão de solicitações', status: 'implementado', obs: 'Dashboard admin/DPO, aprovar/rejeitar, envio automático de emails' },
        { nome: 'Consentimento explícito', status: 'implementado', obs: 'Modal no primeiro login, gestão de consentimentos' },
        { nome: 'Anonimização', status: 'implementado', obs: 'Backend function com masking/hashing/generalização, auditoria' }
      ]
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'implementado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'parcial':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'nao_implementado':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'implementado':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Implementado</Badge>;
      case 'parcial':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Parcial</Badge>;
      case 'nao_implementado':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Não Implementado</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  // Calcular estatísticas
  const totalItens = recursos.reduce((sum, cat) => sum + cat.itens.length, 0);
  const implementados = recursos.reduce((sum, cat) => 
    sum + cat.itens.filter(i => i.status === 'implementado').length, 0
  );
  const parciais = recursos.reduce((sum, cat) => 
    sum + cat.itens.filter(i => i.status === 'parcial').length, 0
  );
  const naoImplementados = recursos.reduce((sum, cat) => 
    sum + cat.itens.filter(i => i.status === 'nao_implementado').length, 0
  );

  const percImplementado = ((implementados / totalItens) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle>Estatísticas de Implementação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalItens}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total de Recursos</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{implementados}</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">Implementados</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{parciais}</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Parciais</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{naoImplementados}</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">Não Implementados</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Progresso Geral</span>
              <span className="font-semibold text-slate-900 dark:text-white">{percImplementado}%</span>
            </div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500" 
                style={{ width: `${percImplementado}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista por Categoria */}
      {recursos.map((categoria, catIndex) => {
        const catImplementados = categoria.itens.filter(i => i.status === 'implementado').length;
        const catParciais = categoria.itens.filter(i => i.status === 'parcial').length;
        const catNaoImpl = categoria.itens.filter(i => i.status === 'nao_implementado').length;
        const catPercent = ((catImplementados / categoria.itens.length) * 100).toFixed(0);

        return (
          <Card key={catIndex}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{categoria.categoria}</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {catImplementados}/{categoria.itens.length}
                  </span>
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoria.itens.map((item, itemIndex) => (
                  <div 
                    key={itemIndex} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                          {item.nome}
                        </h4>
                        {getStatusBadge(item.status)}
                      </div>
                      {item.obs && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {item.obs}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Roadmap Sugerido */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <CardTitle>Roadmap Sugerido - Próximos Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                🚀 Sprint 1-2 (Alta Prioridade) ✅ CONCLUÍDO
              </h4>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>✅ Timeout de sessão (15min) - implementado</li>
                <li>✅ Headers HTTP seguros (CSP) - implementado</li>
                <li>✅ Centros de Custo - implementado</li>
                <li>✅ Fornecedores - implementado</li>
                <li>✅ Privacy by Design (doc) - implementado</li>
                <li>✅ Anexos em mensagens - implementado</li>
                <li>✅ Alertas configuráveis - implementado</li>
                <li>✅ Consentimento explícito - implementado</li>
                <li>✅ Touch gestures avançados - implementado</li>
                <li>✅ Gestão de equipes - implementado</li>
                <li>✅ Delegação de permissões - implementado</li>
              </ul>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                📋 Sprint 2-3 (LGPD + Segurança) ✅ CONCLUÍDO
              </h4>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>✅ RIPD (Relatório de Impacto) - implementado</li>
                <li>✅ Portal do Titular LGPD - implementado</li>
                <li>✅ Gestão de Solicitações (Admin/DPO) - implementado</li>
                <li>✅ Anonimização de dados - implementado</li>
                <li>✅ Headers HTTP Seguros completos - implementado</li>
                <li>✅ Rate Limiting + CAPTCHA - implementado</li>
                <li>✅ Plano DR + Backup Testado - implementado</li>
              </ul>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                🎯 Sprint 3-4 (Features & Integrações)
              </h4>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>• Templates de OS - 3-5 dias</li>
                <li>• Recorrência de OS - 3-5 dias</li>
                <li>• Integração SAP automática - em planejamento</li>
                <li>• Rastreamento de transporte - em planejamento</li>
                <li>• PWA (Progressive Web App) - 2-3 dias</li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                💡 <strong>Plano detalhado disponível:</strong> Acesse a aba "Implementação" na Documentação para ver o roadmap completo com etapas, stack técnico e critérios de aceitação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}