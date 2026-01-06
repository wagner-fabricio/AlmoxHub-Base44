import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AlertasButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleEnviarAlertas = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await base44.functions.call('enviarAlertas');
      setResult({ success: true, data: response });
      
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      setResult({ success: false, error: error.message });
      
      setTimeout(() => setResult(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleEnviarAlertas}
        disabled={loading}
        variant="outline"
        className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Bell className="w-4 h-4 mr-2" />
        )}
        {loading ? 'Enviando Alertas...' : 'Enviar Alertas Agora'}
      </Button>

      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {result.success ? (
              <div className="text-sm">
                <p className="font-semibold mb-1">Alertas enviados com sucesso!</p>
                <ul className="text-xs space-y-1">
                  <li>• {result.data.summary.ordensAtrasadas} alerta(s) de ordens atrasadas</li>
                  <li>• {result.data.summary.ordensParadas} alerta(s) de ordens paradas</li>
                  <li>• {result.data.summary.expedicoesSemSeguro} alerta(s) de expedições sem seguro</li>
                  <li>• {result.data.summary.expedicoesSemTransporte} alerta(s) de expedições sem transporte</li>
                </ul>
                <p className="mt-2 font-medium">Total: {result.data.summary.totalAlertasEnviados} alerta(s)</p>
              </div>
            ) : (
              `Erro ao enviar alertas: ${result.error}`
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}