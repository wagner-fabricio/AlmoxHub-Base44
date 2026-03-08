import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

export default function ProjetoGauge({ value = 0, size = 90 }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const remaining = 100 - clampedValue;

  // Semicircle gauge: total angle = 180deg
  const data = [
    { value: clampedValue },
    { value: remaining },
  ];

  const getColor = (v) => {
    if (v >= 75) return '#22c55e';
    if (v >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(clampedValue);

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div style={{ position: 'relative', width: size, height: size / 2 + 8, overflow: 'hidden' }}>
        <PieChart width={size} height={size}>
          <Pie
            data={[{ value: 100 }]}
            cx={size / 2}
            cy={size / 2}
            startAngle={180}
            endAngle={0}
            innerRadius={size * 0.32}
            outerRadius={size * 0.42}
            dataKey="value"
            stroke="none"
          >
            <Cell fill="#e2e8f0" />
          </Pie>
          <Pie
            data={data}
            cx={size / 2}
            cy={size / 2}
            startAngle={180}
            endAngle={0}
            innerRadius={size * 0.32}
            outerRadius={size * 0.42}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="transparent" />
          </Pie>
        </PieChart>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: size * 0.18, fontWeight: 700, color, lineHeight: 1 }}>
            {Math.round(clampedValue)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-0.5">Progresso</span>
    </div>
  );
}