import React from 'react';

function getTextColor(hexColor) {
  const hex = (hexColor || '000000').replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export default function RotuloBadges({ rotulos = [], max = 3 }) {
  if (!rotulos || rotulos.length === 0) return null;

  const visible = rotulos.slice(0, max);
  const extra = rotulos.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(r => (
        <span
          key={r.id}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium leading-none"
          style={{ backgroundColor: r.cor, color: getTextColor(r.cor) }}
          title={r.nome}
        >
          {r.nome}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium leading-none bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          +{extra}
        </span>
      )}
    </div>
  );
}