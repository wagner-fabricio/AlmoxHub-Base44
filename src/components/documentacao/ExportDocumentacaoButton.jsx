import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ExportDocumentacaoButton() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      let yPos = margin;
      let pageNumber = 1;

      // ===== FUNÇÕES AUXILIARES =====

      const addNewPage = () => {
        doc.addPage();
        pageNumber++;
        yPos = margin + 15;
      };

      const addHeader = () => {
        doc.setFillColor(0, 0, 255);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('AlmoxHub — Documentação Técnica', margin, 8.5);
      };

      const addFooter = () => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setTextColor(140, 140, 140);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
      };

      const addTitle = (text, level = 1) => {
        const sizes = { 1: 20, 2: 14, 3: 12 };
        const spacing = { 1: 10, 2: 8, 3: 6 };

        if (yPos + 8 > pageHeight - 15) addNewPage();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(sizes[level]);
        doc.setTextColor(0, 0, 255);
        doc.text(text, margin, yPos);
        yPos += spacing[level];
      };

      const addParagraph = (text, bold = false) => {
        if (yPos + 6 > pageHeight - 15) addNewPage();

        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);

        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line) => {
          if (yPos + 6 > pageHeight - 15) addNewPage();
          doc.text(line, margin, yPos);
          yPos += 6;
        });
        yPos += 2;
      };

      const addBullet = (text) => {
        if (yPos + 5 > pageHeight - 15) addNewPage();

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);

        const lines = doc.splitTextToSize(text, contentWidth - 8);
        lines.forEach((line, idx) => {
          if (yPos + 5 > pageHeight - 15) addNewPage();
          if (idx === 0) {
            doc.text('•', margin + 1, yPos);
          }
          doc.text(line, margin + 6, yPos);
          yPos += 5;
        });
        yPos += 1;
      };

      const addSectionBox = (title, items) => {
        if (yPos + 12 > pageHeight - 30) addNewPage();

        const boxStartY = yPos;
        let boxHeight = 9;

        items.forEach((item) => {
          const lines = doc.splitTextToSize(item, contentWidth - 12);
          boxHeight += lines.length * 5 + 1;
        });

        // Draw box
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(margin, boxStartY, contentWidth, boxHeight, 'FD');

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 255);
        doc.text(title, margin + 4, yPos + 6);
        yPos += 9;

        // Items
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);

        items.forEach((item) => {
          const lines = doc.splitTextToSize(item, contentWidth - 12);
          lines.forEach((line) => {
            doc.text('• ' + line, margin + 6, yPos);
            yPos += 5;
          });
          yPos += 1;
        });

        yPos = boxStartY + boxHeight + 4;
      };

      const addScreenshot = (label) => {
        if (yPos + 48 > pageHeight - 15) addNewPage();

        // Draw screenshot placeholder box
        doc.setFillColor(235, 235, 235);
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.8);
        doc.rect(margin, yPos, contentWidth, 45, 'FD');

        // Text
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text(`[Screenshot: ${label}]`, pageWidth / 2, yPos + 22, { align: 'center' });

        yPos += 50;
      };

      // ===== CAPA =====
      doc.setFillColor(0, 0, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);
      doc.text('AlmoxHub', pageWidth / 2, 80, { align: 'center' });

      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      doc.text('Documentação Técnica Completa', pageWidth / 2, 110, { align: 'center' });

      doc.setFontSize(11);
      doc.setTextColor(200, 220, 255);
      doc.text('Arquitetura • Funcionalidades • Segurança • Operações', pageWidth / 2, 130, {
        align: 'center',
      });

      yPos = pageHeight - 50;
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text(`Versão 1.0.0 • Março 2026`, pageWidth / 2, yPos, { align: 'center' });
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos + 10, {
        align: 'center',
      });

      // ===== ÍNDICE =====
      addNewPage();
      addHeader();
      yPos = margin + 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 255);
      doc.text('Índice', margin, yPos);
      yPos += 12;

      const sections = [
        '1. Arquitetura do Sistema',
        '2. Funcionalidades Principais',
        '3. Recursos e Capacidades',
        '4. Roadmap de Implementação',
      ];

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      sections.forEach((section) => {
        if (yPos + 7 > pageHeight - 20) addNewPage();
        doc.text(section, margin + 5, yPos);
        yPos += 7;
      });

      addFooter();

      // ===== 1. ARQUITETURA =====
      addNewPage();
      addHeader();

      addTitle('1. Arquitetura do Sistema', 1);
      addParagraph(
        'O AlmoxHub é construído sobre a plataforma Base44, utilizando React, TypeScript e Tailwind CSS no frontend, com backend serverless em Deno e banco de dados PostgreSQL gerenciado.'
      );

      addTitle('1.1 Stack Tecnológico', 2);
      addSectionBox('Frontend', [
        'React 18.2 com Hooks e Context API',
        'TypeScript para type safety completo',
        'Tailwind CSS + shadcn/ui para UI consistente',
        'React Router para navegação SPA',
      ]);

      addSectionBox('Backend & Infraestrutura', [
        'Deno Deploy para Functions serverless',
        'Base44 SDK para integração seamless',
        'PostgreSQL gerenciado com replicação',
        'CDN global para assets e cache',
      ]);

      addScreenshot('Stack tecnológico: React, Tailwind, Base44');

      addTitle('1.2 Dados e Entidades', 2);
      addParagraph('O sistema utiliza 30+ entidades principais organizadas em módulos funcionais:');
      addBullet('Gestão de OS: OrdemServico, Categoria, Subcategoria');
      addBullet('Logística: Regional, Almoxarifado, Instalacao, Transportadora, VeiculoAxia');
      addBullet('Pessoas: Pessoa, Equipe, User (built-in)');
      addBullet('Comunicação: Conversa, MensagemChat, Comentario, Notificacao');
      addBullet('Compliance: AuditLog, Consentimento, RIPD, LoginAttempt');

      addFooter();

      // ===== 2. FUNCIONALIDADES =====
      addNewPage();
      addHeader();

      addTitle('2. Funcionalidades Principais', 1);

      addTitle('2.1 Gestão de Ordens de Serviço', 2);
      addParagraph('Sistema completo de criação, acompanhamento e conclusão de ordens de serviço:');
      addBullet('Workflow em 4 estágios: Elaboração → Execução → Concluído/Cancelado');
      addBullet('Priorização flexível: baixa, média, alta, urgente');
      addBullet('Atribuição de líder responsável e múltiplos executores');
      addBullet('Controle de progresso em tempo real com percentual');
      addBullet('Gestão inteligente de prazos com alertas automáticos');
      addBullet('Suporte a anexos, galeria de imagens e documentos');
      addBullet('Histórico completo e auditado de todas as alterações');

      addScreenshot('Formulário de Ordem de Serviço com Abas');

      addTitle('2.2 Expedição e Recebimento', 2);
      addBullet('Módulo de Expedição: separação, embalagem, gestão de transporte');
      addBullet('Gestão de volumes com cálculo automático de dimensões/peso');
      addBullet('Módulo de Recebimento: importação XML NFe e conferência automática');
      addBullet('Geração de etiquetas logísticas com código de barras e QR code');
      addBullet('Rastreamento de status em tempo real: pendente → entregue');

      addScreenshot('Painel de Expedição com Acompanhamento');

      addTitle('2.3 Dashboard e Analytics', 2);
      addBullet('KPIs em tempo real: Total OS, Taxa de Conclusão, Tempo Médio');
      addBullet('Gráficos de evolução temporal: mensal, trimestral, anual');
      addBullet('Heatmap georreferenciado de expedições por região');
      addBullet('Ranking automático de produtividade por líder/executor');
      addBullet('Torre de Controle para monitoramento de risco e alertas');
      addBullet('Insights inteligentes com anomalias e recomendações');

      addScreenshot('Dashboard Executivo com Métricas e Gráficos');

      addFooter();

      // ===== 3. RECURSOS =====
      addNewPage();
      addHeader();

      addTitle('3. Recursos e Capacidades', 1);

      addSectionBox('Segurança Implementada', [
        'Autenticação multifator (MFA) com suporte SSO',
        'Rate limiting em endpoints críticos contra abuso',
        'Validação de entrada rigorosa em todos os formulários',
        'Sanitização de dados contra XSS e injeção SQL',
        'Headers de segurança modernos: CSP, HSTS, X-Frame-Options',
        'Timeout de sessão ajustado para 1 hora',
      ]);

      addSectionBox('LGPD e Privacidade', [
        'Portal do Titular com direitos: acesso, retificação, exclusão',
        'Consentimentos explícitos e granulares por finalidade',
        'Anonimização reversível de dados sob demanda',
        'Audit logs completos com rastreabilidade total',
        'Backup automático com retenção configurável',
        'Política de cookies e transparência de dados',
      ]);

      addSectionBox('Comunicação e Colaboração', [
        'Sistema de mensagens em tempo real com WebSockets',
        'Grupos de conversa para coordenação de equipes',
        'Notificações inteligentes com preferências customizáveis',
        'Comentários com menções (@mention) e tagging',
        'Push notifications para aplicativos mobile',
        'Histórico de comunicação auditado',
      ]);

      addFooter();

      // ===== 4. ROADMAP =====
      addNewPage();
      addHeader();

      addTitle('4. Roadmap de Implementação', 1);

      addTitle('Q1 2026 (Atual)', 2);
      addBullet('Dashboard Analytics com todas as métricas operacionais');
      addBullet('Sistema robusto de mensagens e notificações inteligentes');
      addBullet('Exportação completa de documentação técnica em PDF');
      addBullet('Correção de timezone em formulários de data/hora');
      addBullet('Ajuste de timeout de sessão para 1 hora');

      addTitle('Q2 2026 (Próximas Features)', 2);
      addBullet('Módulo de gestão de estoque em tempo real');
      addBullet('Relatórios customizáveis e agendáveis');
      addBullet('[EM PROGRESSO] Integração com SAP para sincronização');

      addTitle('Q3 2026 (Expansão)', 2);
      addBullet('Aplicativos mobile nativos iOS e Android');
      addBullet('API RESTful pública para integrações de terceiros');
      addBullet('Machine Learning para previsão de demanda');

      addScreenshot('Roadmap Visual com Milestones');

      addFooter();

      // Salvar PDF
      doc.save(
        `AlmoxHub_Documentacao_Tecnica_${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Por favor, tente novamente.');
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