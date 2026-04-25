import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OSPagination({ currentPage, totalPages, total, onChange }) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * 100 + 1;
  const end = Math.min(currentPage * 100, total);

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Exibindo <strong>{start}–{end}</strong> de <strong>{total}</strong> OS
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}