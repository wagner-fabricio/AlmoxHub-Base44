import React from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail } from 'lucide-react';

export default function PendingApproval() {
  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Aguardando Aprovação
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Seu cadastro foi enviado com sucesso e está aguardando aprovação dos administradores do sistema.
          </p>
          <div className="bg-blue-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700 dark:text-slate-300 text-left">
                Assim que sua conta for aprovada, você receberá um e-mail de confirmação com instruções 
                para acessar o sistema completo. Obrigado pela paciência!
              </p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Sair do Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}