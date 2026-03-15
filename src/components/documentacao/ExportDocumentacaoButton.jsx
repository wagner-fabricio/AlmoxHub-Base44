import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

const C = {
  blue:       [0,   0,   255],
  blueLight:  [239, 246, 255],
  blueMid:    [191, 219, 254],
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
      const sectionPgs = {}; // track page where each section starts

      const rgb  = (c) => { doc.setTextColor(c[0], c[1], c[2]); };
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
        doc.text('AlmoxHub — Documentacao Tecnica', M, 7.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text(`Pagina ${pg}`, PW - M, 7.5, { align: 'right' });
      };

      const footer = () => {
        draw(C.slate200); doc.setLineWidth(0.3);
        doc.line(M, PH - 9, PW - M, PH - 9);
        rgb(C.slate600); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
        doc.text(`AlmoxHub — Documentacao Tecnica — ${new Date().toLocaleDateString('pt-BR')}`, PW / 2, PH - 5, { align: 'center' });
      };

      const chk = (need = 10) => { if (y + need > PH - 14) newPage(); };

      const sectionTitle = (text) => {
        chk(14);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); rgb(C.blue);
        doc.text(text, M, y); y += 7;
        draw(C.blue); doc.setLineWidth(0.5);
        doc.line(M, y, M + 80, y); y += 5;
      };

      const cardTitle = (text, iconLabel = '') => {
        chk(14);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); rgb(C.slate800);
        doc.text((iconLabel ? iconLabel + ' ' : '') + text, M, y);
        y += 3;
        draw(C.slate200); doc.setLineWidth(0.3);
        doc.line(M, y, M + CW, y);
        y += 5;
      };

      const LH = 5.2;
      const colorBox = (title, lines, bgColor, titleColor, textColor, borderColor) => {
        let h = 13;
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

      const borderBlock = (title, rows, borderRgb) => {
        let h = 13;
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

      // Formula box (monospace-style dark background)
      const formulaBox = (lines) => {
        const fh = lines.length * LH + 6;
        chk(fh + 4);
        const by = y;
        fill([240, 244, 248]); draw(C.slate200); doc.setLineWidth(0.2);
        doc.rect(M, by, CW, fh, 'FD');
        fill(C.blue); doc.rect(M, by, 2.5, fh, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); rgb(C.blue);
        lines.forEach((l, i) => {
          doc.text(l, M + 5, by + 5 + i * LH);
        });
        y = by + fh + 4;
      };

      const spacer = (n = 3) => { y += n; };

      // ── CAPA ──────────────────────────────────────────────────────
      fill(C.blue); doc.rect(0, 0, PW, PH, 'F');
      fill([10, 40, 160]); doc.rect(0, PH * 0.55, PW, PH * 0.45, 'F');
      rgb(C.white);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(44);
      doc.text('AlmoxHub', PW / 2, 68, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(16);
      doc.text('Documentacao Tecnica Completa', PW / 2, 105, { align: 'center' });
      doc.setFontSize(10); doc.setTextColor(200, 220, 255);
      doc.text('Arquitetura | Implementacao | Seguranca | Operacoes | Analytics | Privacidade | DR/BCP', PW / 2, 122, { align: 'center' });
      doc.setFontSize(9); rgb(C.white);
      doc.text(`Versao 1.0.0 - ${new Date().toLocaleDateString('pt-BR')}`, PW / 2, PH - 30, { align: 'center' });
      doc.text('Gerado pelo sistema AlmoxHub', PW / 2, PH - 22, { align: 'center' });

      // ── ÍNDICE (page 2) — placeholder, will fill in after sections ──
      newPage(); // pg = 2
      const tocPage = pg;
      sectionTitle('Indice');
      const tocStartY = y;

      // ── 1. ARQUITETURA ──────────────────────────────────────────────
      newPage(); sectionPgs[1] = pg;
      sectionTitle('1. Arquitetura do Sistema');

      cardTitle('Visao Geral do Sistema');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); rgb(C.text);
      const intro = doc.splitTextToSize('O AlmoxHub e uma plataforma web moderna para gestao integrada de almoxarifados, ordens de servico, expedicao, recebimento e logistica da Axia Energia. Construido sobre a plataforma Base44 (BaaS), oferece gestao de operacoes em tempo real com rastreabilidade completa.', CW);
      intro.forEach(l => { chk(5); doc.text(l, M, y); y += 5; });
      spacer(3);

      chk(16);
      const colW3 = (CW - 4) / 3;
      [{title:'Tipo', val:'Aplicacao Web SPA', bg:C.blueLight, tc:C.blue},
       {title:'Ambiente', val:'Cloud (Base44 Platform)', bg:C.purpleLight, tc:C.purple},
       {title:'Classificacao', val:'Dados Pessoais e Operacionais (LGPD)', bg:C.greenLight, tc:C.green},
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
      borderBlock('1. Camada de Apresentacao (Frontend)', [
        'Framework: React 18 + Vite',
        'UI Library: shadcn/ui + Radix UI + Tailwind CSS',
        'State Management: React Query + React Context',
        'Roteamento: React Router DOM v6',
        'Visualizacao: Recharts + React Leaflet (mapas)',
        'Responsividade: Mobile-first com deteccao automatica',
      ], [59, 130, 246]);

      borderBlock('2. Camada de Logica de Negocio (Backend)', [
        'Runtime: Deno (Edge Functions)',
        'SDK: @base44/sdk v0.8.6',
        'Padrao: Serverless Functions (HTTP Handlers)',
        'Funcoes: parseNFeXML | enviarAlertas | registrarAuditLog | notificationService',
        '         checkDeadlines | checkRateLimit | anonimizarDados | exportBackupCritico',
      ], [168, 85, 247]);

      borderBlock('3. Camada de Dados (Persistencia)', [
        'Banco de Dados: Base44 Managed Database (NoSQL)',
        'Entidades (20+): OrdemServico | Pessoa | Regional | Almoxarifado | Instalacao',
        '                  Categoria | Subcategoria | Projeto | Comentario | Notificacao',
        '                  Conversa | MensagemChat | AuditLog | RIPD | Consentimento',
        'Recursos: Criptografia em repouso [OK] | RLS configurado [OK] | Soft-delete 30d [OK]',
        '          Real-time subscriptions [OK] | Controle de versao [OK]',
      ], [34, 197, 94]);

      spacer(2);
      cardTitle('Principios de Design');
      const princPairs = [
        ['Security First', 'RLS em todas entidades, sanitizacao de inputs (DOMPurify), logs de auditoria.'],
        ['Mobile-First', 'Design responsivo, deteccao automatica de mobile, paginas otimizadas.'],
        ['Component-Driven', 'Componentes reutilizaveis, separacao de concerns, shadcn/ui.'],
        ['Performance', 'React Query para cache, lazy loading, virtualizacao de listas.'],
        ['Real-time', 'Subscriptions em entidades criticas, notificacoes push, mensagens ao vivo.'],
        ['Data-Driven', 'Dashboard com insights, torre de controle, analytics, audit logs.'],
      ];
      const hW = (CW - 3) / 2;
      princPairs.forEach(([title, desc], i) => {
        if (i % 2 === 0) { chk(18); }
        const cx = M + (i % 2) * (hW + 3);
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

      // ── 2. FUNCIONALIDADES ──────────────────────────────────────────
      newPage(); sectionPgs[2] = pg;
      sectionTitle('2. Funcionalidades e Recursos');

      cardTitle('Gestao de Ordens de Servico');
      colorBox('Sistema de OS — Workflow e Controle', [
        '• Workflow em 4 estagios: Elaboracao > Execucao > Concluido / Cancelado',
        '• Priorizacao: baixa | media | alta | urgente',
        '• Atribuicao de lider responsavel e multiplos executores',
        '• Controle de progresso percentual em tempo real',
        '• Gestao de prazos com alertas automaticos de vencimento',
        '• Suporte a anexos, galeria de imagens e documentos',
        '• Historico completo e auditado de todas as alteracoes',
        '• Comentarios com mencoes @usuario e notificacoes',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      spacer(2);
      cardTitle('Modulos de Expedicao e Recebimento');
      colorBox('Expedicao', [
        '• Separacao de materiais com controle de status',
        '• Gestao de volumes: dimensoes, peso, calculo de m3',
        '• Detalhamento de expedicao: transportadora, veiculo, motorista',
        '• Geracao de etiquetas logisticas com codigo de barras e QR code',
        '• Ordens de Saida geradas automaticamente',
      ], C.purpleLight, C.purple, C.text, [216, 180, 254]);

      colorBox('Recebimento', [
        '• Importacao automatica de XML NFe',
        '• Conferencia de itens com validacao de divergencias',
        '• Workflow de recebimento em 4 etapas',
        '• Identificacao e rastreamento de problemas',
        '• MIGO, V360, conferencia manual disponiveis',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      spacer(2);
      cardTitle('Comunicacao e Colaboracao');
      colorBox('Mensagens e Notificacoes', [
        '• Chat em tempo real: conversas privadas e grupos',
        '• Editor de texto rico com formatacao (negrito, listas, mencoes)',
        '• Notificacoes in-app: atribuicao, mudanca de status, mencoes, prazos',
        '• Push notifications Web: suporte a alertas mesmo fora do app',
        '• Preferencias granulares de notificacao por usuario',
      ], C.amberLight, C.amber, C.text, [253, 230, 138]);

      // ── 3. IMPLEMENTAÇÃO ───────────────────────────────────────────
      newPage(); sectionPgs[3] = pg;
      sectionTitle('3. Guia de Implementacao');

      cardTitle('Configuracao Inicial do Sistema');
      colorBox('Passos de Implantacao (ordem recomendada)', [
        '1. Cadastrar Regionais com sigla, descricao, gerencia e gestor responsavel',
        '2. Cadastrar Instalacoes vinculadas as regionais',
        '3. Criar Almoxarifados vinculados a instalacoes e regionais',
        '4. Cadastrar Pessoas: matricula, e-mail, funcoes (gestor/lider/almoxarife)',
        '5. Definir Categorias e Subcategorias de OS',
        '6. Configurar alertas e preferencias de notificacao',
        '7. Cadastrar Transportadoras e Veiculos Axia',
        '8. Configurar Equipes por almoxarifado',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      spacer(2);
      cardTitle('Onboarding de Novos Usuarios');
      colorBox('Fluxo Automatico de Aprovacao', [
        '• Usuario acessa o sistema e completa formulario NewUserSetup',
        '• Sistema cria registro em Pessoa com status_aprovacao = "pendente"',
        '• Administrador aprova na pagina UserApproval',
        '• Modal de consentimento LGPD exibido no primeiro acesso aprovado',
        '• Preferencias de notificacao configuradas pelo usuario',
        '• Timeout de sessao: 15 minutos de inatividade com aviso 2 min antes',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      spacer(2);
      cardTitle('Boas Praticas de Desenvolvimento');
      borderBlock('Padroes de Codigo', [
        'Sempre validar inputs no servidor (nunca confiar apenas no frontend)',
        'Usar queries parametrizadas — nunca concatenacao de strings',
        'Sanitizar HTML com DOMPurify antes de renderizar (protecao XSS)',
        'Verificar autenticacao em todas as backend functions',
        'Usar asServiceRole apenas quando estritamente necessario',
        'Nunca expor secrets ou API keys no codigo frontend',
        'Registrar todas acoes criticas em AuditLog',
      ], C.blue);

      borderBlock('Padroes de Arquitetura', [
        'Criar componentes pequenos e focados (max. ~100 linhas)',
        'Nunca duplicar logica — criar hooks customizados (useIdleTimer, etc.)',
        'React Query para cache e revalidacao automatica de dados',
        'Context API apenas para estado verdadeiramente global (AppContext)',
        'Separar pages/ components/ functions/ entities/ (flat structure)',
      ], [168, 85, 247]);

      // ── 4. OPERAÇÕES ───────────────────────────────────────────────
      newPage(); sectionPgs[4] = pg;
      sectionTitle('4. Operacoes e Infraestrutura');

      cardTitle('Deployment e Hospedagem');
      colorBox('Base44 Platform (BaaS)', [
        '• Hospedagem: Gerenciada pela Base44 (Cloud)',
        '• Deploy: Automatico via Git integration ou Base44 CLI',
        '• Certificacoes: SOC 2 Type II + ISO 27001',
        '• Uptime SLA: 99.9% (tipicamente)',
        '• Edge Functions: Deno runtime, deploy instantaneo',
        '• CDN: Global edge network para assets',
        '• SSL: Certificados gerenciados automaticamente',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      spacer(2);
      cardTitle('Variaveis de Ambiente');
      const envVars = [
        ['BASE44_APP_ID', 'Pre-populado automaticamente. ID unico do app Base44.'],
        ['VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY', 'Chaves para push notifications. Configurar via Dashboard > Settings.'],
        ['Custom Secrets', 'Adicionar via Dashboard > Settings > Environment Variables.'],
      ];
      envVars.forEach(([k, v]) => { chk(8); kv(k, v, C.green); spacer(2); });

      spacer(2);
      cardTitle('Backup e Recuperacao');
      colorBox('[OK] Politica de Backup Implementada', [
        '• Soft-delete: 30 dias de recuperacao para dados excluidos',
        '• Backup Base44: Automatico pela plataforma',
        '• Backup Semanal Preventivo: Automation exportBackupCritico (domingos 02:00 UTC)',
        '• Storage Privado: 4 semanas de retencao, criptografado',
        '• Formato: JSON + Metadata (timestamp, versao)',
        '• Entidades exportadas: OrdemServico, Pessoa, Regional, Almoxarifado, e mais',
        '• Retencao de logs: recomendado 90 dias minimo, 2 anos SOx',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      spacer(2);
      cardTitle('Troubleshooting Comum');
      colorBox('Erros Frequentes e Solucoes', [
        'Erro 429 (Too Many Requests): Rate limit atingido. Implementar retry com backoff exponencial.',
        'Usuario > PendingApproval: status_aprovacao != "aprovado". Admin aprovar na UserApproval page.',
        'RLS Forbidden: Usuario sem permissao. Verificar role e ownership; usar asServiceRole no backend.',
        'Push Notification falha: VAPID keys nao configuradas. Verificar env vars e PushSubscription entity.',
      ], C.amberLight, C.amber, C.text, [253, 230, 138]);

      // ── 5. SEGURANÇA ───────────────────────────────────────────────
      newPage(); sectionPgs[5] = pg;
      sectionTitle('5. Seguranca da Informacao');

      cardTitle('Conformidade GRIF-002/2024 — Resumo Executivo');
      chk(16);
      const kpiW = (CW - 4) / 3;
      [['94%', 'Conformidade Geral', C.greenLight, C.green],
       ['BAIXO', 'Risco Geral', C.greenLight, C.green],
       ['90d', 'Plano de Acao', C.blueLight, C.blue],
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
      cardTitle('Controles de Seguranca Implementados');
      colorBox('Autenticacao e Autorizacao', [
        '• Base44 Auth (gerenciada) — senhas mascaradas',
        '• RBAC implementado: 5 roles (admin, gestor, lider, almoxarife, user)',
        '• Row Level Security (RLS) em entidades sensiveis',
        '• Aprovacao manual de novos usuarios por admin',
        '• Timeout 15min inatividade com aviso 2min antes [OK]',
        '• Delegacao de permissoes temporaria com controle de vigencia [OK]',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      colorBox('Criptografia e Protecao', [
        '• DB criptografado em repouso (padrao industria)',
        '• TLS 1.2+ para dados em transito',
        '• Sanitizacao de inputs com DOMPurify (protecao XSS)',
        '• Queries parametrizadas (protecao SQL Injection)',
        '• Soft-delete com recuperacao em 30 dias',
        '• CSP completo | HSTS | X-Frame-Options | Referrer-Policy [OK]',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      colorBox('Rate Limiting e Rastreabilidade', [
        '• LoginAttempt entity rastreia tentativas de login',
        '• CAPTCHA apos 3 falhas (reCAPTCHA v2) [OK]',
        '• Bloqueio temporario apos 10 falhas consecutivas [OK]',
        '• Cleanup automatico diario de tentativas antigas [OK]',
        '• AuditLog entity: todas acoes criticas com IP e user-agent',
        '• Pagina AuditLogs (somente admin)',
      ], C.tealLight, C.teal, C.text, [94, 234, 212]);

      spacer(2);
      cardTitle('Lacunas e Plano de Acao');
      colorBox('Alta Prioridade (30 dias)', [
        '• MFA via SSO: Integrar Azure AD/Okta com MFA obrigatorio',
        '• WAF Externo: Cloudflare/AWS WAF com regras OWASP Top 10',
        '[OK] Backup Testado: IMPLEMENTADO — backup semanal automatico',
        '[OK] Rate Limiting Ampliado: IMPLEMENTADO — CAPTCHA + bloqueio',
      ], C.redLight, C.red, C.text, [252, 165, 165]);

      colorBox('Media Prioridade (60 dias)', [
        '• Integracao SIEM Eletrobras: webhook para logs de seguranca',
        '• SAST/DAST: pipeline CI/CD com Snyk/SonarQube',
        '[OK] Timeout Sessao: IMPLEMENTADO — 15 minutos de inatividade',
        '[OK] Headers HTTP Seguros: IMPLEMENTADO — CSP, HSTS, X-Frame-Options',
      ], C.amberLight, C.amber, C.text, [253, 230, 138]);

      // ── 6. ANALYTICS ───────────────────────────────────────────────
      newPage(); sectionPgs[6] = pg;
      sectionTitle('6. Analytics e Dashboard');

      cardTitle('Visao Geral — 7 Abas do Dashboard');
      chk(14);
      const tabW = (CW - 6) / 4;
      const tabDefs = [
        { label: 'Geral', desc: 'KPIs globais e graficos', bg: C.blueLight, tc: C.blue },
        { label: 'Mapas', desc: 'Heatmap geografico', bg: C.purpleLight, tc: C.purple },
        { label: 'Torre de Controle', desc: 'Alertas criticos', bg: C.redLight, tc: C.red },
        { label: 'Recebimento', desc: 'Metricas de NF', bg: C.greenLight, tc: C.green },
      ];
      tabDefs.forEach(({ label, desc, bg, tc }, i) => {
        const cx = M + i * (tabW + 2);
        fill(bg); draw(bg); doc.rect(cx, y, tabW, 13, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(tc[0], tc[1], tc[2]);
        doc.text(label, cx + 3, y + 5.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); rgb(C.text);
        const dl = doc.splitTextToSize(desc, tabW - 6);
        dl.slice(0,2).forEach((l, li) => doc.text(l, cx + 3, y + 9.5 + li * 3.5));
      });
      y += 16;
      const tabDefs2 = [
        { label: 'Expedicao', desc: 'OTIF e volumetria', bg: C.tealLight, tc: C.teal },
        { label: 'Produtividade', desc: 'Ranking lideres', bg: C.amberLight, tc: C.amber },
        { label: 'Projetos', desc: 'Status e progresso', bg: C.blueLight, tc: C.blue },
        { label: '—', desc: 'Mais abas futuras', bg: C.slate100, tc: C.slate600 },
      ];
      tabDefs2.forEach(({ label, desc, bg, tc }, i) => {
        const cx = M + i * (tabW + 2);
        fill(bg); draw(bg); doc.rect(cx, y, tabW, 13, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(tc[0], tc[1], tc[2]);
        doc.text(label, cx + 3, y + 5.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); rgb(C.text);
        const dl = doc.splitTextToSize(desc, tabW - 6);
        dl.slice(0,2).forEach((l, li) => doc.text(l, cx + 3, y + 9.5 + li * 3.5));
      });
      y += 17;

      spacer(2);
      cardTitle('Sistema de Filtros Globais');
      colorBox('Filtros aplicados a todas as abas (exceto Recebimento e Expedicao, que fixam categoria)', [
        'Regional           — filtra Almoxarifados disponíveis em cascata (OrdemServico.regional_id)',
        'Almoxarifado       — cascata dependente da Regional selecionada (OrdemServico.almoxarifado_id)',
        'Categoria          — desabilitado nas abas Recebimento/Expedicao (OrdemServico.categoria_id)',
        'Subcategoria       — filtra subcategorias da categoria ativa (OrdemServico.subcategorias_ids)',
        'Lider              — filtra por lider responsavel da OS (OrdemServico.lider_id)',
        'Status             — elaboracao | execucao | concluido | cancelado (OrdemServico.status)',
        'Periodo            — 7d / 30d / 90d / mes atual / customizado / todo periodo',
        'Preferencias       — persistidas por usuario via base44.auth.updateMe({ filtros_preferidos })',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      formulaBox([
        'LOGICA DO FILTRO DE PERIODO:',
        'hoje = new Date(); setHours(0,0,0,0)',
        '7d  = hoje - 7 dias   | 30d = hoje - 30 dias | 90d = hoje - 90 dias',
        'mes_atual = inicio do mes corrente ate hoje',
        'filtro aplicado em: OrdemServico.created_date (data de criacao da OS)',
      ]);

      spacer(2);
      cardTitle('Aba Geral — KPIs Primarios (Cards coloridos)');
      colorBox('KPIs Primarios — Calculados sobre filteredOrdens', [
        'Total de OS          Contagem   filteredOrdens.length — todas OS que passam pelos filtros',
        'Em Execucao          Contagem   filteredOrdens.filter(o => o.status === "execucao")',
        'Concluidas           Contagem   filteredOrdens.filter(o => o.status === "concluido")',
        'Progresso Medio      Media %    media aritmetica do campo progresso (0–100) de todas as OS filtradas',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      formulaBox([
        'FORMULA — PROGRESSO MEDIO:',
        'avgProgress = SUM(os.progresso) / totalOS',
        'Delta % = ((hoje - ontem) / ontem) x 100',
        'Compara com as OS criadas ate ontem (created_date < inicio do dia de ontem)',
      ]);

      spacer(2);
      cardTitle('Aba Geral — KPIs Secundarios');
      colorBox('KPIs Secundarios', [
        'Taxa de Cumprimento (On-Time Rate)   Percentual   OrdemServico.prazo / data_conclusao',
        'Tempo Medio de Resolucao             Dias         OrdemServico.data_inicial / data_conclusao',
        'Em Elaboracao                        Contagem     OS onde status === "elaboracao" (aguardando inicio)',
        'Atrasadas                            Contagem     OS com prazo < hoje e status != concluido/cancelado',
      ], C.purpleLight, C.purple, C.text, [216, 180, 254]);

      formulaBox([
        'FORMULA — TAXA DE CUMPRIMENTO (ON-TIME RATE):',
        'osComPrazo   = filteredOrdens com prazo definido',
        'onTimeCount  = osComPrazo onde:',
        '               (status == "concluido" && data_conclusao <= prazo)',
        '               OU (status != "concluido" && prazo >= hoje)',
        'onTimeRate   = (onTimeCount / osComPrazo.length) x 100',
        '               OS concluidas a tempo + OS em aberto com prazo ainda valido',
      ]);

      formulaBox([
        'FORMULA — TEMPO MEDIO DE RESOLUCAO:',
        'osConcluidas = filteredOrdens onde status == "concluido" && data_conclusao existe',
        'avgDays = SUM(|differenceInDays(data_conclusao, data_inicial || created_date)|) / osConcluidas.length',
        '          Usa data_inicial se disponivel, senao usa created_date como ponto de partida',
      ]);

      spacer(2);
      cardTitle('Aba Geral — Graficos e Visualizacoes');
      colorBox('Graficos Disponiveis na Aba Geral', [
        'OS por Status       — Grafico de barras empilhadas (elaboracao | execucao | concluido | cancelado)',
        'OS por Regional     — Barras horizontais, ordena por volume decrescente',
        'OS por Categoria    — Barras + pizza donut com distribuicao percentual',
        'Evolucao Temporal   — Linha mensal: criadas vs concluidas vs atrasadas',
        'Por Atendente       — Barras empilhadas com avatares no eixo X (top 10 lideres)',
        'Distribuicao Status — Pie chart com percentuais de cada status',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      newPage();
      cardTitle('Aba Mapas — Heatmap Geografico');
      colorBox('Visualizacao Geografica (React Leaflet)', [
        'Heatmap de Expedicoes — circulos por instalacao, raio/opacidade proporcional ao volume',
        'Marcadores Instalacoes — icone vermelho: subestacoes, usinas; icone azul: almoxarifados',
        'Modo Quantidade        — raio do circulo proporcional ao numero de OS da instalacao',
        'Modo Volume (m3)       — raio proporcional ao m3 total expedido',
        'Modo Valor (R$)        — raio proporcional ao valor total dos materiais expedidos',
        'Tooltip ao hover       — exibe nome, quantidade, volume e valor do ponto',
        'Popups ao click        — detalha as OS vinculadas aquela instalacao',
      ], C.purpleLight, C.purple, C.text, [216, 180, 254]);

      spacer(2);
      cardTitle('Torre de Controle — Alertas em Tempo Real');
      colorBox('Thresholds e Regras de Alerta', [
        'OS em Risco          — prazo < hoje + 3 dias e status != concluido/cancelado',
        'OS Atrasadas         — prazo < hoje e status != concluido e status != cancelado',
        'Sem Movimento (7d)   — updated_date < hoje - 7 dias e status != concluido/cancelado',
        'Lideres Sobrecarregados — mais de 5 OS com status execucao atribuidas ao mesmo lider',
        'Expedicoes Pendentes — status_separacao != "entregue" e data_necessidade < hoje',
        'Problemas Abertos    — ProblemaRecebimento sem data_solucao preenchida',
      ], C.redLight, C.red, C.text, [252, 165, 165]);

      formulaBox([
        'CALCULO TORRE — NIVEL DE RISCO:',
        'critico = OS atrasadas > 0 ou problemas_abertos > 2',
        'alerta  = OS em risco > 3 ou lideres_sobrecarregados > 0',
        'ok      = sem nenhuma das condicoes acima',
      ]);

      spacer(2);
      cardTitle('Painel Expedicao — OTIF e Volumetria');
      colorBox('KPIs do Painel Expedicao', [
        'OTIF (On-Time In-Full) — entregas onde status=entregue e data_entrega <= prazo original',
        'Lead Time Expedicao    — media de (data_entrega - data_separacao) em dias',
        'Volume Total (m3)      — soma de volumes.m3 de todas expedicoes no periodo',
        'Peso Total (kg)        — soma de volumes.peso_bruto de todas expedicoes',
        'Valor Total (R$)       — soma de detalhamento_expedicao.valor_total',
        'Por Transportadora     — ranking de OTIF, lead time e volume por transportadora',
        'Por Modal              — distribuicao: Terrestre | Aereo | Maritimo | Misto',
      ], C.tealLight, C.teal, C.text, [94, 234, 212]);

      formulaBox([
        'FORMULA — OTIF:',
        'expedicoesConcluidas  = OS com status_separacao == "entregue"',
        'entregasNoTemp        = expedicoesConcluidas onde data_entrega <= data_necessidade',
        'OTIF (%)              = (entregasNoPrazo / expedicoesConcluidas.length) x 100',
        'OTIF alvo: >= 95% (verde) | 80-94% (amarelo) | < 80% (vermelho)',
      ]);

      spacer(2);
      cardTitle('Painel Recebimento — Conformidade e Lead Time');
      colorBox('KPIs do Painel Recebimento', [
        'TCR (Taxa Conformidade Recebimento) — itens conferidos sem divergencia / total conferidos',
        'TAC (Taxa de Acuracia)              — itens onde qtd_recebida == qtd_esperada / total',
        'LTR (Lead Time Recebimento)         — media de (data_recebimento - nfe_data_emissao) em dias',
        'Backlog Recebimento                 — OS em recebimento sem conclusao de conferencia',
        'Problemas por Categoria             — distribuicao de tipos de problemas identificados',
        'Divergencias por NF                 — ranking de notas com mais discrepancias',
        'Taxa Armazenagem                    — itens com endereco_armazenagem preenchido / total',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      formulaBox([
        'FORMULA — TCR (Taxa de Conformidade):',
        'itensConferidos = nfe_itens_conferencia de todas OS de recebimento no periodo',
        'itensSemDiverg  = itensConferidos onde status_conferencia == "completo"',
        'TCR (%)         = (itensSemDiverg / itensConferidos.length) x 100',
        '',
        'FORMULA — LTR:',
        'avgLTR = SUM(differenceInDays(data_recebimento, nfe_data_emissao)) / totalOS',
      ]);

      spacer(2);
      cardTitle('Aba Produtividade — Rankings');
      colorBox('Metricas de Produtividade por Pessoa', [
        'OS Concluidas     — contagem de OS onde lider_id == pessoa.id e status == concluido',
        'On-Time Rate      — taxa de cumprimento individual (mesma formula do KPI global)',
        'Tempo Medio       — tempo medio de resolucao individual',
        'OS Em Aberto      — OS atribuidas ainda nao concluidas (executores_ids inclui pessoa.id)',
        'Score Produtividade — formula composta: conclusoes x 0.5 + on_time_rate x 0.3 + 1/tempo_medio x 0.2',
        'Ranking Lideres   — top 10 lideres ordenados por score',
        'Ranking Executores — top 10 executores por volume de OS concluidas',
        'Por Almoxarifado  — comparativo de performance entre almoxarifados no periodo',
      ], C.amberLight, C.amber, C.text, [253, 230, 138]);

      spacer(2);
      cardTitle('Aba Projetos — Gestao e Progresso');
      colorBox('Metricas de Projetos', [
        'Status dos Projetos  — ativo | parado | concluido | cancelado',
        'Progresso Medio      — media do progresso de todas OS vinculadas ao projeto',
        'OS Vinculadas        — contagem de OS em projetos_ids do projeto',
        'Taxa de Conclusao    — OS concluidas / OS totais vinculadas ao projeto',
        'Prazo vs Execucao    — comparativo entre data_final_prevista e data_final_execucao',
        'Gauge de Progresso   — componente visual ProjetoGauge (0–100%)',
        'Gantt simplificado   — timeline de projetos com datas previstas vs reais',
        'Lider do Projeto     — Pessoa com funcao "lider" vinculada ao projeto',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      spacer(2);
      cardTitle('Cores e Thresholds do Dashboard');
      colorBox('Paleta de Status — Padrao Visual Aplicado em Todo o Dashboard', [
        'Verde   (#16a34a) — concluido | OTIF >= 95% | TCR >= 95% | on_time >= 90%',
        'Amarelo (#d97706) — em execucao | OTIF 80-94% | TCR 80-94% | prazo em risco',
        'Vermelho(#dc2626) — atrasado | cancelado | OTIF < 80% | critico',
        'Azul    (#2563eb) — elaboracao | neutro | informativo',
        'Roxo    (#7c3aed) — projetos | subcategorias | metricas secundarias',
        'Cinza   (#64748b) — dados historicos | desabilitado | sem dados',
      ], C.slate100, C.slate800, C.text, C.slate200);

      // ── 7. PRIVACIDADE ─────────────────────────────────────────────
      newPage(); sectionPgs[7] = pg;
      sectionTitle('7. Privacidade — Privacy by Design');

      cardTitle('7 Principios Aplicados (ISO 29101)');
      const privPrincipios = [
        ['1. Proativo, nao Reativo', 'Prevencao de violacoes antes que ocorram. Analise de impacto (RIPD) obrigatoria para novos recursos.'],
        ['2. Privacidade como Padrao', 'Dados coletados sao minimos e necessarios. Sem opt-in necessario — privacidade e o default.'],
        ['3. Privacidade Incorporada', 'LGPD considerada desde o design. Consentimentos, anonimizacao e direitos integrados.'],
        ['4. Funcionalidade Total', 'Seguranca e funcionalidade coexistem sem comprometimento de nenhuma das duas.'],
        ['5. Seguranca Ponta a Ponta', 'Criptografia em repouso e em transito. Soft-delete com recuperacao.'],
        ['6. Visibilidade e Transparencia', 'Audit logs acessiveis. Portal do Titular para exercicio de direitos.'],
        ['7. Respeito ao Usuario', 'Consentimento granular por finalidade. Direito ao esquecimento implementado.'],
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
      cardTitle('Implementacoes LGPD');
      colorBox('Portal do Titular — Direitos dos Titulares', [
        '[OK] Acesso: Geracao automatica do relatorio de dados do usuario',
        '[OK] Retificacao: Edicao de dados via perfil',
        '[OK] Exclusao: Anonimizacao via backend function (masking/hashing)',
        '[OK] Portabilidade: Exportacao de dados em JSON',
        '[OK] Revogacao: Consentimentos podem ser revogados com registro',
        '[OK] Prazo de resposta: 15 dias configurado no workflow',
      ], C.blueLight, C.blue, C.text, C.blueMid);

      colorBox('RIPD — Relatorio de Impacto a Protecao de Dados', [
        '[OK] Wizard completo de 10 secoes para novos recursos',
        '[OK] Geracao de PDF profissional com assinatura',
        '[OK] Versionamento de RIPDs',
        '[OK] Bases legais mapeadas por finalidade de tratamento',
        '[OK] Medidas de mitigacao documentadas',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      colorBox('Consentimentos e Registros', [
        '[OK] Modal de consentimento no primeiro acesso aprovado',
        '[OK] Consentimentos granulares: uso_basico, analytics, notificacoes, etc.',
        '[OK] Registro com IP, user-agent, data e hora',
        '[OK] Revogacao individual por finalidade',
        '[OK] Pagina "Meus Consentimentos" para usuario',
      ], C.purpleLight, C.purple, C.text, [216, 180, 254]);

      // ── 8. DISASTER RECOVERY ───────────────────────────────────────
      newPage(); sectionPgs[8] = pg;
      sectionTitle('8. Disaster Recovery e BCP');

      cardTitle('RTO e RPO por Processo Critico');
      chk(50);
      const drRows = [
        ['Processo', 'RTO', 'RPO', 'Prioridade'],
        ['Gestao de OS', '4 horas', '1 hora', 'Critico'],
        ['Expedicao em andamento', '4 horas', '1 hora', 'Critico'],
        ['Recebimento NFe', '8 horas', '4 horas', 'Alto'],
        ['Dashboard / Analytics', '8 horas', '4 horas', 'Alto'],
        ['Cadastros (Pessoas, etc.)', '24 horas', '4 horas', 'Medio'],
        ['Audit Logs', '48 horas', '24 horas', 'Medio'],
        ['Mensagens / Chat', '24 horas', '8 horas', 'Medio'],
      ];
      const tableX = [M, M + 75, M + 102, M + 129];
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
        row.forEach((cell, i) => {
          const color = cell === 'Critico' ? C.red : cell === 'Alto' ? C.amber : C.text;
          rgb(color);
          doc.text(cell, tableX[i] + 2, y + 4.5);
        });
        y += 6.5;
      });
      y += 4;

      cardTitle('BIA — Business Impact Analysis');
      colorBox('Analise de Impacto Implementada [OK]', [
        '• 12 processos criticos identificados e documentados',
        '• Impactos financeiros, operacionais e reputacionais mapeados',
        '• Dependencias entre sistemas identificadas',
        '• Responsaveis por processo documentados',
        '• Criticalidade classificada em: Critico | Alto | Medio | Baixo',
      ], C.greenLight, C.green, C.text, [134, 239, 172]);

      spacer(2);
      cardTitle('Runbooks de Recuperacao');
      borderBlock('Cenario 1 — Perda Total de Dados', [
        '1. Acionar equipe de resposta a incidentes',
        '2. Acessar backup mais recente (Private Storage)',
        '3. Criar novo app Base44 ou usar restore point',
        '4. Importar entidades via bulk create',
        '5. Validar integridade de dados criticos (OS, Pessoas)',
        '6. Comunicar stakeholders e registrar incident report',
      ], C.red);

      borderBlock('Cenario 2 — Corrupcao de Entidade', [
        '1. Identificar entidade afetada via AuditLog',
        '2. Extrair backup semanal (exportBackupCritico)',
        '3. Isolar registros corrompidos',
        '4. Restaurar via script de importacao JSON',
        '5. Validar dados restaurados com amostragem',
        '6. Registrar post-mortem e atualizar runbook',
      ], C.amber);

      borderBlock('Cenario 3 — Indisponibilidade da Plataforma', [
        '1. Verificar status em status.base44.com',
        '2. Comunicar usuarios via canal alternativo (email/WhatsApp)',
        '3. Ativar modo offline se disponivel',
        '4. Documentar impacto para SLA claim',
        '5. Retomar operacoes normais apos restabelecimento',
      ], [59, 130, 246]);

      spacer(2);
      cardTitle('Testes e Validacao do Plano DR');
      colorBox('Agenda de Testes Trimestrais [OK]', [
        '• Simulacao trimestral completa agendada',
        '• MTTR (Mean Time To Recovery) medido vs. objetivo',
        '• Teste de restore de backup: exportBackupCritico validado mensalmente',
        '• Exercicio de comunicacao de crise com stakeholders',
        '• Atualizacao do runbook apos cada simulacao',
        '• Resultados documentados e historico mantido',
      ], C.tealLight, C.teal, C.text, [94, 234, 212]);

      // ── FINAL FOOTER e voltar para TOC ─────────────────────────────
      footer();

      // Agora volta para a pagina do indice e preenche com paginas reais
      doc.setPage(tocPage);
      y = tocStartY;
      const tocItems = [
        { label: '1. Arquitetura do Sistema', sec: 1 },
        { label: '2. Funcionalidades e Recursos', sec: 2 },
        { label: '3. Guia de Implementacao', sec: 3 },
        { label: '4. Operacoes e Infraestrutura', sec: 4 },
        { label: '5. Seguranca da Informacao', sec: 5 },
        { label: '6. Analytics e Dashboard', sec: 6 },
        { label: '7. Privacidade (Privacy by Design)', sec: 7 },
        { label: '8. Disaster Recovery e BCP', sec: 8 },
      ];
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); rgb(C.text);
      tocItems.forEach(t => {
        const pgNum = sectionPgs[t.sec] ? `p. ${sectionPgs[t.sec]}` : '';
        // draw dots leader
        doc.setFont('helvetica', 'normal'); rgb(C.text);
        doc.text('• ' + t.label, M + 3, y);
        // page number right-aligned
        doc.setFont('helvetica', 'bold'); rgb(C.blue);
        doc.text(pgNum, PW - M - 2, y, { align: 'right' });
        // dotted line between label and page number
        doc.setFont('helvetica', 'normal'); rgb(C.slate200);
        const labelW = doc.getStringUnitWidth('• ' + t.label) * 10 / doc.internal.scaleFactor + M + 3;
        const pgNumW = doc.getStringUnitWidth(pgNum) * 10 / doc.internal.scaleFactor + 4;
        doc.setLineWidth(0.2); draw(C.slate200);
        doc.setLineDashPattern([0.5, 1.5], 0);
        doc.line(labelW + 2, y - 1, PW - M - pgNumW - 2, y - 1);
        doc.setLineDashPattern([], 0);
        y += 8;
      });

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
      className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 mr-2" />
          Exportar Documentacao Completa (PDF)
        </>
      )}
    </Button>
  );
}