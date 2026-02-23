import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ConsentimentoModal({ open, onAccept }) {
  const [user, setUser] = useState(null);
  const [consentimentos, setConsentimentos] = useState({
    uso_basico: false,
    notificacoes_push: false,
    email_marketing: false
  });
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const canAccept = consentimentos.uso_basico; // Uso básico é obrigatório

  const handleAccept = async () => {
    if (!canAccept || !user) return;

    setIsAccepting(true);
    try {
      // Buscar versão ativa dos termos
      const termosAtivos = await base44.entities.TermosUso.filter({ ativo: true });
      const versaoAtual = termosAtivos[0]?.versao || 'v1.0';

      // Obter IP do cliente
      const ipOrigem = await getClientIP();

      // Registrar consentimentos
      const consentimentosArray = Object.entries(consentimentos)
        .filter(([_, aceito]) => aceito)
        .map(([finalidade]) => ({
          user_id: user.id,
          finalidade,
          versao_termos: versaoAtual,
          aceito: true,
          data_consentimento: new Date().toISOString(),
          ip_origem: ipOrigem,
          user_agent: navigator.userAgent,
          revogado: false
        }));

      await base44.entities.Consentimento.bulkCreate(consentimentosArray);
      onAccept();
    } catch (error) {
      console.error('Erro ao salvar consentimentos:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const getClientIP = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh]" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Termos de Uso e Política de Privacidade</DialogTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Bem-vindo ao AlmoxHub - Por favor, revise e aceite os termos
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-96 pr-4">
          <div className="space-y-6">
            {/* Termos de Uso */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Termos de Uso</h3>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                <p>
                  O AlmoxHub é um sistema de gestão de almoxarifados da Axia Energia, destinado ao uso 
                  exclusivo de colaboradores autorizados.
                </p>
                <p>
                  Ao utilizar este sistema, você concorda em:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Utilizar o sistema apenas para fins profissionais relacionados à sua função</li>
                  <li>Manter a confidencialidade de suas credenciais de acesso</li>
                  <li>Não compartilhar informações sensíveis fora do sistema</li>
                  <li>Reportar imediatamente qualquer atividade suspeita</li>
                  <li>Respeitar os direitos de privacidade de outros usuários</li>
                </ul>
              </div>
            </div>

            {/* Política de Privacidade */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Política de Privacidade</h3>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                <p>
                  <strong>Dados coletados:</strong> Nome, email, matrícula, função, regional, 
                  almoxarifados vinculados, foto de perfil.
                </p>
                <p>
                  <strong>Finalidade:</strong> Gestão de ordens de serviço, controle de almoxarifados, 
                  comunicação entre equipes, auditoria de operações.
                </p>
                <p>
                  <strong>Segurança:</strong> Todos os dados são criptografados em repouso e em trânsito. 
                  Logs de auditoria registram todas as ações realizadas no sistema.
                </p>
                <p>
                  <strong>Seus direitos:</strong> Você pode acessar, corrigir ou solicitar a exclusão 
                  de seus dados pessoais a qualquer momento através do menu de perfil.
                </p>
              </div>
            </div>

            {/* Consentimentos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Consentimentos</h3>
              
              <label className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <Checkbox
                  checked={consentimentos.uso_basico}
                  onCheckedChange={(checked) => setConsentimentos(prev => ({ ...prev, uso_basico: checked }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    Uso Básico do Sistema (Obrigatório)
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Autorizo o processamento dos meus dados pessoais para uso do AlmoxHub conforme 
                    descrito nos Termos de Uso e Política de Privacidade.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <Checkbox
                  checked={consentimentos.notificacoes_push}
                  onCheckedChange={(checked) => setConsentimentos(prev => ({ ...prev, notificacoes_push: checked }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    Notificações Push (Opcional)
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Receber notificações push sobre atualizações importantes, menções e alertas.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <Checkbox
                  checked={consentimentos.email_marketing}
                  onCheckedChange={(checked) => setConsentimentos(prev => ({ ...prev, email_marketing: checked }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    Comunicações por Email (Opcional)
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Receber emails sobre novidades, atualizações do sistema e dicas de uso.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <div className="w-full">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Ao clicar em "Aceito", você confirma que leu e concorda com nossos Termos de Uso 
              e Política de Privacidade. Você pode revogar consentimentos opcionais a qualquer momento 
              nas configurações de notificações.
            </p>
            <Button 
              onClick={handleAccept} 
              disabled={!canAccept || isAccepting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isAccepting ? 'Processando...' : 'Aceito os Termos e Condições'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}