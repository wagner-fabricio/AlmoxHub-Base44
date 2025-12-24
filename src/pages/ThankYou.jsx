import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function ThankYou() {
  const handleBackToLogin = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Obrigado por utilizar o AlmoxHub!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-2 text-lg">
            Sua sessão foi encerrada com sucesso.
          </p>
          <p className="text-slate-500 dark:text-slate-500 mb-8">
            Esperamos vê-lo novamente em breve. Até a próxima! 🚀
          </p>
          <Button 
            onClick={handleBackToLogin} 
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            Voltar ao Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}