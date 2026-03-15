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
      const margin = 12;
      const contentWidth = pageWidth - 2 * margin;

      let yPos = margin;
      let pageNumber = 1;

      // ===== FUNÇÕES AUXILIARES =====

      const addNewPage = () => {
        addFooter();
        doc.addPage();
        pageNumber++;
        yPos = margin + 12;
        addHeader();
      };

      const addHeader = () => {
        doc.setFillColor(0, 0, 255);
        doc.rect(0, 0, pageWidth, 11, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('AlmoxHub — Documentação Técnica', margin, 7.5);
      };

      const addFooter = () => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
        doc.setTextColor(140, 140, 140);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
      };

      const addMainTitle = (text) => {
        if (yPos + 12 > pageHeight - 15) addNewPage();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 255);
        doc.text(text, margin, yPos);
        yPos += 10;
      };

      const addSubtitle = (text) => {
        if (yPos + 8 > pageHeight - 15) addNewPage();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 255);
        doc.text(text, margin, yPos);
        yPos += 6.5;
      };

      const addParagraph = (text, fontSize = 10) => {
        if (yPos + 6 > pageHeight - 15) addNewPage();

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(50, 50, 50);

        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line) => {
          if (yPos + 5 > pageHeight - 15) addNewPage();
          doc.text(line, margin, yPos);
          yPos += 5;
        });
        yPos += 2;
      };

      const addBullet = (text, fontSize = 10) => {
        if (yPos + 5 > pageHeight - 15) addNewPage();

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(50, 50, 50);

        const lines = doc.splitTextToSize(text, contentWidth - 7);
        lines.forEach((line, idx) => {
          if (yPos + 5 > pageHeight - 15) addNewPage();
          if (idx === 0) {
            doc.text('•', margin + 1, yPos);
          }
          doc.text(line, margin + 5, yPos);
          yPos += 5;
        });
      };

      const addSectionBox = (title, items) => {
        if (yPos + 12 > pageHeight - 25) addNewPage();

        // Calcular altura da box
        let boxHeight = 8;
        items.forEach((item) => {
          const lines = doc.splitTextToSize(item, contentWidth - 10);
          boxHeight += lines.length * 4.5 + 1;
        });

        const boxStartY = yPos;

        // Draw box background
        doc.setFillColor(240, 240, 240);
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.6);
        doc.rect(margin, boxStartY, contentWidth, boxHeight, 'FD');

        // Title in blue
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 255);
        doc.text(title, margin + 4, yPos + 5.5);
        yPos += 8;

        // Items with bullets
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);

        items.forEach((item) => {
          const lines = doc.splitTextToSize(item, contentWidth - 10);
          lines.forEach((line) => {
            doc.text('• ' + line, margin + 5, yPos);
            yPos += 4.5;
          });
          yPos += 1;
        });

        yPos = boxStartY + boxHeight + 4;
      };

      const addScreenshotBox = (_label) => {
        // Screenshots removidos a pedido do usuário
      };

      // ===== CAPA =====
      doc.setFillColor(0, 0, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(44);
      doc.text('AlmoxHub', pageWidth / 2, 70, { align: 'center' });

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Documentação Técnica Completa', pageWidth / 2, 105, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(200, 220, 255);
      doc.text('Arquitetura • Funcionalidades • Segurança • Operações', pageWidth / 2, 125, {
        align: 'center',
      });

      yPos = pageHeight - 45;
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text(`Versão 1.0.0 • Março 2026`, pageWidth / 2, yPos, { align: 'center' });
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos + 8, {
        align: 'center',
      });

      // ===== ÍNDICE =====
      addNewPage();

      addMainTitle('Índice');
      yPos += 2;

      const sections = [
        '1. Arquitetura do Sistema',
        '2. Funcionalidades Principais',
        '3. Recursos e Capacidades',
        '4. Roadmap de Implementação',
      ];

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      sections.forEach((section) => {
        if (yPos + 6 > pageHeight - 15) addNewPage();
        doc.text('• ' + section, margin + 3, yPos);
        yPos += 6;
      });

      // ===== 1. ARQUITETURA =====
      addNewPage();
      addMainTitle('1. Arquitetura do Sistema');

      addParagraph(
        'O AlmoxHub é construído sobre a plataforma Base44, utilizando React, TypeScript e Tailwind CSS no frontend, com backend serverless em Deno e banco de dados PostgreSQL gerenciado.'
      );

      addSubtitle('1.1 Stack Tecnológico');

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

      addScreenshotBox('Stack tecnológico: React, Tailwind, Base44');

      addSubtitle('1.2 Dados e Entidades');

      addParagraph('O sistema utiliza 30+ entidades principais organizadas em módulos funcionais:');

      addBullet('Gestão de OS: OrdemServico, Categoria, Subcategoria');
      addBullet('Logística: Regional, Almoxarifado, Instalacao, Transportadora, VeiculoAxia');
      addBullet('Pessoas: Pessoa, Equipe, User (built-in)');
      addBullet('Comunicação: Conversa, MensagemChat, Comentario, Notificacao');
      addBullet('Compliance: AuditLog, Consentimento, RIPD, LoginAttempt');

      yPos += 2;

      // ===== 2. FUNCIONALIDADES =====
      addNewPage();
      addMainTitle('2. Funcionalidades Principais');

      addSubtitle('2.1 Gestão de Ordens de Serviço');

      addParagraph('Sistema completo de criação, acompanhamento e conclusão de ordens de serviço:');

      addBullet('Workflow em 4 estágios: Elaboração → Execução → Concluído/Cancelado');
      addBullet('Priorização flexível: baixa, média, alta, urgente');
      addBullet('Atribuição de líder responsável e múltiplos executores');
      addBullet('Controle de progresso em tempo real com percentual');
      addBullet('Gestão inteligente de prazos com alertas automáticos');
      addBullet('Suporte a anexos, galeria de imagens e documentos');
      addBullet('Histórico completo e auditado de todas as alterações');

      yPos += 1;
      addScreenshotBox('Formulário de Ordem de Serviço com Abas');

      addSubtitle('2.2 Expedição e Recebimento');

      addBullet('Módulo de Expedição: separação, embalagem, gestão de transporte');
      addBullet('Gestão de volumes com cálculo automático de dimensões/peso');
      addBullet('Módulo de Recebimento: importação XML NFe e conferência automática');
      addBullet('Geração de etiquetas logísticas com código de barras e QR code');
      addBullet('Rastreamento de status em tempo real: pendente → entregue');

      yPos += 1;
      addScreenshotBox('Painel de Expedição com Acompanhamento');

      addSubtitle('2.3 Dashboard e Analytics');

      addBullet('KPIs em tempo real: Total OS, Taxa de Conclusão, Tempo Médio');
      addBullet('Gráficos de evolução temporal: mensal, trimestral, anual');
      addBullet('Heatmap georreferenciado de expedições por região');
      addBullet('Ranking automático de produtividade por líder/executor');
      addBullet('Torre de Controle para monitoramento de risco e alertas');
      addBullet('Insights inteligentes com anomalias e recomendações');

      yPos += 1;
      addScreenshotBox('Dashboard Executivo com Métricas e Gráficos');

      // ===== 3. RECURSOS =====
      addNewPage();
      addMainTitle('3. Recursos e Capacidades');

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

      // ===== 4. ROADMAP =====
      addNewPage();
      addMainTitle('4. Roadmap de Implementação');

      addSubtitle('Q1 2026 (Atual)');
      addBullet('Dashboard Analytics com todas as métricas operacionais');
      addBullet('Sistema robusto de mensagens e notificações inteligentes');
      addBullet('Exportação completa de documentação técnica em PDF');
      addBullet('Correção de timezone em formulários de data/hora');
      addBullet('Ajuste de timeout de sessão para 1 hora');

      addSubtitle('Q2 2026 (Próximas Features)');
      addBullet('Módulo de gestão de estoque em tempo real');
      addBullet('Relatórios customizáveis e agendáveis');
      addBullet('[EM PROGRESSO] Integração com SAP para sincronização');

      addSubtitle('Q3 2026 (Expansão)');
      addBullet('Aplicativos mobile nativos iOS e Android');
      addBullet('API RESTful pública para integrações de terceiros');
      addBullet('Machine Learning para previsão de demanda');

      yPos += 3;
      addScreenshotBox('Roadmap Visual com Milestones e Timeline');

      // Última página - rodapé
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