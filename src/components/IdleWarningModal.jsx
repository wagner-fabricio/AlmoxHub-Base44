import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';

export default function IdleWarningModal({ open, remainingTime, onContinue, onLogout }) {
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <DialogTitle>Sessão Inativa</DialogTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Você está inativo há algum tempo
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-6 py-4 rounded-xl">
              <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Sua sessão será encerrada automaticamente por segurança.
            <br />
            Clique em "Continuar Conectado" para permanecer logado.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onLogout} className="flex-1">
            Sair Agora
          </Button>
          <Button onClick={onContinue} className="flex-1 bg-blue-600 hover:bg-blue-700">
            Continuar Conectado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}