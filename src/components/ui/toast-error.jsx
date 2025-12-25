import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

/**
 * Utilitários para feedback de erros e sucesso consistente
 */

export const showError = (message, description) => {
  toast.error(message, {
    description,
    icon: <AlertCircle className="w-4 h-4" />,
    duration: 5000,
  });
};

export const showSuccess = (message, description) => {
  toast.success(message, {
    description,
    icon: <CheckCircle2 className="w-4 h-4" />,
    duration: 3000,
  });
};

export const showInfo = (message, description) => {
  toast.info(message, {
    description,
    icon: <Info className="w-4 h-4" />,
    duration: 4000,
  });
};