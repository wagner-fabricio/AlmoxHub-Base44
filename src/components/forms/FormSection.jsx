import React from 'react';

/**
 * Componente para seções dentro de formulários
 * Mantém o padrão visual do formulário de OS
 * 
 * Props:
 * - title: string - título da seção
 * - children: ReactNode - conteúdo da seção
 * - accentColor: string - cor da barra lateral (padrão: verde)
 */
export default function FormSection({
  title,
  children,
  accentColor = '#22c55e'
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
        <div
          className="w-1 h-4 rounded-full"
          style={{
            background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}80)`
          }}
        />
        {title}
      </h3>
      {children}
    </div>
  );
}