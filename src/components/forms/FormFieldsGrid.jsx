import React from 'react';

/**
 * Componente para grid de campos em formulários
 * Padroniza o layout responsivo
 * 
 * Props:
 * - children: ReactNode
 * - cols: number - número de colunas (padrão: 3)
 */
export default function FormFieldsGrid({
  children,
  cols = 3
}) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6'
  };

  return (
    <div className={`grid ${colClasses[cols] || colClasses[3]} gap-5`}>
      {children}
    </div>
  );
}