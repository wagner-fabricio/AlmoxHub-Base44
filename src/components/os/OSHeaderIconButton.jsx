import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Botão de ícone compacto para o header de modais de OS.
 * Mostra um tooltip com o label ao passar o mouse.
 */
export default function OSHeaderIconButton({ icon: Icon, label, onClick, disabled, variant = 'ghost' }) {
  const base = 'flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    ghost: 'bg-white/20 hover:bg-white/30 text-white',
    solid: 'bg-white text-blue-800 hover:bg-blue-50',
  };
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={`${base} ${variants[variant] || variants.ghost}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}