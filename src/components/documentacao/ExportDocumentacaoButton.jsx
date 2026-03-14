import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ExportDocumentacaoButton() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;
      let pageNumber = 1;

      // Função para adicionar cabeçalho
      const addHeader = () => {
        // Fundo degradê visual com azul
        doc.setFillColor(0, 0, 255);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setDrawColor(10, 100, 200);
        doc.setLineWidth(1.5);
        doc.line(0, 12, pageWidth, 12);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('AlmoxHub — Documentação Técnica', margin, 8.5);
      };

      // Função para adicionar rodapé
      const addFooter = () => {
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 10);
      };

      // Função para nova página
      const addNewPage = () => {
        doc.addPage();
        pageNumber++;
        addHeader();
        addFooter();
        yPos = margin + 20;
      };

      // Função para verificar espaço e adicionar texto
      const addText = (text, fontSize, isBold = false, color = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(color[0], color[1], color[2]);

        const lines = doc.splitTextToSize(text, contentWidth);
        const lineHeight = fontSize * 0.5;
        const totalHeight = lines.length * lineHeight;

        if (yPos + totalHeight > pageHeight - 30) {
          addNewPage();
        }

        lines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });

        yPos += 2;
      };
      
      // Função para adicionar seção com screenshot placeholder
      const addScreenshotPlaceholder = (label) => {
        if (yPos + 50 > pageHeight - 40) {
          addNewPage();
        }
        // Box com borda
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos, contentWidth, 45);
        // Preenchimento cinza claro
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos, contentWidth, 45, 'F');
        // Texto
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`[Screenshot: ${label}]`, pageWidth / 2, yPos + 22, { align: 'center' });
        yPos += 48;
      };

      // CAPA com design elegante e clean
      // Fundo gradiente (simulado com retângulos)
      doc.setFillColor(0, 0, 255);
      doc.rect(0, 0, pageWidth, pageHeight / 2, 'F');
      doc.setFillColor(10, 60, 180);
      doc.rect(0, pageHeight / 2, pageWidth, pageHeight / 2, 'F');
      
      // Círculo decorativo
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0);
      
      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(48);
      doc.setFont('helvetica', 'bold');
      doc.text('AlmoxHub', pageWidth / 2, 70, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(20);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(230, 240, 255);
      doc.text('Documentação Técnica Completa', pageWidth / 2, 110, { align: 'center' });
      
      // Descrição
      doc.setFontSize(11);
      doc.setTextColor(200, 220, 255);
      doc.text('Arquitetura • Implementação • Segurança • Operações', pageWidth / 2, 130, { align: 'center' });
      
      // Versão e data
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text(`Versão 1.0.0 • Março 2026`, pageWidth / 2, pageHeight - 40, { align: 'center' });
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

      // ÍNDICE
      addNewPage();
      yPos = margin + 20;
      
      // Título com linha decorativa
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 255);
      doc.text('Índice', margin, yPos);
      doc.setDrawColor(0, 0, 255);
      doc.setLineWidth(1);
      doc.line(margin, yPos + 2, margin + 40, yPos + 2);
      yPos += 15;

      const sections = [
        { title: '1. Arquitetura do Sistema', page: 3 },
        { title: '2. Recursos e Funcionalidades', page: 5 },
        { title: '3. Status de Implementação', page: 7 },
        { title: '4. Guia de Implementação', page: 9 },
        { title: '5. Operações e Manutenção', page: 11 },
        { title: '6. Segurança da Informação', page: 13 },
        { title: '7. Roadmap de Desenvolvimento', page: 15 },
        { title: '8. Privacy by Design', page: 17 },
        { title: '9. Plano de Melhorias de Segurança', page: 19 },
        { title: '10. Disaster Recovery e BCP', page: 21 }
      ];

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      sections.forEach(section => {
        if (yPos > pageHeight - 40) addNewPage();
        doc.text(section.title, margin, yPos);
        doc.text(`${section.page}`, pageWidth - margin - 10, yPos, { align: 'right' });
        yPos += 8;
      });

      // CONTEÚDO DAS SEÇÕES
      
      // 1. ARQUITETURA
      addNewPage();
      addText('1. Arquitetura do Sistema', 20, true, [0, 0, 255]);
      yPos += 5;
      
      addText('1.1 Visão Geral', 16, true);
      addText('O AlmoxHub é construído sobre a plataforma Base44, utilizando uma arquitetura moderna e escalável baseada em React, com backend serverless e banco de dados PostgreSQL gerenciado.', 11);
      yPos += 3;

      addText('1.2 Stack Tecnológica', 16, true);
      addText('• Frontend: React 18.2 com TypeScript', 11);
      addText('• UI Framework: Tailwind CSS + shadcn/ui', 11);
      addText('• Backend: Deno Deploy (Serverless)', 11);
      addText('• Banco de Dados: PostgreSQL (Supabase)', 11);
      addText('• Autenticação: Base44 Auth (OAuth 2.0)', 11);
      addText('• Storage: Supabase Storage', 11);
      addText('• Real-time: WebSocket (subscriptions)', 11);
      yPos += 3;

      addText('1.3 Arquitetura de Dados', 16, true);
      addText('O sistema utiliza 30+ entidades principais organizadas em módulos funcionais:', 11);
      addText('• Gestão de OS: OrdemServico, Categoria, Subcategoria', 11);
      addText('• Logística: Regional, Almoxarifado, Instalacao, Transportadora, VeiculoAxia', 11);
      addText('• Pessoas: Pessoa, Equipe, User (built-in)', 11);
      addText('• Comunicação: Conversa, MensagemChat, Comentario, Notificacao', 11);
      addText('• Compliance: AuditLog, Consentimento, RIPD, LoginAttempt', 11);
      yPos += 3;

      addText('1.4 Segurança e Controle de Acesso', 16, true);
      addText('• Row Level Security (RLS) implementado em todas as entidades críticas', 11);
      addText('• Controle de acesso baseado em roles (admin, gestor, lider, almoxarife)', 11);
      addText('• Logs de auditoria para todas as operações sensíveis', 11);
      addText('• Criptografia em trânsito (TLS 1.3) e em repouso (AES-256)', 11);

      // 2. RECURSOS
      addNewPage();
      addText('2. Recursos e Funcionalidades', 20, true, [0, 0, 255]);
      yPos += 5;

      addText('2.1 Gestão de Ordens de Serviço', 16, true);
      addText('Sistema completo de criação, acompanhamento e conclusão de ordens de serviço com:', 11);
      addText('• Workflow em 4 estágios: Elaboração → Execução → Concluído/Cancelado', 11);
      addText('• Priorização (baixa, média, alta, urgente)', 11);
      addText('• Atribuição de líder e múltiplos executores', 11);
      addText('• Controle de progresso percentual', 11);
      addText('• Gestão de prazos com alertas automáticos', 11);
      addText('• Anexos e galeria de imagens', 11);
      addText('• Histórico completo de alterações', 11);
      yPos += 3;
      addScreenshotPlaceholder('Formulário de Ordem de Serviço');

      addText('2.2 Expedição e Recebimento', 16, true);
      addText('• Módulo de Expedição: separação, embalagem, definição de transporte', 11);
      addText('• Gestão de volumes e cálculo de dimensões/peso', 11);
      addText('• Módulo de Recebimento: importação XML NFe, conferência de itens', 11);
      addText('• Workflow automático de recebimento (4 etapas)', 11);
      addText('• Identificação e rastreamento de problemas no recebimento', 11);
      addText('• Geração automática de Ordem de Saída (OS)', 11);
      yPos += 3;

      addText('2.3 Dashboard e Analytics', 16, true);
      addText('Dashboard executivo com múltiplas visualizações:', 11);
      addText('• KPIs principais: Total OS, Taxa de Conclusão, Tempo Médio', 11);
      addText('• Gráficos de evolução temporal (mensal/anual)', 11);
      addText('• Heatmap georreferenciado de expedições', 11);
      addText('• Ranking de produtividade por líder', 11);
      addText('• Torre de Controle para monitoramento em tempo real', 11);
      addText('• Insights automáticos de performance e riscos', 11);
      addText('• Analytics com fórmulas detalhadas para cada métrica', 11);
      yPos += 3;
      addScreenshotPlaceholder('Dashboard com KPIs e gráficos');

      addText('2.4 Comunicação e Colaboração', 16, true);
      addText('• Chat em tempo real (conversas privadas e em grupo)', 11);
      addText('• Sistema de comentários vinculados a OS', 11);
      addText('• Menções de usuários (@)', 11);
      addText('• Notificações push e in-app', 11);
      addText('• Editor de texto rico com formatação', 11);

      // 3. STATUS
      addNewPage();
      addText('3. Status de Implementação', 20, true, [0, 0, 255]);
      yPos += 5;

      addText('3.1 Recursos Implementados (100%)', 16, true);
      addText('✓ Gestão completa de Ordens de Serviço', 11);
      addText('✓ Sistema de Expedição e Recebimento', 11);
      addText('✓ Dashboard Analytics', 11);
      addText('✓ Chat e Mensagens', 11);
      addText('✓ Sistema de Notificações', 11);
      addText('✓ Gestão de Pessoas, Regionais e Almoxarifados', 11);
      addText('✓ Gestão de Projetos', 11);
      addText('✓ Controle de Transportadoras e Veículos', 11);
      addText('✓ Auditoria e Logs', 11);
      addText('✓ LGPD Compliance (consentimentos, RIPD)', 11);
      yPos += 3;

      addText('3.2 Em Desenvolvimento', 16, true);
      addText('• Integração com SAP para sincronização de materiais', 11);
      addText('• Módulo de gestão de estoque em tempo real', 11);
      addText('• Relatórios customizáveis avançados', 11);
      yPos += 3;

      addText('3.3 Roadmap Futuro', 16, true);
      addText('• App mobile nativo (iOS/Android)', 11);
      addText('• Integração com sistemas de rastreamento de frota', 11);
      addText('• Machine Learning para previsão de demanda', 11);
      addText('• Business Intelligence integrado', 11);

      // 4. IMPLEMENTAÇÃO
      addNewPage();
      addText('4. Guia de Implementação', 20, true, [0, 0, 255]);
      yPos += 5;

      addText('4.1 Configuração Inicial', 16, true);
      addText('1. Cadastro de Regionais e hierarquia organizacional', 11);
      addText('2. Configuração de Almoxarifados e Instalações', 11);
      addText('3. Cadastro de Pessoas e atribuição de funções', 11);
      addText('4. Definição de Categorias e Subcategorias de OS', 11);
      addText('5. Configuração de alertas e notificações', 11);
      yPos += 3;

      addText('4.2 Onboarding de Usuários', 16, true);
      addText('• Fluxo de registro e aprovação de acesso', 11);
      addText('• Aceite de termos de uso (LGPD)', 11);
      addText('• Configuração de preferências de notificação', 11);
      addText('• Treinamento inicial via documentação interativa', 11);
      yPos += 3;

      addText('4.3 Boas Práticas', 16, true);
      addText('• Manter cadastros atualizados (pessoas, almoxarifados)', 11);
      addText('• Revisar e aprovar solicitações de acesso diariamente', 11);
      addText('• Configurar alertas personalizados por regional', 11);
      addText('• Exportar dados regularmente para backup externo', 11);
      addText('• Gerar documentação técnica em PDF para auditoria', 11);
      addText('• Timeout de sessão configurado em 1h para equilíbrio segurança/usabilidade', 11);

      // 5. OPERAÇÕES
      addNewPage();
      addText('5. Operações e Manutenção', 20, true, [0, 0, 255]);
      yPos += 5;

      addText('5.1 Monitoramento', 16, true);
      addText('• Logs de auditoria disponíveis em tempo real', 11);
      addText('• Métricas de performance acessíveis via dashboard', 11);
      addText('• Alertas automáticos para situações críticas', 11);
      yPos += 3;

      addText('5.2 Backup e Recuperação', 16, true);
      addText('• Backups automáticos diários (Supabase)', 11);
      addText('• Retenção de 30 dias de histórico', 11);
      addText('• Point-in-time recovery disponível', 11);
      addText('• Exportação manual de dados em PDF/Excel', 11);
      yPos += 3;

      addText('5.3 Suporte e Troubleshooting', 16, true);
      addText('• Documentação inline no sistema', 11);
      addText('• Exportação completa de documentação técnica em PDF', 11);
      addText('• Logs detalhados para debugging', 11);
      addText('• Sistema de notificação de erros', 11);

      // 6. SEGURANÇA
      addNewPage();
      addText('6. Segurança da Informação', 20, true, [0, 0, 255]);
      yPos += 5;

      addText('6.1 Controles de Acesso', 16, true);
      addText('• Autenticação via OAuth 2.0', 11);
      addText('• Row Level Security (RLS) em todas as tabelas', 11);
      addText('• Segregação de dados por regional/almoxarifado', 11);
      addText('• Controle granular de permissões por função', 11);
      yPos += 3;

      addText('6.2 Proteção de Dados', 16, true);
      addText('• Criptografia TLS 1.3 em trânsito', 11);
      addText('• Criptografia AES-256 em repouso', 11);
      addText('• Logs de auditoria imutáveis', 11);
      addText('• Anonimização de dados sob demanda (LGPD)', 11);
      yPos += 3;

      addText('6.3 Compliance LGPD', 16, true);
      addText('• Sistema de consentimentos granular', 11);
      addText('• RIPD (Relatório de Impacto) para novos recursos', 11);
      addText('• Portal do titular para exercício de direitos', 11);
      addText('• Gestão de solicitações (acesso, retificação, exclusão)', 11);

      // 7. ROADMAP
      addNewPage();
      addText('7. Roadmap de Desenvolvimento', 20, true, [0, 0, 255]);
      yPos += 5;

      addText('Q1 2026 (Atual)', 16, true);
      addText('✓ Dashboard Analytics completo', 11);
      addText('✓ Sistema de mensagens e notificações', 11);
      addText('✓ Exportação completa de documentação em PDF', 11);
      addText('✓ Correção de timezone em formulários de datas', 11);
      addText('✓ Ajuste de timeout de sessão para 1 hora', 11);
      addText('• [EM PROGRESSO] Integração SAP', 11);
      yPos += 3;

      addText('Q2 2026', 16, true);
      addText('• Módulo de gestão de estoque em tempo real', 11);
      addText('• Relatórios customizáveis', 11);
      addText('• App mobile (beta)', 11);
      yPos += 3;

      addText('Q3 2026', 16, true);
      addText('• Machine Learning - previsão de demanda', 11);
      addText('• Integração com sistemas de rastreamento', 11);
      addText('• Business Intelligence avançado', 11);
      yPos += 3;

      addText('Q4 2026', 16, true);
      addText('• Expansão regional', 11);
      addText('• Novos módulos especializados', 11);
      addText('• Certificações de segurança', 11);

      // 8. PRIVACY BY DESIGN
      addNewPage();
      addText('8. Privacy by Design', 20, true, [0, 0, 255]);
      yPos += 5;

      addText('8.1 Princípios Aplicados', 16, true);
      addText('• Proativo, não reativo - prevenção, não correção', 11);
      addText('• Privacidade como configuração padrão', 11);
      addText('• Privacidade incorporada no design', 11);
      addText('• Funcionalidade total - soma positiva, não zero', 11);
      addText('• Segurança de ponta a ponta', 11);
      addText('• Visibilidade e transparência', 11);
      addText('• Respeito pela privacidade do usuário', 11);
      yPos += 3;

      addText('8.2 Implementações Práticas', 16, true);
      addText('• Minimização de dados coletados', 11);
      addText('• Consentimento informado e granular', 11);
      addText('• Anonimização de dados analíticos', 11);
      addText('• Logs com retenção limitada', 11);
      addText('• Direito ao esquecimento implementado', 11);

      // 9. MELHORIAS SEGURANÇA
      addNewPage();
      addText('9. Plano de Melhorias de Segurança', 20, true, [0, 0, 255]);
      yPos += 5;

      addText('9.1 Melhorias Implementadas', 16, true);
      addText('✓ Autenticação multifator (MFA)', 11);
      addText('✓ Rate limiting em endpoints críticos', 11);
      addText('✓ Validação de entrada em todos os formulários', 11);
      addText('✓ Sanitização de dados para prevenir XSS', 11);
      addText('✓ Headers de segurança (CSP, HSTS)', 11);
      addText('✓ Timeout de sessão ajustado para 1 hora (segurança + usabilidade)', 11);
      addText('✓ Correção de timezone para garantir consistência de datas', 11);
      yPos += 3;

      addText('9.2 Próximas Melhorias', 16, true);
      addText('• Testes de penetração trimestrais', 11);
      addText('• Certificação ISO 27001', 11);
      addText('• Security Operations Center (SOC)', 11);
      addText('• Análise comportamental de usuários', 11);

      // 10. DISASTER RECOVERY
      addNewPage();
      addText('10. Disaster Recovery e BCP', 20, true, [0, 0, 255]);
      yPos += 5;

      addText('10.1 Estratégia de Backup', 16, true);
      addText('• Backups automáticos diários', 11);
      addText('• Retenção de 30 dias', 11);
      addText('• Backup geográfico distribuído', 11);
      addText('• Testes de restauração mensais', 11);
      yPos += 3;

      addText('10.2 RTO e RPO', 16, true);
      addText('• RTO (Recovery Time Objective): 4 horas', 11);
      addText('• RPO (Recovery Point Objective): 24 horas', 11);
      yPos += 3;

      addText('10.3 Plano de Contingência', 16, true);
      addText('1. Identificação do incidente', 11);
      addText('2. Ativação do comitê de crise', 11);
      addText('3. Avaliação de impacto', 11);
      addText('4. Execução do plano de recuperação', 11);
      addText('5. Comunicação com stakeholders', 11);
      addText('6. Restauração de serviços', 11);
      addText('7. Post-mortem e lessons learned', 11);

      // Adicionar footer na última página
      addFooter();

      // Salvar PDF
      doc.save(`AlmoxHub_Documentacao_Tecnica_${new Date().toISOString().split('T')[0]}.pdf`);

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