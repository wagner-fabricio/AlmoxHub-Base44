import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ConsentimentosPage() {
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: consentimentos = [], isLoading } = useQuery({
    queryKey: ['consentimentos', user?.id],
    queryFn: () => user ? base44.entities.Consentimento.filter({ user_id: user.id }) : [],
    enabled: !!user
  });

  const revogarMutation = useMutation({
    mutationFn: (consentimentoId) => base44.entities.Consentimento.update(consentimentoId, {
      revogado: true,
      data_revogacao: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['consentimentos']);
    }
  });

  const getFinalidadeLabel = (finalidade) => {
    const labels = {
      uso_basico: 'Uso Básico do Sistema',
      notificacoes_push: 'Notificações Push',
      email_marketing: 'Comunicações por Email',
      compartilhamento_terceiros: 'Compartilhamento com Terceiros'
    };
    return labels[finalidade] || finalidade;
  };

  const consentimentosAtivos = consentimentos.filter(c => c.aceito && !c.revogado);
  const consentimentosRevogados = consentimentos.filter(c => c.revogado);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meus Consentimentos</h1>
            <p className="text-slate-600 dark:text-slate-400">Gerencie suas preferências de privacidade</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Consentimentos Ativos</p>
                <p className="text-2xl font-bold text-green-600">{consentimentosAtivos.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Revogados</p>
                <p className="text-2xl font-bold text-red-600">{consentimentosRevogados.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Versão dos Termos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {consentimentos[0]?.versao_termos || 'v1.0'}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consentimentos Ativos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Consentimentos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consentimentosAtivos.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              Nenhum consentimento ativo
            </p>
          ) : (
            <div className="space-y-3">
              {consentimentosAtivos.map(c => (
                <div key={c.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {getFinalidadeLabel(c.finalidade)}
                      </h4>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400">
                        <span>Aceito em: {format(new Date(c.data_consentimento), 'dd/MM/yyyy HH:mm')}</span>
                        <span>•</span>
                        <span>Versão: {c.versao_termos}</span>
                      </div>
                    </div>
                    {c.finalidade !== 'uso_basico' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revogarMutation.mutate(c.id)}
                        disabled={revogarMutation.isPending}
                      >
                        Revogar
                      </Button>
                    )}
                  </div>
                  {c.finalidade === 'uso_basico' && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Este consentimento é obrigatório para usar o sistema
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consentimentos Revogados */}
      {consentimentosRevogados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Histórico de Revogações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consentimentosRevogados.map(c => (
                <div key={c.id} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                    {getFinalidadeLabel(c.finalidade)}
                  </h4>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div>Aceito em: {format(new Date(c.data_consentimento), 'dd/MM/yyyy HH:mm')}</div>
                    <div className="text-red-600 dark:text-red-400 font-medium">
                      Revogado em: {format(new Date(c.data_revogacao), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>ℹ️ Seus direitos:</strong> Você pode revogar consentimentos opcionais a qualquer momento.
            Para exercer outros direitos (acesso, correção, exclusão de dados), entre em contato com o DPO
            através do Portal do Titular (em breve).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}