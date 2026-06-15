import React from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TIPOS_ERRO } from '@/lib/osErros';

export default function TipoErroMultiFilter({ value = [], onChange }) {
  const toggle = (key) => {
    if (value.includes(key)) {
      onChange(value.filter(k => k !== key));
    } else {
      onChange([...value, key]);
    }
  };

  const label = value.length === 0
    ? 'Todos os tipos de erro'
    : value.length === 1
      ? (TIPOS_ERRO.find(t => t.key === value[0])?.label || '1 tipo')
      : `${value.length} tipos selecionados`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-64 justify-between bg-white dark:bg-slate-700 font-normal">
          <span className="flex items-center gap-2 truncate">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <button
          onClick={() => onChange([])}
          className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 mb-1"
        >
          Limpar seleção (todos)
        </button>
        <div className="max-h-72 overflow-y-auto space-y-0.5">
          {TIPOS_ERRO.map(t => (
            <label
              key={t.key}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Checkbox
                checked={value.includes(t.key)}
                onCheckedChange={() => toggle(t.key)}
              />
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.cor }} />
              <span className="text-sm text-slate-700 dark:text-slate-200">{t.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}