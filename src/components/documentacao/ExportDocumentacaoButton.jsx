import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

// Color palette matching page design
const C = {
  blue:       [0,   0,   255],
  blueLight:  [239, 246, 255], // blue-50
  blueMid:    [191, 219, 254], // blue-200
  purple:     [126, 34,  206],
  purpleLight:[250, 245, 255],
  green:      [22,  101, 52],
  greenLight: [240, 253, 244],
  amber:      [146, 64,  14],
  amberLight: [255, 251, 235],
  red:        [185, 28,  28],
  redLight:   [254, 242, 242],
  teal:       [15,  118, 110],
  tealLight:  [240, 253, 250],
  slate50:    [248, 250, 252],
  slate100:   [241, 245, 249],
  slate200:   [226, 232, 240],
  slate600:   [71,  85,  105],
  slate700:   [51,  65,  85],
  slate800:   [30,  41,  59],
  slate900:   [15,  23,  42],
  white:      [255, 255, 255],
  text:       [50,  50,  50],
};

export default function ExportDocumentacaoButton() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const PW = doc.internal.pageSize.getWidth();
      const PH = doc.internal.pageSize.getHeight();
      const M  = 12;
      const CW = PW - 2 * M;
      let y = M;
      let pg = 1;

      // ── HELPERS ──────────────────────────────────────────────────
      const rgb = (c) => { doc.setTextColor(c[0], c[1], c[2]); };
      const fill = (c) => { doc.setFillColor(c[0], c[1], c[2]); };
      const draw = (c) => { doc.setDrawColor(c[0], c[1], c[2]); };

      const newPage = () => {
        footer();
        doc.addPage();
        pg++;
        y = M + 14;
        header();
      };

      const header = () => {
        fill(C.blue); doc.rect(0, 0, PW, 11, 'F');
        rgb(C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.text('AlmoxHub — Documentação Técnica', M, 7.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text(`Página ${pg}`, PW - M, 7.5, { align: 'right' });
      };

      const footer = () => {
        draw(C.slate200); doc.setLineWidth(0.3);
        doc.line(M, PH - 9, PW - M, PH - 9);
        rgb(C.slate600); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text(`AlmoxHub — Documentação Técnica — ${new Date().toLocaleDateString('pt-BR')}`, PW / 2, PH - 5, { align: 'center' });
      };

      const chk = (need = 10) => { if (y + need > PH - 14) newPage(); };

      // Main section title (large blue, underline)
      const sectionTitle = (text) => {
        chk(14);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); rgb(C.blue);
        doc.text(text, M, y); y += 7;
        draw(C.blue); doc.setLineWidth(0.5);
        doc.line(M, y, M + 80, y); y += 5;
      };

      // Card-style section (white bg with border, title bar)
      const cardTitle = (text, iconLabel = '') => {
        chk(14);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); rgb(C.slate800);
        doc.text((iconLabel ? iconLabel + ' ' : '') + text, M, y);
        y += 3;
        draw(C.slate200); doc.setLineWidth(0.3);
        doc.line(M, y, M + CW, y);
        y += 5;
      };

      // Colored info box
      const LH = 5.2; // standard line height
      const colorBox = (title, lines, bgColor, titleColor, textColor, borderColor) => {
        let h = 13; // title area
        lines.forEach(l => {
          const wrapped = doc.splitTextToSize(l, CW - 10);
          h += wrapped.length * LH + 1;
        });
        chk(h + 4);
        const by = y;
        fill(bgColor); draw(borderColor || bgColor); doc.setLineWidth(0.3);
        doc.rect(M, by, CW, h, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); rgb(titleColor);
        doc.text(title, M + 4, by + 8);
        y = by + 13;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); rgb(textColor);
        lines.forEach(l => {
          const ws = doc.splitTextToSize(l, CW - 10);
          ws.forEach(w => { chk(LH + 1); doc.text(w, M + 4, y); y += LH; });
          y += 1;
        });
        y = by + h + 4;
      };

      // Left-border colored block (camada style)
      const borderBlock = (title, rows, borderRgb) => {
        let h = 13; // title area
        rows.forEach(r => {
          const ws = doc.splitTextToSize(r, CW - 12);
          h += ws.length * LH + 1;
        });
        chk(h + 4);
        const by = y;
        fill(C.slate50); draw(C.slate200); doc.setLineWidth(0.3);
        doc.rect(M, by, CW, h, 'FD');
        fill(borderRgb); doc.rect(M, by, 3, h, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); rgb(C.slate800);
        doc.text(title, M + 6, by + 8);
        y = by + 13;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); rgb(C.text);
        rows.forEach(r => {
          const ws = doc.splitTextToSize(r, CW - 12);
          ws.forEach(w => { chk(LH + 1); doc.text(w, M + 6, y); y += LH; });
          y += 1;
        });
        y = by + h + 4;
      };

      // Badge pill
      const badge = (text, bgColor, fgColor) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
        const w = doc.getStringUnitWidth(text) * 7.5 / doc.internal.scaleFactor + 4;
        fill(bgColor); draw(bgColor); doc.setLineWidth(0);
        doc.roundedRect(M + badgeX, y, w, 5, 1, 1, 'F');
        rgb(fgColor); doc.text(text, M + badgeX + 2, y + 3.6);
        badgeX += w + 2;
      };

      let badgeX = 0;
      const startBadgeRow = () => { badgeX = 0; chk(8); };
      const endBadgeRow = () => { y += 7; };

      // Key-value row — renders key bold, then value on next line indented
      const kv = (key, val, valColor) => {
        chk(LH * 3);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); rgb(C.text);
        doc.text(key + ':', M + 2, y);
        y += LH;
        doc.setFont('helvetica', 'normal'); rgb(valColor || C.text);
        const ws = doc.splitTextToSize(val, CW - 8);
        ws.forEach(w => { chk(LH + 1); doc.text(w, M + 6, y); y += LH; });
        y += 2;
      };

      // Bullet
      const bull = (text, indent = 2) => {
        chk(5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); rgb(C.text);
        const ws = doc.splitTextToSize(text, CW - indent - 5);
        ws.forEach((w, i) => {
          if (i === 0) doc.text('•', M + indent, y);
          doc.text(w, M + indent + 4, y);
          y += 4.5;
        });
        y += 0.5;
      };

      const spacer = (n = 3) => { y += n; };

      // ── CAPA ────────────────────────────────────────────────────
      fill(C.blue); doc.rect(0, 0, PW, PH, 'F');
      fill([10, 40, 160]); doc.rect(0, PH * 0.55, PW, PH * 0.45, 'F');
      rgb(C.white);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(44);
      doc.text('AlmoxHub', PW / 2, 68, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(16);
      doc.text('Documentação Técnica Completa', PW / 2, 105, { align: 'center' });
      doc.setFontSize(10); doc.setTextColor(200, 220, 255);
      doc.text('Arquitetura • Implementação • Segurança • Operações • Analytics • Privacidade • DR/BCP', PW / 2, 122, { align: 'center' });
      doc.setFontSize(9); rgb(C.white);
      doc.text(`Versão 1.0.0 • ${new Date().toLocaleDateString('pt-BR')}`, PW / 2, PH - 30, { align: 'center' });
      doc.text('Gerado pelo sistema AlmoxHub', PW / 2, PH - 22, { align: 'center' });

      // ── ÍNDICE ──────────────────────────────────────────────────
      newPage();
      sectionTitle('Índice');
      const toc = [
        '1. Arquitetura do Sistema',
        '2. Funcionalidades e Recursos',
        '3. Guia de Implementação',
        '4. Operações e Infraestrutura',
        '5. Segurança da Informação',
        '6. Analytics e Dashboard',
        '7. Privacidade (Privacy by Design)',
        '8. Disaster Recovery e BCP',
      ];
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); rgb(C.text);
      toc.forEach(t => { chk(7); doc.text('• ' + t, M + 3, y); y += 7; });

      // ── 1. ARQUITETURA ──────────────────────────────────────────
      newPage();
      sectionTitle('1. Arquitetura do Sistema');

      cardTitle('Visão Geral do Sistema');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); rgb(C.text);
      const intro = doc.splitTextToSize('O AlmoxHub é uma plataforma web moderna para gestão integrada de almoxarifados, ordens de serviço, expedição, recebimento e logística da Axia Energia. Construído sobre a plataforma Base44 (BaaS), oferece gestão de operações em tempo real com rastreabilidade completa.', CW);
      intro.forEach(l => { chk(5); doc.text(l, M, y); y += 5; });
      spacer(3);

      // 3-col info boxes
      chk(16);
      const colW3 = (CW - 4) / 3;
      [{title:'Tipo', val:'Aplicação Web SPA', bg:C.blueLight, tc:C.blue},
       {title:'Ambiente', val:'Cloud (Base44 Platform)', bg:C.purpleLight, tc:C.purple},
       {title:'Classificação', val:'Dados Pessoais e Operacionais (LGPD)', bg:C.greenLight, tc:C.green},
      ].forEach(({title, val, bg, tc}, i) => {
        const cx = M + i * (colW3 + 2);
        fill(bg); draw(bg); doc.rect(cx, y, colW3, 14, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(tc[0], tc[1], tc[2]);
        doc.text(title, cx + 3, y + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); rgb(C.text);
        const vl = doc.splitTextToSize(val, colW3 - 6);
        vl.forEach((l, li) => doc.text(l, cx + 3, y + 9.5 + li * 4));
      });
      y += 18;

      spacer(2);
      cardTitle('Arquitetura de 3 Camadas');
      borderBlock('1. Camada de Apresentação (Frontend)', [
        'Framework: React 18 + Vite',
        'UI Library: shadcn/ui + Radix UI + Tailwind CSS',
        'State Management: React Query + React Context',
        'Roteamento: React Router DOM v6',
        'Visualização: Recharts + React Leaflet (mapas)',
        'Responsividade: Mobile-first com detecção automática',
        'Badges: React 18 | Tailwind CSS | React Query | Framer Motion | Recharts',
      ], [59, 130, 246]);

      borderBlock('2. Camada de Lógica de Negócio (Backend)', [
        'Runtime: Deno (Edge Functions)',
        'SDK: @base44/sdk v0.8.6',
        'Padrão: Serverless Functions (HTTP Handlers)',
        'Funções: parseNFeXML | enviarAlertas | registrarAuditLog | notificationService',
        '         checkDeadlines | checkRateLimit | anonimizarDados | exportBackupCritico',
        'Badges: Deno | Serverless | Base44 SDK | Edge Functions',
      ], [168, 85, 247]);

      borderBlock('3. Camada de Dados (Persistência)', [
        'Banco de Dados: Base44 Managed Database (NoSQL)',
        'Entidades (20+): OrdemServico | Pessoa | Regional | Almoxarifado | Instalacao',
        '                  Categoria | Subcategoria | Projeto | Comentario | Notificacao',
        '                  Conversa | MensagemChat | AuditLog | RIPD | Consentimento',
        '                  Transportadora | VeiculoAxia | CentroCusto | Fornecedor',
        'Recursos: Criptografia em repouso ✅ | RLS configurado ✅ | Soft-delete 30d ✅',
        '          Real-time subscriptions ✅ | Controle de versão ✅',
      ], [34, 197, 94]);

      spacer(2);
      cardTitle('Princípios de Design');
      const princPairs = [
        ['[1] Security First', 'RLS em todas entidades, sanitizacao de inputs (DOMPurify), logs de auditoria.'],
        ['[2] Mobile-First', 'Design responsivo, deteccao automatica de mobile, paginas otimizadas.'],
        ['[3] Component-Driven', 'Componentes reutilizaveis, separacao de concerns, shadcn/ui.'],
        ['[4] Performance', 'React Query para cache, lazy loading, virtualizacao de listas.'],
        ['[5] Real-time', 'Subscriptions em entidades criticas, notificacoes push, mensagens ao vivo.'],
        ['[6] Data-Driven', 'Dashboard com insights, torre de controle, analytics, audit logs.'],
      ];
      const hW = (CW - 3) / 2;
      princPairs.forEach(([title, desc], i) => {
        if (i % 2 === 0) { chk(18); }
        const cx = M + (i % 2) * (hW + 3);
        const ry = i % 2 === 0 ? y : y;
        if (i % 2 === 0 && i > 0) { /* already moved */ }
        fill(C.slate100); draw(C.slate200); doc.setLineWidth(0.3);
        doc.rect(cx, i % 2 === 0 ? y : y - 14, hW, 13, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); rgb(C.slate800);
        doc.text(title, cx + 3, (i % 2 === 0 ? y : y - 14) + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); rgb(C.slate600);
        const dl = doc.splitTextToSize(desc, hW - 6);
        dl.slice(0,2).forEach((l, li) => doc.text(l, cx + 3, (i % 2 === 0 ? y : y - 14) + 9 + li * 3.5));
        if (i % 2 === 1) y += 16;
      });
      spacer(3);

      // ── 2. FUNCIONALIDADES ──────────────────────────────────────
      newPage();
      sectionTitle('2. Funcionalidades e Recursos');

      cardTitle('Gestão de Ordens de Serviço');
      colorBox('Sistema de OS — Workflow e Controle', [
        '• Workflow em 4 estagios: Elaboracao > Execucao > Concluido / Cancelado',
        '• Priorização: baixa | média | alta | urgente',
        '• Atribuição de líder responsável e múltiplos executores',
        '• Controle de progresso percentual em tempo real',
        '• Gestão de prazos com alertas automáticos de vencimento',
        '• Suporte a anexos, galeria de imagens e documentos',
        '• Histórico completo e auditado de todas as alterações',
        '• Comentários com menções @usuário e notificações',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      spacer(2);
      cardTitle('Módulos de Expedição e Recebimento');
      colorBox('Expedição', [
        '• Separação de materiais com controle de status',
        '• Gestão de volumes: dimensões, peso, cálculo de m³',
        '• Detalhamento de expedição: transportadora, veículo, motorista',
        '• Geração de etiquetas logísticas com código de barras e QR code',
        '• Ordens de Saída geradas automaticamente',
      ], C.purpleLight, C.purple, C.text, [216, 180, 254]);

      colorBox('Recebimento', [
        '• Importação automática de XML NFe',
        '• Conferência de itens com validação de divergências',
        '• Workflow de recebimento em 4 etapas',
        '• Identificação e rastreamento de problemas',
        '• MIGO, V360, conferência manual disponíveis',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      spacer(2);
      cardTitle('Comunicação e Colaboração');
      colorBox('Mensagens e Notificações', [
        '• Chat em tempo real: conversas privadas e grupos',
        '• Editor de texto rico com formatação (negrito, listas, menções)',
        '• Notificações in-app: atribuição, mudança de status, menções, prazos',
        '• Push notifications Web: suporte a alertas mesmo fora do app',
        '• Preferências granulares de notificação por usuário',
      ], C.amberLight, C.amber, C.text, [253, 230, 138]);

      // ── 3. IMPLEMENTAÇÃO ─────────────────────────────────────────
      newPage();
      sectionTitle('3. Guia de Implementação');

      cardTitle('Configuração Inicial do Sistema');
      colorBox('Passos de Implantação (ordem recomendada)', [
        '1. Cadastrar Regionais com sigla, descrição, gerência e gestor responsável',
        '2. Cadastrar Instalações vinculadas às regionais',
        '3. Criar Almoxarifados vinculados a instalações e regionais',
        '4. Cadastrar Pessoas: matrícula, e-mail, funções (gestor/lider/almoxarife)',
        '5. Definir Categorias e Subcategorias de OS',
        '6. Configurar alertas e preferências de notificação',
        '7. Cadastrar Transportadoras e Veículos Axia',
        '8. Configurar Equipes por almoxarifado',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      spacer(2);
      cardTitle('Onboarding de Novos Usuários');
      colorBox('Fluxo Automático de Aprovação', [
        '• Usuário acessa o sistema e completa formulário NewUserSetup',
        '• Sistema cria registro em Pessoa com status_aprovacao = "pendente"',
        '• Administrador aprova na página UserApproval',
        '• Modal de consentimento LGPD exibido no primeiro acesso aprovado',
        '• Preferências de notificação configuradas pelo usuário',
        '• Timeout de sessão: 15 minutos de inatividade com aviso 2 min antes',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      spacer(2);
      cardTitle('Boas Práticas de Desenvolvimento');
      borderBlock('Padrões de Código', [
        'Sempre validar inputs no servidor (nunca confiar apenas no frontend)',
        'Usar queries parametrizadas — nunca concatenação de strings',
        'Sanitizar HTML com DOMPurify antes de renderizar (proteção XSS)',
        'Verificar autenticação em todas as backend functions',
        'Usar asServiceRole apenas quando estritamente necessário',
        'Nunca expor secrets ou API keys no código frontend',
        'Registrar todas ações críticas em AuditLog',
      ], C.blue);

      borderBlock('Padrões de Arquitetura', [
        'Criar componentes pequenos e focados (máx. ~100 linhas)',
        'Nunca duplicar lógica — criar hooks customizados (useIdleTimer, etc.)',
        'React Query para cache e revalidação automática de dados',
        'Context API apenas para estado verdadeiramente global (AppContext)',
        'Separar pages/ components/ functions/ entities/ (flat structure)',
      ], [168, 85, 247]);

      // ── 4. OPERAÇÕES ─────────────────────────────────────────────
      newPage();
      sectionTitle('4. Operações e Infraestrutura');

      cardTitle('Deployment e Hospedagem');
      colorBox('Base44 Platform (BaaS)', [
        '• Hospedagem: Gerenciada pela Base44 (Cloud)',
        '• Deploy: Automático via Git integration ou Base44 CLI',
        '• Certificações: SOC 2 Type II + ISO 27001',
        '• Uptime SLA: 99.9% (tipicamente)',
        '• Edge Functions: Deno runtime, deploy instantâneo',
        '• CDN: Global edge network para assets',
        '• SSL: Certificados gerenciados automaticamente',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      spacer(2);
      cardTitle('Variáveis de Ambiente');
      const envVars = [
        ['BASE44_APP_ID', 'Pré-populado automaticamente. ID único do app Base44.'],
        ['VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY', 'Chaves para push notifications. Configurar via Dashboard > Settings.'],
        ['Custom Secrets', 'Adicionar via Dashboard > Settings > Environment Variables.'],
      ];
      envVars.forEach(([k, v]) => { chk(8); kv(k, v, C.green); spacer(2); });

      spacer(2);
      cardTitle('Backup e Recuperação');
      colorBox('✅ Política de Backup Implementada', [
        '• Soft-delete: 30 dias de recuperação para dados excluídos',
        '• Backup Base44: Automático pela plataforma',
        '• Backup Semanal Preventivo: Automation exportBackupCritico (domingos 02:00 UTC)',
        '• Storage Privado: 4 semanas de retenção, criptografado',
        '• Formato: JSON + Metadata (timestamp, versão)',
        '• Entidades exportadas: OrdemServico, Pessoa, Regional, Almoxarifado, e mais',
        '• Retenção de logs: recomendado 90 dias mínimo, 2 anos SOx',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      spacer(2);
      cardTitle('Troubleshooting Comum');
      colorBox('Erros Frequentes e Soluções', [
        'Erro 429 (Too Many Requests): Rate limit atingido → implementar retry com backoff exponencial.',
        'Usuário → PendingApproval: status_aprovacao != "aprovado" → Admin aprovar na UserApproval page.',
        'RLS Forbidden: Usuário sem permissão → verificar role e ownership; usar asServiceRole no backend.',
        'Push Notification falha: VAPID keys não configuradas → verificar env vars e PushSubscription entity.',
      ], C.amberLight, C.amber, C.text, [253, 230, 138]);

      // ── 5. SEGURANÇA ─────────────────────────────────────────────
      newPage();
      sectionTitle('5. Segurança da Informação');

      cardTitle('Conformidade GRIF-002/2024 — Resumo Executivo');
      chk(16);
      const kpiW = (CW - 4) / 3;
      [['94%', 'Conformidade Geral', C.greenLight, C.green],
       ['BAIXO', 'Risco Geral', C.greenLight, C.green],
       ['90d', 'Plano de Ação', C.blueLight, C.blue],
      ].forEach(([val, lbl, bg, tc], i) => {
        const cx = M + i * (kpiW + 2);
        fill(bg); draw(bg); doc.rect(cx, y, kpiW, 12, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(tc[0], tc[1], tc[2]);
        doc.text(val, cx + kpiW / 2, y + 6.5, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); rgb(C.text);
        doc.text(lbl, cx + kpiW / 2, y + 10.5, { align: 'center' });
      });
      y += 15;

      spacer(2);
      cardTitle('Controles de Segurança Implementados');
      colorBox('🔐 Autenticação e Autorização', [
        '• Base44 Auth (gerenciada) — senhas mascaradas',
        '• RBAC implementado: 5 roles (admin, gestor, lider, almoxarife, user)',
        '• Row Level Security (RLS) em entidades sensíveis',
        '• Aprovação manual de novos usuários por admin',
        '• Timeout 15min inatividade com aviso 2min antes ✅',
        '• Delegação de permissões temporária com controle de vigência ✅',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      colorBox('🔒 Criptografia e Proteção', [
        '• DB criptografado em repouso (padrão indústria)',
        '• TLS 1.2+ para dados em trânsito',
        '• Sanitização de inputs com DOMPurify (proteção XSS)',
        '• Queries parametrizadas (proteção SQL Injection)',
        '• Soft-delete com recuperação em 30 dias',
        '• CSP completo | HSTS | X-Frame-Options | Referrer-Policy ✅',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      colorBox('⚡ Rate Limiting e Rastreabilidade', [
        '• LoginAttempt entity rastreia tentativas de login',
        '• CAPTCHA após 3 falhas (reCAPTCHA v2) ✅',
        '• Bloqueio temporário após 10 falhas consecutivas ✅',
        '• Cleanup automático diário de tentativas antigas ✅',
        '• AuditLog entity: todas ações críticas com IP e user-agent',
        '• Página AuditLogs (somente admin)',
      ], C.tealLight, C.teal, C.text, [94, 234, 212]);

      spacer(2);
      cardTitle('Lacunas e Plano de Ação');
      colorBox('Alta Prioridade (30 dias)', [
        '• MFA via SSO: Integrar Azure AD/Okta com MFA obrigatório',
        '• WAF Externo: Cloudflare/AWS WAF com regras OWASP Top 10',
        '✅ Backup Testado: IMPLEMENTADO — backup semanal automático',
        '✅ Rate Limiting Ampliado: IMPLEMENTADO — CAPTCHA + bloqueio',
      ], C.redLight, C.red, C.text, [252, 165, 165]);

      colorBox('Média Prioridade (60 dias)', [
        '• Integração SIEM Eletrobras: webhook para logs de segurança',
        '• SAST/DAST: pipeline CI/CD com Snyk/SonarQube',
        '✅ Timeout Sessão: IMPLEMENTADO — 15 minutos de inatividade',
        '✅ Headers HTTP Seguros: IMPLEMENTADO — CSP, HSTS, X-Frame-Options',
      ], C.amberLight, C.amber, C.text, [253, 230, 138]);

      // ── 6. ANALYTICS ─────────────────────────────────────────────
      newPage();
      sectionTitle('6. Analytics e Dashboard');

      cardTitle('KPIs e Métricas Principais');
      colorBox('Visão Geral — Filtros Globais', [
        '• Período, Regional, Almoxarifado, Categoria, Subcategoria, Líder, Status',
        '• Filtros persistidos por usuário (user.filtros_preferidos)',
        '• Atualização em tempo real ao aplicar filtros',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      colorBox('KPIs do Dashboard Principal', [
        '• Total OS: count de ordens no período filtrado',
        '• Taxa de Conclusão: (OS concluídas / Total OS) × 100%',
        '• Em Execução: OS com status "execucao"',
        '• Atrasadas: OS com prazo < hoje e status ≠ concluido/cancelado',
        '• Tempo Médio de Resolução: Σ(data_conclusao - data_inicial) / OS concluídas',
        '• OTIF (On-Time In-Full): entregas no prazo e completas / total expedições',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      spacer(2);
      cardTitle('Visualizações e Gráficos');
      colorBox('Tipos de Visualização Disponíveis', [
        '• Gráfico de barras: OS por status, OS por regional, OS por categoria',
        '• Gráfico de linha: evolução temporal mensal/trimestral/anual',
        '• Pizza/Donut: distribuição por prioridade e status',
        '• Heatmap georreferenciado: expedições por região (React Leaflet)',
        '• Ranking de produtividade: top líderes e executores',
        '• Torre de Controle: alertas de risco, atrasos, inatividade em tempo real',
        '• Insights automáticos: anomalias detectadas e recomendações',
      ], C.purpleLight, C.purple, C.text, [216, 180, 254]);

      spacer(2);
      cardTitle('Painéis Específicos');
      borderBlock('Painel Expedição', [
        'OTIF por período | Volumetria de expedições | Status de entregas',
        'Lead time médio expedição | Ranking de transportadoras | Mapa de rotas',
      ], [59, 130, 246]);
      borderBlock('Painel Recebimento', [
        'Taxa de conformidade NF | Divergências identificadas | Lead time recebimento',
        'Problemas por categoria | Status de conferências | Armazenagem completada',
      ], [34, 197, 94]);
      borderBlock('Torre de Controle', [
        'OS em risco: prazo < 3 dias | Líderes sobrecarregados | OS sem atualização > 7 dias',
        'Problemas recebimento em aberto | Expedições pendentes > prazo',
      ], [168, 85, 247]);

      // ── 7. PRIVACIDADE ───────────────────────────────────────────
      newPage();
      sectionTitle('7. Privacidade — Privacy by Design');

      cardTitle('7 Princípios Aplicados (ISO 29101)');
      const privPrincipios = [
        ['1. Proativo, não Reativo', 'Prevenção de violações antes que ocorram. Análise de impacto (RIPD) obrigatória para novos recursos.'],
        ['2. Privacidade como Padrão', 'Dados coletados são mínimos e necessários. Sem opt-in necessário — privacidade é o default.'],
        ['3. Privacidade Incorporada', 'LGPD considerada desde o design. Consentimentos, anonimização e direitos integrados.'],
        ['4. Funcionalidade Total', 'Segurança e funcionalidade coexistem sem comprometimento de nenhuma das duas.'],
        ['5. Segurança Ponta a Ponta', 'Criptografia em repouso e em trânsito. Soft-delete com recuperação.'],
        ['6. Visibilidade e Transparência', 'Audit logs acessíveis. Portal do Titular para exercício de direitos.'],
        ['7. Respeito ao Usuário', 'Consentimento granular por finalidade. Direito ao esquecimento implementado.'],
      ];
      privPrincipios.forEach(([title, desc]) => {
        chk(8);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); rgb(C.blue);
        doc.text(title, M + 2, y); y += 4.5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); rgb(C.text);
        const ls = doc.splitTextToSize(desc, CW - 4);
        ls.forEach(l => { chk(5); doc.text(l, M + 4, y); y += 4.2; });
        y += 2;
      });

      spacer(2);
      cardTitle('Implementações LGPD');
      colorBox('Portal do Titular — Direitos dos Titulares', [
        '✅ Acesso: Geração automática do relatório de dados do usuário',
        '✅ Retificação: Edição de dados via perfil',
        '✅ Exclusão: Anonimização via backend function (masking/hashing)',
        '✅ Portabilidade: Exportação de dados em JSON',
        '✅ Revogação: Consentimentos podem ser revogados com registro',
        '✅ Prazo de resposta: 15 dias configurado no workflow',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      colorBox('RIPD — Relatório de Impacto à Proteção de Dados', [
        '✅ Wizard completo de 10 seções para novos recursos',
        '✅ Geração de PDF profissional com assinatura',
        '✅ Versionamento de RIPDs',
        '✅ Bases legais mapeadas por finalidade de tratamento',
        '✅ Medidas de mitigação documentadas',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      colorBox('Consentimentos e Registros', [
        '✅ Modal de consentimento no primeiro acesso aprovado',
        '✅ Consentimentos granulares: uso_basico, analytics, notificacoes, etc.',
        '✅ Registro com IP, user-agent, data e hora',
        '✅ Revogação individual por finalidade',
        '✅ Página "Meus Consentimentos" para usuário',
      ], C.purpleLight, C.purple, C.text, [216, 180, 254]);

      // ── 8. DISASTER RECOVERY ─────────────────────────────────────
      newPage();
      sectionTitle('8. Disaster Recovery e BCP');

      cardTitle('RTO e RPO por Processo Crítico');
      chk(50);
      const drRows = [
        ['Processo', 'RTO', 'RPO', 'Prioridade'],
        ['Gestão de OS', '4 horas', '1 hora', 'Crítico'],
        ['Expedição em andamento', '4 horas', '1 hora', 'Crítico'],
        ['Recebimento NFe', '8 horas', '4 horas', 'Alto'],
        ['Dashboard / Analytics', '8 horas', '4 horas', 'Alto'],
        ['Cadastros (Pessoas, etc.)', '24 horas', '4 horas', 'Médio'],
        ['Audit Logs', '48 horas', '24 horas', 'Médio'],
        ['Mensagens / Chat', '24 horas', '8 horas', 'Médio'],
      ];
      const colsW = [75, 27, 27, 27];
      const tableX = [M, M + 75, M + 102, M + 129];
      // Header
      fill(C.blue); doc.rect(M, y, CW, 7, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); rgb(C.white);
      drRows[0].forEach((h, i) => doc.text(h, tableX[i] + 2, y + 5));
      y += 7;
      drRows.slice(1).forEach((row, ri) => {
        chk(7);
        fill(ri % 2 === 0 ? C.slate50 : C.white);
        doc.rect(M, y, CW, 6.5, 'F');
        draw(C.slate200); doc.setLineWidth(0.2);
        doc.rect(M, y, CW, 6.5, 'D');
        doc.setFont('helvetica', ri === 0 ? 'bold' : 'normal'); doc.setFontSize(8.5);
        rgb(C.text);
        row.forEach((cell, i) => {
          const color = cell === 'Crítico' ? C.red : cell === 'Alto' ? C.amber : C.text;
          rgb(color);
          doc.text(cell, tableX[i] + 2, y + 4.5);
        });
        y += 6.5;
      });
      y += 4;

      cardTitle('BIA — Business Impact Analysis');
      colorBox('Análise de Impacto Implementada ✅', [
        '• 12 processos críticos identificados e documentados',
        '• Impactos financeiros, operacionais e reputacionais mapeados',
        '• Dependências entre sistemas identificadas',
        '• Responsáveis por processo documentados',
        '• Criticalidade classificada em: Crítico | Alto | Médio | Baixo',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      spacer(2);
      cardTitle('Runbooks de Recuperação');
      borderBlock('Cenário 1 — Perda Total de Dados', [
        '1. Acionar equipe de resposta a incidentes',
        '2. Acessar backup mais recente (Private Storage)',
        '3. Criar novo app Base44 ou usar restore point',
        '4. Importar entidades via bulk create',
        '5. Validar integridade de dados críticos (OS, Pessoas)',
        '6. Comunicar stakeholders e registrar incident report',
      ], C.red);

      borderBlock('Cenário 2 — Corrupção de Entidade', [
        '1. Identificar entidade afetada via AuditLog',
        '2. Extrair backup semanal (exportBackupCritico)',
        '3. Isolar registros corrompidos',
        '4. Restaurar via script de importação JSON',
        '5. Validar dados restaurados com amostragem',
        '6. Registrar post-mortem e atualizar runbook',
      ], C.amber);

      borderBlock('Cenário 3 — Indisponibilidade da Plataforma', [
        '1. Verificar status em status.base44.com',
        '2. Comunicar usuários via canal alternativo (email/WhatsApp)',
        '3. Ativar modo offline se disponível',
        '4. Documentar impacto para SLA claim',
        '5. Retomar operações normais após restabelecimento',
      ], [59, 130, 246]);

      spacer(2);
      cardTitle('Testes e Validação do Plano DR');
      colorBox('Agenda de Testes Trimestrais ✅', [
        '• Simulação trimestral completa agendada',
        '• MTTR (Mean Time To Recovery) medido vs. objetivo',
        '• Teste de restore de backup: exportBackupCritico validado mensalmente',
        '• Exercício de comunicação de crise com stakeholders',
        '• Atualização do runbook após cada simulação',
        '• Resultados documentados e histórico mantido',
      ], C.tealLight, C.teal, C.text, [94, 234, 212]);

      // Final footer
      footer();

      doc.save(`AlmoxHub_Documentacao_Tecnica_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 mr-2" />
          Exportar Documentação Completa (PDF)
        </>
      )}
    </Button>
  );
}